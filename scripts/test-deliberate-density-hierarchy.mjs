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
  "tinyLabelClassName",
  "sidebarSectionLabelClassName",
  "dashboardMetricValueClassName",
  "dashboardMetaNumericClassName",
  "dashboardStatValueClassName",
  "topbarIconButtonClassName",
  "profilePillClassName",
  "commandInputClassName",
  "functionalIconClassName",
  "functionalIconStrokeWidth",
  "publicBrandHomeLinkClassName",
  "authBackLinkClassName",
]) {
  assert(
    designSystem.includes(`export const ${token}`),
    `Shared hierarchy token is missing: ${token}.`,
  );
}

for (const primitive of [
  "TopbarIconButton",
  "ProfilePill",
  "IconBadge",
  "StatusBadge",
  "CommandOption",
]) {
  assert(
    designSystem.includes(`export function ${primitive}`),
    `Shared UI primitive is missing: ${primitive}.`,
  );
}

assert(
  designSystem.includes("text-[1.375rem]") &&
    designSystem.includes("tracking-[-0.02em]") &&
    !designSystem.includes("md:text-[1.75rem]") &&
    !designSystem.includes("md:text-3xl"),
  "Dashboard page title hierarchy should use the pasted 22px compact operations-console step.",
);

assert(
    designSystem.includes('export const tableHeaderClass =') &&
    designSystem.includes("h-9 bg-khata-paperMuted/95 text-[11px] uppercase") &&
    designSystem.includes('export const tableHeadCellClass = "px-4 py-2.5 font-semibold leading-4"') &&
    designSystem.includes('export const tableCellClass = "px-4 py-2.5 align-middle"') &&
    designSystem.includes("k-row") &&
    globals.includes("min-height: 44px"),
  "Table density should follow the pasted 36px header and 44px row rhythm.",
);

assert(
  dashboardLayout.includes("min-h-14") &&
    dashboardLayout.includes('className="flex min-h-screen p-0"') &&
    dashboardLayout.includes('className="min-w-0 flex-1 scroll-mt-14 outline-none"') &&
    !dashboardLayout.includes("lg:top-4") &&
    !dashboardLayout.includes("lg:rounded-2xl lg:border lg:shadow-xs") &&
    sidebar.includes('isCollapsed ? "w-16" : "w-[240px]"') &&
    sidebar.includes("sticky top-0 hidden h-screen") &&
    !sidebar.includes("rounded-[1.375rem]") &&
    sidebar.includes("DashboardUtilityNav"),
  "The approved shell should use the pasted 56px header and rectangular flush-left 240/64px sidebar width baseline.",
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
