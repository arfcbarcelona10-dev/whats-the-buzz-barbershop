import {
  addMinutes,
  AppointmentRecord,
  BlockRecord,
  ensureBookingDatabase,
  getBookingDb,
  ServiceRecord,
  sessionIsValid,
} from "../../../db/booking";

async function requireOwner(request: Request) {
  if (!(await sessionIsValid(request))) {
    return Response.json({ error: "Owner sign-in required." }, { status: 401 });
  }
  return null;
}

async function dashboardData() {
  const db = getBookingDb();
  const [appointments, services, blocks, settings] = await Promise.all([
    db.prepare("SELECT * FROM appointments ORDER BY date, start_time").all<AppointmentRecord>(),
    db.prepare("SELECT * FROM services ORDER BY sort_order, name").all<ServiceRecord>(),
    db.prepare("SELECT * FROM schedule_blocks ORDER BY date, start_time").all<BlockRecord>(),
    db.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>(),
  ]);
  return {
    appointments: appointments.results.map((item) => ({
      id: item.id,
      customerName: item.customer_name,
      phone: item.phone,
      email: item.email,
      notes: item.notes,
      serviceId: item.service_id,
      serviceName: item.service_name,
      date: item.date,
      startTime: item.start_time,
      endTime: item.end_time,
      duration: item.duration,
      price: item.price,
      status: item.status,
      source: item.source,
      createdAt: item.created_at,
    })),
    services: services.results.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      duration: item.duration,
      price: item.price,
      active: Boolean(item.active),
      sortOrder: item.sort_order,
    })),
    blocks: blocks.results.map((item) => ({
      id: item.id,
      date: item.date,
      startTime: item.start_time,
      endTime: item.end_time,
      label: item.label,
      allDay: Boolean(item.all_day),
    })),
    settings: Object.fromEntries(settings.results.map((item) => [item.key, item.value])),
  };
}

export async function GET(request: Request) {
  try {
    await ensureBookingDatabase();
    const unauthorized = await requireOwner(request);
    if (unauthorized) return unauthorized;
    return Response.json(await dashboardData());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Dashboard data is unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureBookingDatabase();
    const unauthorized = await requireOwner(request);
    if (unauthorized) return unauthorized;
    const payload = (await request.json()) as Record<string, unknown>;
    const action = String(payload.action ?? "");
    const db = getBookingDb();
    const now = new Date().toISOString();

    if (action === "appointmentStatus") {
      const allowed = ["pending", "confirmed", "completed", "cancelled", "no_show"];
      const status = String(payload.status ?? "");
      if (!allowed.includes(status)) return Response.json({ error: "Invalid appointment status." }, { status: 400 });
      await db.prepare("UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?")
        .bind(status, now, String(payload.id)).run();
    } else if (action === "walkIn") {
      const service = await db.prepare("SELECT * FROM services WHERE id = ?").bind(String(payload.serviceId)).first<ServiceRecord>();
      if (!service || !payload.customerName || !payload.date || !payload.startTime || !payload.phone) {
        return Response.json({ error: "Name, phone, service, date, and time are required." }, { status: 400 });
      }
      const startTime = String(payload.startTime);
      await db.prepare(
        `INSERT INTO appointments (
          id, manage_token, customer_name, phone, email, notes, service_id, service_name,
          date, start_time, end_time, duration, price, status, source, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'walk-in', ?, ?)`,
      ).bind(
        `apt_${crypto.randomUUID()}`,
        crypto.randomUUID().replaceAll("-", ""),
        String(payload.customerName).trim(),
        String(payload.phone).trim(),
        String(payload.email ?? "").trim(),
        String(payload.notes ?? "").trim(),
        service.id,
        service.name,
        String(payload.date),
        startTime,
        addMinutes(startTime, service.duration),
        service.duration,
        service.price,
        now,
        now,
      ).run();
    } else if (action === "createBlock") {
      if (!payload.date || !payload.label) return Response.json({ error: "Date and label are required." }, { status: 400 });
      await db.prepare(
        "INSERT INTO schedule_blocks (id, date, start_time, end_time, label, all_day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        `block_${crypto.randomUUID()}`,
        String(payload.date),
        String(payload.startTime ?? "09:00"),
        String(payload.endTime ?? "17:00"),
        String(payload.label).trim(),
        payload.allDay ? 1 : 0,
        now,
      ).run();
    } else if (action === "deleteBlock") {
      await db.prepare("DELETE FROM schedule_blocks WHERE id = ?").bind(String(payload.id)).run();
    } else if (action === "updateService") {
      const duration = Number(payload.duration);
      const price = Number(payload.price);
      if (!Number.isFinite(duration) || !Number.isFinite(price) || duration < 15 || price < 0) {
        return Response.json({ error: "Enter a valid duration and price." }, { status: 400 });
      }
      await db.prepare("UPDATE services SET duration = ?, price = ?, active = ? WHERE id = ?")
        .bind(duration, price, payload.active ? 1 : 0, String(payload.id)).run();
    } else if (action === "settings") {
      const values = payload.values as Record<string, string | boolean | number>;
      const allowed = ["emailReminders", "smsReminders", "reminderLead", "autoConfirm", "businessName"];
      await db.batch(
        Object.entries(values).filter(([key]) => allowed.includes(key)).map(([key, value]) =>
          db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind(key, String(value)),
        ),
      );
    } else {
      return Response.json({ error: "Unknown dashboard action." }, { status: 400 });
    }

    return Response.json(await dashboardData());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The change could not be saved." }, { status: 500 });
  }
}
