import {
  DEMO_OWNER_EMAIL,
  ensureBookingDatabase,
  expiredSessionCookie,
  getBookingDb,
  ownerPassword,
  OWNER_COOKIE,
  readCookie,
  sessionCookie,
  sessionIsValid,
} from "../../../../db/booking";

export async function GET(request: Request) {
  const authenticated = await sessionIsValid(request);
  return Response.json({ authenticated, email: authenticated ? DEMO_OWNER_EMAIL : null });
}

export async function POST(request: Request) {
  await ensureBookingDatabase();
  const payload = (await request.json()) as { email?: string; password?: string };
  const expectedPassword = ownerPassword(request);
  if (!expectedPassword) {
    return Response.json({ error: "Owner sign-in has not been configured for this environment." }, { status: 503 });
  }
  if (payload.email?.trim().toLowerCase() !== DEMO_OWNER_EMAIL || payload.password !== expectedPassword) {
    return Response.json({ error: "The email or password is incorrect." }, { status: 401 });
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 7 * 86_400_000);
  await getBookingDb().prepare("DELETE FROM owner_sessions WHERE expires_at <= ?").bind(createdAt.toISOString()).run();
  await getBookingDb().prepare("INSERT INTO owner_sessions (token, expires_at, created_at) VALUES (?, ?, ?)")
    .bind(token, expiresAt.toISOString(), createdAt.toISOString()).run();

  return Response.json(
    { authenticated: true, email: DEMO_OWNER_EMAIL },
    { headers: { "Set-Cookie": sessionCookie(token, request) } },
  );
}

export async function DELETE(request: Request) {
  await ensureBookingDatabase();
  const token = readCookie(request, OWNER_COOKIE);
  if (token) await getBookingDb().prepare("DELETE FROM owner_sessions WHERE token = ?").bind(token).run();
  return Response.json(
    { authenticated: false },
    { headers: { "Set-Cookie": expiredSessionCookie(request) } },
  );
}
