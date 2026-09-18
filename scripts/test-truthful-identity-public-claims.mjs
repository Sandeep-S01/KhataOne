import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const sidebar = read("src/components/dashboard-sidebar.tsx");
const firmSwitcher = read("src/components/firm-switcher.tsx");
const landing = read("src/app/page.tsx");

assert(
  sidebar.includes("<FirmSwitcher") &&
    firmSwitcher.includes("action={switchFirm}") &&
    firmSwitcher.includes("No other firms available."),
  "Sidebar firm identity must offer only the authenticated user's available workspaces.",
);

assert(
  landing.includes("Illustrative sample"),
  "Landing review queue preview must label sample records as illustrative.",
);

assert(
  landing.includes("record-level confidence") &&
    landing.includes("source evidence") &&
    !landing.includes("Every extracted field shows source context and confidence"),
  "Landing extraction copy must match implemented record-level confidence and source evidence.",
);

assert(
  landing.includes("Direct filing stays outside v1") &&
    landing.includes("not direct filing") &&
    landing.includes("GST prep only") &&
    !landing.includes("India GST Ready"),
  "Landing GST copy must describe preparation/readiness only and avoid filing-ready claims.",
);

assert(
  !landing.includes("fake menus") &&
    !landing.includes("notifications") &&
    !landing.includes("staff assignments"),
  "Landing copy must not add fake menus, notifications, or unimplemented staff assignment claims.",
);

console.log("Truthful identity and public claims contracts passed.");
