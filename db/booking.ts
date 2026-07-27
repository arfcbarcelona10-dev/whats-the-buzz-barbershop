import { env } from "cloudflare:workers";

type BookingEnv = {
  DB?: D1Database;
  OWNER_PASSWORD?: string;
};

export type ServiceRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  active: number;
  sort_order: number;
};

export type AppointmentRecord = {
  id: string;
  manage_token: string;
  customer_name: string;
  phone: string;
  email: string;
  notes: string;
  service_id: string;
  service_name: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type BlockRecord = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  label: string;
  all_day: number;
  created_at: string;
};

export const DEMO_OWNER_EMAIL = "owner@whatsthebuzz.com";
export const OWNER_COOKIE = "buzz_owner_session";

const DEFAULT_SERVICES = [
  ["signature-cut", "Signature Haircut", "Cuts", "Consultation, tailored cut, hot towel neck finish, and style.", 45, 32, 1],
  ["fade", "Precision Fade", "Cuts", "Skin, taper, or shadow fade finished with crisp detail work.", 45, 35, 2],
  ["cut-beard", "Cut + Beard", "Combinations", "A complete haircut and beard shape with a polished finish.", 60, 48, 3],
  ["beard-trim", "Beard Trim", "Beards", "Shape, line work, and conditioning for a clean profile.", 30, 22, 4],
  ["hot-towel-shave", "Hot Towel Shave", "Shaves", "Traditional straight razor service with hot towels and skin care.", 45, 38, 5],
  ["kids-cut", "Kids' Cut", "Cuts", "A patient, low-pressure cut for kids age 12 and under.", 30, 25, 6],
  ["buzz-cut", "Buzz Cut", "Cuts", "One-length clipper cut with neckline and edge cleanup.", 30, 24, 7],
] as const;

const CREATE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    duration INTEGER NOT NULL,
    price INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    manage_token TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    price INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    source TEXT NOT NULL DEFAULT 'online',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(date, start_time)`,
  `CREATE INDEX IF NOT EXISTS appointments_customer_idx ON appointments(email, phone)`,
  `CREATE TABLE IF NOT EXISTS schedule_blocks (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    label TEXT NOT NULL,
    all_day INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS schedule_blocks_date_idx ON schedule_blocks(date)`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS owner_sessions (
    token TEXT PRIMARY KEY,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
] as const;

let initialized: Promise<void> | null = null;

export function getBookingDb(): D1Database {
  const db = (env as unknown as BookingEnv).DB;
  if (!db) throw new Error("The booking database is unavailable.");
  return db;
}

export async function ensureBookingDatabase() {
  if (!initialized) initialized = initializeDatabase();
  return initialized;
}

async function initializeDatabase() {
  const db = getBookingDb();
  await db.batch(CREATE_STATEMENTS.map((statement) => db.prepare(statement)));

  const serviceCount = await db.prepare("SELECT COUNT(*) AS total FROM services").first<{ total: number }>();
  if (!serviceCount?.total) {
    await db.batch(
      DEFAULT_SERVICES.map((service) =>
        db.prepare(
          "INSERT INTO services (id, name, category, description, duration, price, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
        ).bind(...service),
      ),
    );
  }

  const defaults = {
    emailReminders: "true",
    smsReminders: "true",
    reminderLead: "24",
    autoConfirm: "true",
    businessName: "What's The Buzz?",
  };
  await db.batch(
    Object.entries(defaults).map(([key, value]) =>
      db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").bind(key, value),
    ),
  );
  await db.batch([
    db.prepare("UPDATE settings SET value = ? WHERE key = 'businessName' AND value = ?")
      .bind("What's The Buzz?", "Barber on the Mountain"),
    db.prepare("UPDATE services SET description = ? WHERE id = 'kids-cut' AND description = ?")
      .bind("A patient, low-pressure cut for kids age 12 and under.", "A patient, low-pressure cut for mountain kids age 12 and under."),
  ]);

  const appointmentCount = await db.prepare("SELECT COUNT(*) AS total FROM appointments").first<{ total: number }>();
  if (!appointmentCount?.total) await seedAppointments(db);
}

async function seedAppointments(db: D1Database) {
  const today = shopDate(0);
  const tomorrow = shopDate(1);
  const createdAt = new Date().toISOString();
  const seeds = [
    ["Mason Reed", "(715) 555-0148", "mason@example.com", "signature-cut", "Signature Haircut", today, "09:30", "10:15", 45, 32, "confirmed", "online", "Keep the sides tidy; growing out the top."],
    ["Jordan Lee", "(715) 555-0182", "jordan@example.com", "fade", "Precision Fade", today, "11:00", "11:45", 45, 35, "confirmed", "online", "Low skin fade."],
    ["Noah Bennett", "(715) 555-0194", "noah@example.com", "cut-beard", "Cut + Beard", today, "13:30", "14:30", 60, 48, "pending", "walk-in", "First visit."],
    ["Eli Parker", "(715) 555-0166", "eli@example.com", "kids-cut", "Kids' Cut", today, "15:30", "16:00", 30, 25, "confirmed", "online", "Age 9; prefers scissors."],
    ["Caleb Morgan", "(715) 555-0121", "caleb@example.com", "beard-trim", "Beard Trim", tomorrow, "10:00", "10:30", 30, 22, "confirmed", "online", ""],
  ] as const;

  await db.batch(
    seeds.map((seed) => {
      const [name, phone, email, serviceId, serviceName, date, start, end, duration, price, status, source, notes] = seed;
      return db.prepare(
        `INSERT INTO appointments (
          id, manage_token, customer_name, phone, email, notes, service_id, service_name,
          date, start_time, end_time, duration, price, status, source, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        `apt_${crypto.randomUUID()}`,
        crypto.randomUUID().replaceAll("-", ""),
        name,
        phone,
        email,
        notes,
        serviceId,
        serviceName,
        date,
        start,
        end,
        duration,
        price,
        status,
        source,
        createdAt,
        createdAt,
      );
    }),
  );
}

export function shopDate(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function addMinutes(value: string, minutes: number) {
  return minutesToTime(timeToMinutes(value) + minutes);
}

export function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function ownerPassword(request: Request) {
  const configured = (env as unknown as BookingEnv).OWNER_PASSWORD;
  return configured || null;
}

export async function sessionIsValid(request: Request) {
  await ensureBookingDatabase();
  const token = readCookie(request, OWNER_COOKIE);
  if (!token) return false;
  const row = await getBookingDb()
    .prepare("SELECT token FROM owner_sessions WHERE token = ? AND expires_at > ?")
    .bind(token, new Date().toISOString())
    .first();
  return Boolean(row);
}

export function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  const match = cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function sessionCookie(token: string, request: Request) {
  const secure = isLocalRequest(request) ? "" : "; Secure";
  return `${OWNER_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secure}`;
}

export function expiredSessionCookie(request: Request) {
  const secure = isLocalRequest(request) ? "" : "; Secure";
  return `${OWNER_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}
