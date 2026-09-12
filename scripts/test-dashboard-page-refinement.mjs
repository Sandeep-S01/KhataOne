import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const overview = read("src/app/(dashboard)/dashboard/page.tsx");
const clients = read("src/app/(dashboard)/dashboard/clients/page.tsx");
const ledger = read("src/app/(dashboard)/dashboard/ledger/page.tsx");
const platform = read("src/app/(dashboard)/dashboard/platform/page.tsx");

assert.match(overview, /function attentionTone\(count: number\): "warning" \| "neutral"/);
assert.match(overview, /function positiveTone\(count: number\): "success" \| "neutral"/);
assert.ok(!overview.includes('eyebrow="Overview"'));

for (const label of [
  "Review transactions",
  "Open WhatsApp inbox",
  "View GST periods",
  "View export jobs",
]) {
  assert.ok(overview.includes(`actionLabel: "${label}"`));
}
assert.match(overview, /aria-label=\{item\.actionLabel\}/);
assert.ok(!overview.includes("Open queue"));

assert.match(clients, /<FieldLabel>Current page status counts<\/FieldLabel>/);
assert.match(clients, /Manage client identity, WhatsApp mapping, filing cadence, and status/);

assert.match(ledger, /formatDisplayDate\(entry\.entry_date\)/);
assert.match(ledger, /Approved ledger handoff/);
assert.match(ledger, /Inspect approved handoffs and make audited ledger corrections\./);

assert.equal((platform.match(/status: "Planned"/g) ?? []).length, 5);
assert.ok(!platform.includes("Future gated"));
assert.match(platform, /xl:grid-cols-3/);
assert.ok(!platform.includes("xl:grid-cols-5"));
assert.match(platform, /<StatusChip tone="neutral">\{item\.status\}<\/StatusChip>/);

console.log("OK dashboard page refinement checks passed");
