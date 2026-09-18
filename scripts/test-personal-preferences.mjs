import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync("src/lib/personal-preferences.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledModule = { exports: {} };
new Function("module", "exports", compiled)(compiledModule, compiledModule.exports);

const { parseStartPage, startPageCookieName, startPagePath } = compiledModule.exports;

assert.equal(startPagePath("review"), "/dashboard/review-queue");
assert.equal(startPagePath("inbox"), "/dashboard/inbox");
assert.equal(startPagePath("overview"), "/dashboard");
for (const untrusted of [undefined, "", "/dashboard/settings", "//evil.example", "https://evil.example", "admin"]) {
  assert.equal(parseStartPage(untrusted), "overview");
  assert.equal(startPagePath(untrusted), "/dashboard");
}
assert.notEqual(startPageCookieName("member-a"), startPageCookieName("member-b"));

const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
const dashboardLayout = readFileSync("src/app/(dashboard)/dashboard/layout.tsx", "utf8");
const topbarActions = readFileSync("src/components/dashboard-topbar-actions.tsx", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");
const preferences = readFileSync("src/components/personal-preferences.tsx", "utf8");
const bootstrap = rootLayout.match(/const preferenceBootstrap = `([^`]+)`;/)?.[1];
assert.ok(bootstrap, "theme bootstrap must exist");

function bootTheme(storedTheme, systemDark) {
  const document = { documentElement: { dataset: {} } };
  const window = {
    matchMedia: () => ({ matches: systemDark, addEventListener() {} }),
    addEventListener() {},
  };
  const localStorage = {
    getItem: key => key === "khataone_theme" ? storedTheme : null,
  };
  runInNewContext(bootstrap, { document, window, localStorage });
  return document.documentElement.dataset.theme;
}

assert.equal(bootTheme(null, true), "light", "first visit stays light even on a dark device");
assert.equal(bootTheme("light", true), "light");
assert.equal(bootTheme("dark", false), "dark");
assert.equal(bootTheme("system", true), "dark");
assert.equal(bootTheme("system", false), "light");
assert.match(preferences, /return value === "dark" \|\| value === "system" \? value : "light"/);
assert.match(dashboardLayout, /className="dashboard-theme min-h-screen/);
assert.match(topbarActions, /dashboard-theme-portal fixed z-\[60\]/);
assert.match(topbarActions, /dashboard-theme-portal fixed inset-0/);
assert.doesNotMatch(globals, /:root\[data-theme="dark"\]\s*\{/,
  "dark tokens must not be assigned globally to public pages");
const darkBlock = globals.match(/:root\[data-theme="dark"\] :is\(\.dashboard-theme, \.dashboard-theme-portal\) \{([\s\S]*?)\n\}/)?.[1];
assert.ok(darkBlock, "dark tokens must be scoped to dashboard surfaces and portals");

function color(source, variable) {
  const hex = source.match(new RegExp(`${variable}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  assert.ok(hex, `missing ${variable}`);
  return [0, 2, 4].map(index => parseInt(hex.slice(index + 1, index + 3), 16) / 255);
}
function luminance(rgb) {
  const [r, g, b] = rgb.map(value => value <= 0.04045
    ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const values = [luminance(color(darkBlock, a)), luminance(color(darkBlock, b))].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const [foreground, background] of [
  ["--foreground", "--surface"],
  ["--muted-foreground", "--surface"],
  ["--primary-foreground", "--primary"],
]) {
  assert.ok(contrast(foreground, background) >= 4.5,
    `${foreground} needs readable contrast on ${background}`);
}

console.log("OK start-page allowlist, light default, dashboard-only theme and dark contrast");
