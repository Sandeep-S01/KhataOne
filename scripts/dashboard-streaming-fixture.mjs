// Exercise the actual dashboard layout and pages with synthetic query results.
// This is copied only into the disposable test app, never a production route.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function prepareStreamingFixture({ repo, write }) {
  const copies = [
    "src/components/dashboard-sidebar.tsx", "src/components/deferred-count.tsx",
    "src/components/status-chip.tsx", "src/lib/availability.ts",
    "src/lib/dashboard-query.ts", "src/lib/format.ts", "src/lib/return-context.ts",
  ];
  for (const file of copies) write(file, readFileSync(join(repo, file)));
  for (const file of ["layout.tsx", "page.tsx", "review-queue/page.tsx", "loading.tsx"]) {
    write(`src/app/streaming/${file}`, readFileSync(join(repo, "src/app/(dashboard)/dashboard", file)));
  }
  write("src/lib/env.ts", "export const hasSupabaseConfig = () => true;");
  write("src/lib/request-performance.ts", `
export async function withServerTiming<T>(_name: string, operation: () => PromiseLike<T>, _metadata = {}) { return operation(); }
`);
  write("src/app/actions/auth.ts", `'use server';
export async function signOut() { throw Error('Sign out is not used in this fixture'); }
`);
  write("src/lib/firms.ts", `
import { cache } from 'react';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
const row = { id: 'fixture-record', client_id: 'fixture-client',
  transaction_type: 'purchase', status: 'needs_review', party_name: 'Fixture supplier',
  invoice_number: 'FIXTURE-001', total_amount: 118, confidence_score: 0.8,
  transaction_date: '2026-09-16', created_at: '2026-09-16T00:00:00Z',
  clients: { business_name: 'Fixture client' }, client_business_name: 'Fixture client',
  risk_flags: [], document_type: 'text_note', document_file_name: null, extraction_model: 'fixture' };
export const getFirmContext = cache(async () => {
  const scenario = (await cookies()).get('fixture-scenario')?.value ?? 'slow-counts';
  function query(table: string, rpc = false) {
    let head = false;
    let scoped = rpc;
    let status = '';
    const builder: Record<string, unknown> = {};
    for (const method of ['select','eq','in','neq','order','limit','range','gte','lte','lt','not','or']) {
      builder[method] = (...args: unknown[]) => {
        if (method === 'select') head = Boolean((args[1] as { head?: boolean })?.head);
        if (method === 'eq' && args[0] === 'firm_id') scoped = args[1] === 'fixture-firm';
        if (method === 'eq' && args[0] === 'status') status = String(args[1]);
        return builder;
      };
    }
    builder.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => {
      const delay = scenario === 'slow-rows' ? (head ? 80 : 6000) : (head ? 6000 : 80);
      return new Promise((done, fail) => setTimeout(() => {
        if (!scoped) return fail(Error('Fixture query missing firm scope'));
        if (head && scenario === 'count-rejection') return fail(Error('Synthetic count rejection'));
        const error = head && scenario === 'count-error' ? { message: 'Synthetic count failure' } : null;
        done({ count: head && !error ? (scenario === 'zero-counts' ? 0 : (status === 'draft' || status === 'duplicate' ? 0 : 7)) : null,
          error, data: head ? null : table === 'clients' ? [{ id: 'fixture-client', business_name: 'Fixture client' }] : [row] });
      }, delay)).then(resolve, reject);
    };
    return builder;
  }
  const supabase = { from: (table: string) => query(table), rpc: (_name: string, args: { target_firm_id: string }) => {
    if (args.target_firm_id !== 'fixture-firm') throw Error('RPC missing firm scope');
    return query('transactions', true);
  }} as unknown as SupabaseClient;
  return { firm: { id: 'fixture-firm', name: 'Fixture firm', role: 'owner' },
    user: { email: 'fixture@example.test' }, userId: 'fixture-user', supabase };
});
export type FirmContext = NonNullable<Awaited<ReturnType<typeof getFirmContext>>>;
`);
}

