import {
  addMinutes,
  AppointmentRecord,
  BlockRecord,
  ensureBookingDatabase,
  getBookingDb,
  minutesToTime,
  ServiceRecord,
  shopDate,
  timeToMinutes,
} from "../../../db/booking";

const DAY_WINDOWS: Record<number, [number, number] | null> = {
  0: null,
  1: [540, 1080],
  2: [540, 1080],
  3: [540, 1080],
  4: [540, 1080],
  5: [540, 1020],
  6: [540, 840],
};

function publicAppointment(row: AppointmentRecord) {
  return {
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    serviceId: row.service_id,
    serviceName: row.service_name,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    price: row.price,
    status: row.status,
  };
}

function serviceJson(row: ServiceRecord) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    duration: row.duration,
    price: row.price,
    active: Boolean(row.active),
  };
}

async function availableSlots(date: string, service: ServiceRecord, excludeId?: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const window = DAY_WINDOWS[day];
  if (!window || date < shopDate()) return [];

  const db = getBookingDb();
  const appointments = await db.prepare(
    `SELECT * FROM appointments
     WHERE date = ? AND status NOT IN ('cancelled', 'no_show')${excludeId ? " AND id != ?" : ""}`,
  ).bind(...(excludeId ? [date, excludeId] : [date])).all<AppointmentRecord>();
  const blocks = await db.prepare("SELECT * FROM schedule_blocks WHERE date = ?").bind(date).all<BlockRecord>();
  const nowParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const nowMinutes = Number(nowParts.find((part) => part.type === "hour")?.value ?? 0) * 60
    + Number(nowParts.find((part) => part.type === "minute")?.value ?? 0);

  const slots: string[] = [];
  for (let start = window[0]; start + service.duration <= window[1]; start += 30) {
    if (date === shopDate() && start < nowMinutes + 45) continue;
    const end = start + service.duration;
    const appointmentConflict = appointments.results.some((appointment) =>
      start < timeToMinutes(appointment.end_time) && end > timeToMinutes(appointment.start_time),
    );
    const blockConflict = blocks.results.some((block) =>
      Boolean(block.all_day) || (start < timeToMinutes(block.end_time) && end > timeToMinutes(block.start_time)),
    );
    if (!appointmentConflict && !blockConflict) slots.push(minutesToTime(start));
  }
  return slots;
}

export async function GET(request: Request) {
  try {
    await ensureBookingDatabase();
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (token) {
      const appointment = await getBookingDb()
        .prepare("SELECT * FROM appointments WHERE manage_token = ?")
        .bind(token)
        .first<AppointmentRecord>();
      if (!appointment) return Response.json({ error: "Appointment not found." }, { status: 404 });
      return Response.json({ appointment: publicAppointment(appointment) });
    }

    const services = await getBookingDb()
      .prepare("SELECT * FROM services WHERE active = 1 ORDER BY sort_order, name")
      .all<ServiceRecord>();
    const date = url.searchParams.get("date");
    const serviceId = url.searchParams.get("serviceId");
    const service = services.results.find((item) => item.id === serviceId) ?? services.results[0];
    const slots = date && service ? await availableSlots(date, service) : [];
    return Response.json({ services: services.results.map(serviceJson), slots });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Booking is temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureBookingDatabase();
    const payload = (await request.json()) as Record<string, string>;
    const customerName = payload.customerName?.trim();
    const email = payload.email?.trim().toLowerCase();
    const phone = payload.phone?.trim();
    const notes = payload.notes?.trim() ?? "";
    const date = payload.date;
    const startTime = payload.startTime;
    const serviceId = payload.serviceId;
    if (!customerName || !email || !phone || !date || !startTime || !serviceId) {
      return Response.json({ error: "Please complete every required field." }, { status: 400 });
    }

    const service = await getBookingDb().prepare("SELECT * FROM services WHERE id = ? AND active = 1").bind(serviceId).first<ServiceRecord>();
    if (!service) return Response.json({ error: "That service is no longer available." }, { status: 400 });
    const slots = await availableSlots(date, service);
    if (!slots.includes(startTime)) return Response.json({ error: "That time was just taken. Please choose another." }, { status: 409 });

    const autoConfirm = await getBookingDb().prepare("SELECT value FROM settings WHERE key = 'autoConfirm'").first<{ value: string }>();
    const createdAt = new Date().toISOString();
    const manageToken = crypto.randomUUID().replaceAll("-", "");
    const appointment: AppointmentRecord = {
      id: `apt_${crypto.randomUUID()}`,
      manage_token: manageToken,
      customer_name: customerName,
      phone,
      email,
      notes,
      service_id: service.id,
      service_name: service.name,
      date,
      start_time: startTime,
      end_time: addMinutes(startTime, service.duration),
      duration: service.duration,
      price: service.price,
      status: autoConfirm?.value === "false" ? "pending" : "confirmed",
      source: "online",
      created_at: createdAt,
      updated_at: createdAt,
    };
    await getBookingDb().prepare(
      `INSERT INTO appointments (
        id, manage_token, customer_name, phone, email, notes, service_id, service_name,
        date, start_time, end_time, duration, price, status, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(...Object.values(appointment)).run();
    return Response.json({ appointment: publicAppointment(appointment), manageToken }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "We could not finish the booking." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureBookingDatabase();
    const payload = (await request.json()) as Record<string, string>;
    const token = payload.token;
    const appointment = token
      ? await getBookingDb().prepare("SELECT * FROM appointments WHERE manage_token = ?").bind(token).first<AppointmentRecord>()
      : null;
    if (!appointment) return Response.json({ error: "Appointment not found." }, { status: 404 });
    if (["completed", "cancelled", "no_show"].includes(appointment.status)) {
      return Response.json({ error: "This appointment can no longer be changed online." }, { status: 400 });
    }

    if (payload.action === "cancel") {
      await getBookingDb().prepare("UPDATE appointments SET status = 'cancelled', updated_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), appointment.id).run();
    } else if (payload.action === "reschedule") {
      const service = await getBookingDb().prepare("SELECT * FROM services WHERE id = ? AND active = 1")
        .bind(payload.serviceId || appointment.service_id).first<ServiceRecord>();
      if (!service || !payload.date || !payload.startTime) return Response.json({ error: "Choose a valid new time." }, { status: 400 });
      const slots = await availableSlots(payload.date, service, appointment.id);
      if (!slots.includes(payload.startTime)) return Response.json({ error: "That time is no longer available." }, { status: 409 });
      await getBookingDb().prepare(
        `UPDATE appointments SET service_id = ?, service_name = ?, date = ?, start_time = ?, end_time = ?,
         duration = ?, price = ?, status = 'confirmed', updated_at = ? WHERE id = ?`,
      ).bind(service.id, service.name, payload.date, payload.startTime, addMinutes(payload.startTime, service.duration), service.duration, service.price, new Date().toISOString(), appointment.id).run();
    } else {
      return Response.json({ error: "Unknown appointment action." }, { status: 400 });
    }

    const updated = await getBookingDb().prepare("SELECT * FROM appointments WHERE id = ?").bind(appointment.id).first<AppointmentRecord>();
    return Response.json({ appointment: updated ? publicAppointment(updated) : null });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "We could not update the appointment." }, { status: 500 });
  }
}
