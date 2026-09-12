import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const harness = readFileSync("scripts/check-dashboard-responsive-accessibility.mjs", "utf8");

for (const viewport of [
  "320x568",
  "390x844",
  "768x1024",
  "1024x768",
  "1280x800",
  "1440x900",
]) {
  assert.ok(harness.includes(`name: "${viewport}"`));
}

for (const behavior of [
  "Skip to dashboard content",
  "Collapse sidebar",
  "Clients",
  "Open workspace navigation",
  "Workspace navigation",
  'page.keyboard.press("Escape")',
  "document.activeElement",
  'style.zoom = "2"',
]) {
  assert.ok(harness.includes(behavior), `responsive harness must check ${behavior}`);
}

assert.match(harness, /result\.scrollWidth <= result\.clientWidth \+ 1/);
assert.match(harness, /item\.width < 44 \|\| item\.height < 44/);
assert.match(harness, /Missing required environment variable/);
assert.ok(!harness.includes("SUPABASE_SERVICE_ROLE_KEY"));

console.log("OK dashboard responsive harness contract checks passed");