export async function verifyStreamingFixture({ browser, origin, fixture }) {
  const observations = [];
  for (const width of [390, 834, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    // Ensure speculative navigation never reaches an unrelated fixture page.
    await page.route("**/*", route => route.request().headers()["next-router-prefetch"]
      ? route.abort() : route.continue());
    for (const path of ["/streaming", "/streaming/review-queue"]) {
      const start = Date.now();
      await page.goto(origin + path, { waitUntil: "commit" });
      await page.getByRole("cell", { name: "FIXTURE-001", exact: true }).waitFor();
      const recordsVisibleMs = Date.now() - start;
      if (path === "/streaming") {
        assert.equal(await page.getByLabel("Loading overview counts").isVisible(), true);
      } else {
        assert.equal(await page.getByLabel("Count loading", { exact: true }).count(), 4);
        await page.getByLabel("Search", { exact: true }).fill("unsaved search");
      }
      if (width === 1440) {
        await page.getByRole("button", { name: "Collapse sidebar (Ctrl+B)", exact: true }).click();
        await page.getByRole("button", { name: "Expand sidebar (Ctrl+B)", exact: true }).waitFor();
      }
      await page.screenshot({ path: join(fixture, `streaming-pending-${width}-${path.endsWith("review-queue") ? "queue" : "overview"}.png`) });
      await page.locator("#dashboard-content").getByText(path === "/streaming" ? "7 Open" : "7", { exact: true }).first().waitFor();
      if (path.endsWith("review-queue")) {
        assert.equal(await page.getByLabel("Search", { exact: true }).inputValue(), "unsaved search");
      }
      if (width === 1440) {
        // The actual sidebar was interactive before counts, and was not remounted.
        await page.getByRole("button", { name: "Expand sidebar (Ctrl+B)", exact: true }).waitFor();
        const inbox = page.locator("aside").getByRole("link", { name: "Inbox", exact: true });
        assert.equal(await inbox.getAttribute("aria-label"), "Inbox");
        assert.equal(await inbox.getByLabel("7 open").count(), 1);
        await page.getByRole("button", { name: "Expand sidebar (Ctrl+B)", exact: true }).click();
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      observations.push({ width, path, recordsVisibleMs, syntheticCountDelayMs: 6000 });
      console.log(`PASS streaming ${width}px ${path}: records arrived before counts`);
      await page.screenshot({ path: join(fixture, `streaming-${width}-${path.endsWith("review-queue") ? "queue" : "overview"}.png`) });
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  for (const scenario of ["count-error", "count-rejection", "zero-counts", "slow-rows"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([{ name: "fixture-scenario", value: scenario, url: origin }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const path of ["/streaming", "/streaming/review-queue"]) {
      await page.goto(origin + path, { waitUntil: "commit" });
      if (scenario === "slow-rows" && path === "/streaming") {
        await page.getByText("7 Open", { exact: true }).first().waitFor();
        assert.equal(await page.getByRole("cell", { name: "FIXTURE-001", exact: true }).count(), 0);
      }
      await page.getByRole("cell", { name: "FIXTURE-001", exact: true }).waitFor();
      if (scenario.startsWith("count-")) {
        if (path === "/streaming") {
          await page.getByText("One or more overview counts could not be loaded. Refresh to retry.").waitFor();
        } else {
          await page.getByLabel("Count unavailable").first().waitFor();
          assert.equal(await page.getByLabel("Count unavailable").count(), 4);
        }
      } else if (scenario === "zero-counts") {
        await page.locator("#dashboard-content").getByText(path === "/streaming" ? "0 Open" : "0", { exact: true }).first().waitFor();
        assert.equal(await page.locator("aside").getByLabel("0 open").count(), 0);
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
    observations.push({ scenario, passed: true });
    console.log(`PASS streaming scenario: ${scenario}`);
  }
  console.log("PASS actual dashboard shell, overview and review queue stream independently; count errors/zeros remain truthful");
  return observations;
}
