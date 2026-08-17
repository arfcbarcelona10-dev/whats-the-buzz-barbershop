import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function source(pathname) {
  return readFile(new URL(pathname, projectRoot), "utf8");
}

test("public site routes every appointment action to Booksy", async () => {
  const homepage = await source("app/BarberSite.tsx");
  assert.match(homepage, /const BOOKSY_URL = "https:\/\/booksy\.com\/en-us\/538246_/);
  assert.match(homepage, /Book your chair/);
  assert.match(homepage, /Walk-ins welcome/);
  assert.doesNotMatch(homepage, /href="\/(?:book|owner)"/);
});

test("internal booking and owner routes are removed", async () => {
  await assert.rejects(source("app/book/page.tsx"));
  await assert.rejects(source("app/owner/page.tsx"));
  await assert.rejects(source("app/api/booking/route.ts"));
  await assert.rejects(source("app/api/owner/route.ts"));
});

test("hero and gallery use the updated shop photography", async () => {
  const homepage = await source("app/BarberSite.tsx");
  assert.match(homepage, /buzz-storefront-close\.jpg/);
  assert.match(homepage, /buzz-chair\.jpg/);
  assert.match(homepage, /buzz-front-door\.jpg/);
  assert.match(homepage, /buzz-storefront-wide\.jpg/);
  assert.match(homepage, /buzz-waiting-area\.jpg/);
  assert.doesNotMatch(homepage, /label: "The (?:craft|finish)"/i);
});
