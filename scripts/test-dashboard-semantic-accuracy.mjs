import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const settings = read("src/app/(dashboard)/dashboard/settings/page.tsx");
const clients = read("src/app/(dashboard)/dashboard/clients/page.tsx");
const ledger = read("src/app/(dashboard)/dashboard/ledger/page.tsx");
const operations = read("src/app/(dashboard)/dashboard/operations/page.tsx");
const gst = read("src/app/(dashboard)/dashboard/gst-summary/page.tsx");

assert.match(settings, /title="Configuration status"/);
assert.match(settings, /Present/);
assert.match(settings, /Missing/);
assert.match(settings, /does not verify provider connectivity or delivery health/);
assert.match(settings, /of \$\{integrationRows\.length\} present/);
assert.ok(!settings.includes('title="Integration readiness"'));

assert.match(settings, /Not provided/);
assert.match(clients, /Not provided/);
assert.ok(!clients.includes('client.gstin || "Pending"'));

for (const label of ["Page entries", "Page debit", "Page credit"]) {
  assert.ok(ledger.includes(`"${label}"`), `ledger must label ${label}`);
}

for (const label of [
  "No active jobs",
  "No queued events",
  "No completed run",
  "No successful run",
]) {
  assert.ok(operations.includes(`"${label}"`), `operations must render ${label}`);
}

assert.match(gst, /it does not submit GST filings/);

console.log("OK dashboard semantic accuracy checks passed");
