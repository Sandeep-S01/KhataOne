import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const layout = read("src/app/(dashboard)/dashboard/layout.tsx");
const sidebar = read("src/components/dashboard-sidebar.tsx");
const navigation = read("src/components/dashboard-nav.tsx");
const mobileMenu = read("src/components/dashboard-mobile-menu.tsx");
const topbarActions = read("src/components/dashboard-topbar-actions.tsx");
const designSystem = read("src/components/design-system.tsx");

assert.match(layout, /header className="sticky top-0 z-20 flex min-h-14/);
assert.ok(!layout.includes("lg:top-4"));
assert.ok(!layout.includes("lg:rounded-2xl lg:border lg:shadow-xs"));
assert.match(layout, /className="flex min-h-screen p-0"/);
assert.ok(!layout.includes("gap-4 p-0"));
assert.ok(!layout.includes("lg:pr-4"));
assert.match(layout, /className="min-w-0 flex-1 scroll-mt-14 outline-none"/);
assert.match(layout, /const userEmail = context\?\.user\.email \?\? "CA user"/);
assert.match(layout, /DashboardTopbarActions/);
assert.match(topbarActions, /TopbarIconButton/);
assert.match(topbarActions, /ProfilePill/);
assert.match(topbarActions, /CommandOption/);
assert.match(designSystem, /export const topbarIconButtonClassName = "inline-flex size-9 items-center justify-center rounded-md text-khata-muted/);
assert.match(designSystem, /export const profilePillClassName = "hidden h-9 min-w-0 items-center gap-2 rounded-full bg-khata-paperMuted\/70 px-2 py-1 sm:flex"/);
assert.match(layout, /hidden h-6 w-px bg-khata-border md:block/);
assert.match(layout, /className="[^"]*min-w-11 gap-2 px-2[^"]*sm:px-3[^"]*md:h-9 md:min-w-9[^"]*"/);
assert.match(topbarActions, /aria-haspopup="dialog"/);
assert.match(topbarActions, /role="dialog"/);
assert.match(topbarActions, /bg-khata-ink\/20/);
assert.match(topbarActions, /commandDialogPanelClassName/);
assert.match(designSystem, /max-w-2xl/);
assert.match(topbarActions, /aria-label="Close search"/);
assert.match(designSystem, /commandSelectedBadgeClassName/);
assert.match(designSystem, /Selected/);
assert.match(topbarActions, /Press Enter to search the selected workspace area\./);
assert.match(topbarActions, /router.push\(buildSearchHref\(targetHref, query\)\)/);
assert.match(topbarActions, /href: "\/dashboard\/review-queue"/);
assert.match(topbarActions, /href: "\/dashboard\/clients"/);
assert.match(topbarActions, /href: "\/dashboard\/inbox"/);
assert.match(topbarActions, /aria-haspopup="menu"/);
assert.match(topbarActions, /role="menu"/);
assert.match(topbarActions, /aria-labelledby=\{activityButtonId\}/);
assert.match(topbarActions, /onKeyDown=\{handleActivityButtonKeyDown\}/);
assert.match(topbarActions, /onKeyDown=\{handleActivityMenuKeyDown\}/);
assert.match(topbarActions, /event\.key === "ArrowDown"/);
assert.match(topbarActions, /event\.key === "ArrowUp"/);
assert.match(topbarActions, /event\.key === "Home"/);
assert.match(topbarActions, /event\.key === "End"/);
assert.match(topbarActions, /requestAnimationFrame\(\(\) => activityButton\(\)\?\.focus\(\)\)/);
assert.match(topbarActions, /href: "\/dashboard\/operations"/);
assert.match(topbarActions, /icon: Wrench/);
assert.ok(!topbarActions.includes("icon: Settings"));
assert.match(layout, /AI drafts require CA approval\./);
assert.ok(!layout.includes("Draft AI outputs require CA approval before ledger impact."));

assert.equal((sidebar.match(/onClick=\{toggleSidebar\}/g) ?? []).length, 1);
assert.match(sidebar, /isCollapsed && "mx-auto"/);
assert.match(sidebar, /sticky top-0 hidden h-screen/);
assert.match(sidebar, /border-r border-khata-border/);
assert.ok(!sidebar.includes("rounded-[1.375rem]"));
assert.match(sidebar, /shadow-sm/);
assert.match(sidebar, /DashboardUtilityNav/);
assert.ok(!sidebar.includes('isCollapsed && "mx-auto mt-2 hidden"'));
assert.match(sidebar, /isCollapsed \? "w-16" : "w-\[240px\]"/);
assert.match(sidebar, /: "h-14 justify-between px-4"/);

assert.match(navigation, /"min-h-0 flex-1 overflow-y-auto/);
assert.match(navigation, /export function DashboardUtilityNav/);
assert.match(navigation, /aria-label="Workspace utilities"/);
assert.match(navigation, /label: "Help", href: "\/contact" as Route/);
assert.match(navigation, /title: "Planned",\s*items: \["\/dashboard\/platform"\]/);
assert.match(navigation, /aria-label=\{collapsed \? item\.label : undefined\}/);
assert.match(navigation, /role="tooltip"/);
assert.match(navigation, /createPortal\(/);
assert.match(navigation, /onFocus=\{showTooltip\}/);
assert.match(navigation, /onBlur=\{hideTooltip\}/);

assert.match(mobileMenu, /<dialog/);
assert.match(mobileMenu, /showModal\(\)/);
assert.match(mobileMenu, /onCancel=/);
assert.match(mobileMenu, /event\.target === event\.currentTarget/);
assert.match(mobileMenu, /triggerRef\.current\?\.focus\(\)/);
assert.match(mobileMenu, /DashboardUtilityNav onNavigate=\{closeMenu\}/);
assert.match(mobileMenu, /absolute left-0 top-0 flex h-dvh/);
assert.ok(!mobileMenu.includes("rounded-[1.375rem]"));
assert.match(mobileMenu, /aria-expanded=\{isOpen\}/);
assert.match(mobileMenu, /aria-label="Close workspace navigation"/);

console.log("OK dashboard navigation shell checks passed");
