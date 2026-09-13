import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const designSystem = read("src/components/design-system.tsx");
const globals = read("src/app/globals.css");
const dashboardLayout = read("src/app/(dashboard)/dashboard/layout.tsx");
const sidebar = read("src/components/dashboard-sidebar.tsx");
const login = read("src/app/(auth)/login/page.tsx");
const signup = read("src/app/(auth)/signup/page.tsx");
const remediationPlan = read("docs/UI-UX-Remediation-Plan.md");

for (const token of [
  "pageHeaderClassName",
  "pageTitleClassName",
  "pageDescriptionClassName",
  "sectionCardHeaderClassName",
  "sectionCardTitleClassName",
  "sectionCardDescriptionClassName",
]) {
  assert(
    designSystem.includes(`export const ${token}`),
    `Shared hierarchy token is missing: ${token}.`,
  );
}

assert(
  designSystem.includes("md:text-[1.625rem]") &&
    !designSystem.includes("md:text-[1.75rem]") &&
    !designSystem.includes("md:text-3xl"),
  "Dashboard page title hierarchy should use the recorded compact 26px desktop step, not an unapproved 28px+ jump.",
);

assert(
    designSystem.includes('export const tableHeadCellClass = "px-4 py-2.5 font-medium"') &&
    designSystem.includes('export const tableCellClass = "px-4 py-2.5 align-middle"') &&
    designSystem.includes("k-row") &&
    globals.includes("min-height: 46px"),
  "Table density should be deliberate while preserving row containment.",
);

assert(
  dashboardLayout.includes("h-14") &&
    sidebar.includes('isCollapsed ? "w-[76px]" : "w-[280px]"') &&
    sidebar.includes("rounded-[1.375rem]") &&
    sidebar.includes("DashboardUtilityNav"),
  "The approved reference-inspired shell should retain the 56px topbar while using the shared rounded 280/76px sidebar baseline.",
);

for (const source of [login, signup]) {
  assert(
    source.includes("ActionLink") &&
      source.includes('size="md"') &&
      !source.includes("inline-flex h-9 w-full"),
    "Auth secondary CTAs should use the shared ActionLink rhythm instead of one-off 36px links.",
  );
}

for (const forbidden of [
  "CtrlK",
  "notifications",
  "staff avatars",
  "all-queues",
  "global search",
]) {
  assert(
    !designSystem.includes(forbidden) && !dashboardLayout.includes(forbidden),
    `R12A must not introduce screenshot-only feature chrome: ${forbidden}.`,
  );
}

assert(
  remediationPlan.includes("D07 — Visual density"),
  "Remediation plan must keep the visual-density decision boundary visible.",
);

console.log("Deliberate density and hierarchy contracts passed.");
