import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const layout = read("src/app/(dashboard)/dashboard/layout.tsx");
const sidebar = read("src/components/dashboard-sidebar.tsx");
const navigation = read("src/components/dashboard-nav.tsx");
const mobileMenu = read("src/components/dashboard-mobile-menu.tsx");

assert.match(layout, /header className="sticky top-0 z-20 flex h-14/);
assert.match(layout, /AI drafts require CA approval\./);
assert.ok(!layout.includes("Draft AI outputs require CA approval before ledger impact."));

assert.equal((sidebar.match(/onClick=\{toggleSidebar\}/g) ?? []).length, 1);
assert.match(sidebar, /isCollapsed && "mx-auto"/);
assert.match(sidebar, /rounded-[1.375rem]/);
assert.match(sidebar, /shadow-lg/);
assert.match(sidebar, /DashboardUtilityNav/);
assert.ok(!sidebar.includes('isCollapsed && "mx-auto mt-2 hidden"'));
assert.match(sidebar, /isCollapsed \? "w-\[76px\]" : "w-\[280px\]"/);

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
assert.match(mobileMenu, /rounded-\[1\.375rem\]/);
assert.match(mobileMenu, /aria-expanded=\{isOpen\}/);
assert.match(mobileMenu, /aria-label="Close workspace navigation"/);

console.log("OK dashboard navigation shell checks passed");
