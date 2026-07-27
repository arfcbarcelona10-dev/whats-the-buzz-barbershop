import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function source(pathname) {
  return readFile(new URL(pathname, projectRoot), "utf8");
}

test("public site routes visitors into online booking", async () => {
  const homepage = await source("app/BarberSite.tsx");
  assert.match(homepage, /href="\/book"/);
  assert.match(homepage, /Book your chair/);
  assert.match(homepage, /Walk-ins welcome/);
});

test("client booking includes service, availability, contact, and management flows", async () => {
  const booking = await source("app/book/BookingApp.tsx");
  assert.match(booking, /What are we sharpening up/);
  assert.match(booking, /When should we hold the chair/);
  assert.match(booking, /Confirm appointment/);
  assert.match(booking, /reschedule/);
  assert.match(booking, /cancel/);
});

test("owner studio includes protected operations", async () => {
  const [owner, sessionApi, ownerApi] = await Promise.all([
    source("app/owner/OwnerApp.tsx"),
    source("app/api/owner/session/route.ts"),
    source("app/api/owner/route.ts"),
  ]);
  assert.match(owner, /Owner studio/);
  assert.match(owner, /Add walk-in/);
  assert.match(owner, /Services & pricing/);
  assert.match(owner, /Block time/);
  assert.match(sessionApi, /HttpOnly|sessionCookie/);
  assert.match(ownerApi, /sessionIsValid/);
});
