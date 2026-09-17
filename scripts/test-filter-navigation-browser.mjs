// Isolated production-mode fixture using the real shared components. No app
// routes, credentials, Supabase data, or environment files are used.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createServer } from "node:net";
import { once } from "node:events";
import { chromium } from "playwright";
import { prepareStreamingFixture, verifyStreamingFixture } from "./dashboard-streaming-fixture.mjs";
import { prepareDetailStreamingFixture, verifyDetailStreamingFixture } from "./dashboard-detail-streaming-fixture.mjs";

const repo = process.cwd();
const baseline = process.argv.includes("--baseline");
const streaming = process.argv.includes("--streaming");
const details = process.argv.includes("--details");
if ((streaming || details) && baseline) throw Error("Streaming verification requires the candidate components");
// Keep the isolated app on the same drive as dependencies for Windows webpack.
const fixture = mkdtempSync(join(dirname(repo), ".khataone-filter-navigation-"));
const files = [
  "src/components/design-system.tsx", "src/lib/utils.ts", "src/lib/dashboard/nav.ts",
  "src/components/dashboard-nav.tsx", "src/components/dashboard-mobile-menu.tsx",
  "src/components/dashboard-topbar-actions.tsx", "src/components/brand-logo.tsx",
  "src/app/globals.css", "tailwind.config.ts", "postcss.config.mjs",
  "public/khataone-mark-light-transparent.png",
];
if (!baseline) files.push("src/components/filter-navigation-form.tsx", "src/components/navigation-progress.tsx");
function write(path, text) {
  const target = join(fixture, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
}
for (const file of files) {
  mkdirSync(dirname(join(fixture, file)), { recursive: true });
  if (baseline && !file.endsWith(".png")) {
    write(file, execFileSync("git", ["show", `f9ee4f3:${file}`], { cwd: repo }));
  } else copyFileSync(join(repo, file), join(fixture, file));
}
symlinkSync(join(repo, "node_modules"), join(fixture, "node_modules"), "junction");
write("package.json", JSON.stringify({ private: true, dependencies: { next: "16.3.5", react: "*", "react-dom": "*" } }));
write("tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom", "esnext"], strict: true, skipLibCheck: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", jsx: "react-jsx", paths: { "@/*": ["./src/*"] } }, include: ["src/**/*.tsx", "src/**/*.ts", ".next/types/**/*.ts"], exclude: ["node_modules"] }));
write("next.config.mjs", "export default { devIndicators: false };\n");
write("src/components/fixture-state.tsx", `'use client';
import { useState } from 'react';
export default function FixtureState() { const [count, setCount] = useState(0); return <button id="shell-state" onClick={() => setCount(count + 1)}>Shell {count}</button>; }
`);
write("src/app/layout.tsx", `import './globals.css';
import FixtureState from '@/components/fixture-state';
import { DashboardMobileMenu } from '@/components/dashboard-mobile-menu';
import { DashboardTopbarActions } from '@/components/dashboard-topbar-actions';
export default function Layout({children}: {children: React.ReactNode}) { return <html lang="en"><body><header className="flex items-center gap-2 p-3"><FixtureState/><DashboardMobileMenu/><DashboardTopbarActions userEmail="fixture@example.test" roleLabel="Owner" profileInitial="F"/></header>{children}</body></html>; }
`);
write("src/app/actions.ts", `'use server';
import { redirect } from 'next/navigation';
export async function fixtureAction(form: FormData) {
  if (form.get('fixture') !== 'safe') throw Error('Invalid fixture');
  await new Promise(resolve => setTimeout(resolve, 150));
  redirect('/dashboard/clients?mutation=confirmed');
}
`);
write("src/app/[[...path]]/page.tsx", `
import { FilterBar, FilterGrid, FilterInlineField, InputWithIcon, Select, Button, ActionLink, FilterPresetLink, PaginationControls, filterInlineActionsClassName, FilterActions, filterInlineButtonClassName, filterInlineControlClassName } from '@/components/design-system';
import { fixtureAction } from '../actions';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
 const p = await searchParams;
 await new Promise(resolve => setTimeout(resolve, 300));
 return <main className="min-w-0 p-4"><h1>Navigation fixture</h1>
 <FilterBar action="/dashboard/clients"><FilterGrid className="grid-cols-1 md:grid-cols-[minmax(0,1fr)_10rem_auto]">
 <FilterInlineField label="Search" htmlFor="search"><InputWithIcon id="search" name="q" defaultValue={p.q ?? ''}/></FilterInlineField>
 <FilterInlineField label="Status" htmlFor="status"><Select id="status" name="status" defaultValue={p.status ?? 'all'} className={filterInlineControlClassName}><option value="all">All</option><option value="active">Active</option></Select></FilterInlineField>
 <input type="hidden" name="risk" value="low_confidence"/>
 <FilterActions className={filterInlineActionsClassName}><Button className={filterInlineButtonClassName} type="submit">Apply</Button><ActionLink href="/dashboard/clients" className={filterInlineButtonClassName}>Clear</ActionLink></FilterActions>
 </FilterGrid></FilterBar>
 <FilterPresetLink href="/dashboard/clients?status=active">Active preset</FilterPresetLink>
 <output id="results">{JSON.stringify(p)}</output>
 <PaginationControls basePath="/dashboard/clients" page={Number(p.page ?? 1)} hasNext={true} searchParams={p}/>
 <FilterBar action={fixtureAction}><input type="hidden" name="fixture" value="safe"/><Button type="submit">Fixture mutation</Button></FilterBar>
 </main>;
}
`);

if (streaming || details) prepareStreamingFixture({ repo, write });
if (details) prepareDetailStreamingFixture({ repo, write });
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SystemRoot|WINDIR|TEMP|TMP|LOCALAPPDATA|APPDATA|USERPROFILE|COMSPEC|PATHEXT)$/i.test(key)));
env.NEXT_TELEMETRY_DISABLED = "1";
const cli = resolve(repo, "node_modules/next/dist/bin/next");
console.log(`Building isolated ${baseline ? "baseline" : "candidate"} fixture: ${fixture}`);
execFileSync(process.execPath, [cli, "build", "--webpack"], { cwd: fixture, env, stdio: "pipe", timeout: 180000 });
const listener = createServer();
listener.listen(0, "127.0.0.1");
await once(listener, "listening");
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [cli, "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: fixture, env, stdio: "pipe" });
let browser;
const results = [];
try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error("Fixture server exited");
    try { if ((await fetch(origin)).ok) break; } catch { /* Wait for local start. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch();
  if (details) {
    const detailResults = await verifyDetailStreamingFixture({ browser, origin, fixture });
    write("detail-results.json", JSON.stringify(detailResults, null, 2));
    console.log(JSON.stringify(detailResults, null, 2));
  }
  if (streaming) {
    const streamingResults = await verifyStreamingFixture({ browser, origin, fixture });
    write("streaming-results.json", JSON.stringify(streamingResults, null, 2));
    console.log(JSON.stringify(streamingResults, null, 2));
  }
  for (const width of details ? [] : [390, 834, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${origin}/dashboard/clients`);
    await page.locator("#shell-state").click();
    await page.getByLabel("Search", { exact: true }).fill("invoice & receipt");
    await page.getByLabel("Status", { exact: true }).selectOption("active");
    await page.evaluate(() => { window.__documentMarker = "preserved"; });
    let documents = 0;
    page.on("request", request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++; });
    // A deterministic network delay exposes pending feedback; it is not a
    // measurement of Supabase latency or a real mobile network.
    await page.route(`${origin}/dashboard/**`, async route => {
      if (route.request().headers().rsc === "1" || route.request().isNavigationRequest()) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      await route.continue();
    });
    const started = Date.now();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    if (!baseline) {
      await page.getByRole("status").filter({ hasText: "Updating results" }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Apply", exact: true }).isDisabled(), true);
    }
    const feedbackMs = baseline ? null : Date.now() - started;
    await page.waitForFunction(() => document.querySelector("#results")?.textContent.includes("invoice & receipt"));
    const elapsedMs = Date.now() - started;
    const params = new URL(page.url()).searchParams;
    assert.equal(params.get("q"), "invoice & receipt");
    assert.equal(params.get("status"), "active");
    assert.equal(params.get("risk"), "low_confidence");
    assert.equal(documents, baseline ? 1 : 0);
    assert.equal(await page.locator("#shell-state").innerText(), baseline ? "Shell 0" : "Shell 1");
    if (!baseline) assert.equal(await page.evaluate(() => window.__documentMarker), "preserved");
    results.push({ width, baseline, filterDocumentRequests: documents, feedbackObservedMs: feedbackMs, resultsObservedMs: elapsedMs });
    if (!baseline) {
      await page.getByRole("link", { name: "Next", exact: true }).click();
      await page.waitForURL(/page=2/);
      assert.equal(new URL(page.url()).searchParams.get("q"), "invoice & receipt");
      await page.getByRole("link", { name: "Clear", exact: true }).click();
      await page.waitForURL(`${origin}/dashboard/clients`);
      await page.waitForFunction(() => document.querySelector("#results")?.textContent === "{}");
      assert.equal(await page.getByLabel("Search", { exact: true }).inputValue(), "");
      assert.equal(await page.getByLabel("Status", { exact: true }).inputValue(), "all");
      await page.goBack();
      await page.waitForURL(/page=2/);
      await page.waitForFunction(() => document.querySelector("#results")?.textContent.includes('"page":"2"'));
      assert.equal(await page.getByLabel("Search", { exact: true }).inputValue(), "invoice & receipt");
      await page.goForward();
      await page.waitForURL(`${origin}/dashboard/clients`);
      await page.waitForFunction(() => document.querySelector("#results")?.textContent === "{}");
      assert.equal(await page.getByLabel("Search", { exact: true }).inputValue(), "");
      await page.getByRole("link", { name: "Active preset", exact: true }).click();
      await page.waitForURL(/status=active/);
      await page.waitForFunction(() => document.querySelector("#results")?.textContent === '{"status":"active"}');
      assert.equal(await page.getByLabel("Status", { exact: true }).inputValue(), "active");
      await page.getByLabel("Search", { exact: true }).fill("keyboard");
      await page.getByLabel("Search", { exact: true }).press("Enter");
      await page.waitForFunction(() => document.querySelector("#results")?.textContent.includes("keyboard"));
      assert.equal(documents, 0);
      await page.getByRole("button", { name: "Fixture mutation" }).click();
      await page.waitForURL(/mutation=confirmed/);
      if (width < 1024) {
        await page.getByRole("button", { name: "Open workspace navigation" }).click();
        await page.getByRole("link", { name: "Ledger", exact: true }).click();
        await page.getByRole("status").filter({ hasText: "Loading page" }).waitFor();
        assert.equal(await page.locator("dialog").evaluate(dialog => dialog.open), false);
        await page.waitForURL(`${origin}/dashboard/ledger`);
      }
      await page.getByRole("button", { name: "Search workspace", exact: true }).click();
      await page.getByRole("dialog").getByRole("textbox").fill("search fixture");
      await page.getByRole("dialog").getByRole("textbox").press("Enter");
      await page.getByRole("status").filter({ hasText: "Searching workspace" }).waitFor();
      await page.waitForURL(/review-queue\?q=search/);
      await page.waitForFunction(() => document.querySelector("#results")?.textContent.includes("search fixture"));
      assert.equal(await page.locator('[role="status"]').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.deepEqual(errors, []);
      await page.screenshot({ path: join(fixture, `verified-${width}.png`) });
    }
    await context.close();
  }
  if (!baseline && !details) {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${origin}/dashboard/clients`);
    await page.getByLabel("Search", { exact: true }).fill("no javascript");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page.waitForURL(/q=no/);
    assert.equal(new URL(page.url()).searchParams.get("q"), "no javascript");
    await context.close();
  }
  write("results.json", JSON.stringify({ mode: "isolated-production-fixture", syntheticServerDelayMs: 300, syntheticRscDelayMs: 600, results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
  console.log(details ? "PASS detail streaming, evidence, role restrictions and failure isolation" : "PASS filter navigation, URL values, and document continuity" + (baseline ? " (baseline)" : "; pending state, history, keyboard, mobile drawer, search, Server Action and no-JS fallback"));
} finally {
  await browser?.close();
  server.kill();
  console.log(`Local fixture evidence retained at ${fixture}`);
}
