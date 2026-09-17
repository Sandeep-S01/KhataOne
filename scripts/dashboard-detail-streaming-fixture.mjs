import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function prepareDetailStreamingFixture({ repo, write }) {
  for (const file of [
    "components/deferred-section.tsx", "components/deferred-review-evidence.tsx",
    "components/document-evidence-panel.tsx", "components/transaction-review-workspace.tsx",
    "components/transaction-review-form.tsx", "components/pending-submit-button.tsx",
    "lib/document-evidence.ts", "lib/permissions.ts",
  ]) write(`src/${file}`, readFileSync(join(repo, "src", file)));
  for (const route of ["clients/[clientId]", "ledger/[entryId]", "gst-summary/[periodId]", "review-queue/[transactionId]"]) {
    write(`src/app/streaming/${route}/page.tsx`, readFileSync(join(repo, "src/app/(dashboard)/dashboard", route, "page.tsx")));
  }
  write("public/fixture-evidence.txt", "Synthetic original evidence only.");
  write("src/app/actions/clients.ts", `'use server';
export async function archiveClientAction() { throw Error('Fixture must not submit a mutation'); }
`);
  write("src/app/actions/review.ts", `'use server';
export type ReviewActionState = { status: 'idle' | 'success' | 'error'; message: string; fieldErrors?: Record<string, string> };
export async function updateTransactionAction(_state: ReviewActionState, _data: FormData): Promise<ReviewActionState> { throw Error('Fixture must not submit a mutation'); }
export async function approveTransactionAction() { throw Error('Fixture must not submit a mutation'); }
export async function rejectTransactionAction() { throw Error('Fixture must not submit a mutation'); }
export async function markDuplicateTransactionAction() { throw Error('Fixture must not submit a mutation'); }
export async function requestClarificationAction() { throw Error('Fixture must not submit a mutation'); }
`);
  write("src/lib/firms.ts", `
import { cache } from 'react';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const getFirmContext = cache(async () => {
  const scenario = (await cookies()).get('fixture-scenario')?.value ?? 'slow-secondary';
  const client = { id: 'fixture-client', business_name: 'Fixture client', status: 'active',
    contact_name: 'Fixture contact', filing_frequency: 'monthly', gstin: null };
  const document = { file_name: 'fixture-evidence.txt', storage_path: 'fixture-firm/document.txt',
    file_mime_type: scenario === 'unsupported' ? 'application/zip' : 'text/plain', source_text: 'Fixture extracted text' };
  const transaction = { id: 'fixture-record', client_id: client.id, transaction_type: 'purchase',
    status: scenario === 'posted' ? 'approved' : 'needs_review', invoice_number: 'FIXTURE-001',
    party_name: 'Fixture supplier', total_amount: 118, taxable_amount: 100, cgst_amount: 9,
    sgst_amount: 9, igst_amount: 0, confidence_score: 0.8, transaction_date: '2026-09-16',
    created_at: '2026-09-16T00:00:00Z', clients: client,
    documents: scenario === 'no-document' ? null : document, ai_extractions: { risk_flags: [] } };
  const period = { id: 'fixture-period', client_id: client.id, clients: client, status: 'needs_review',
    period_start: '2026-09-01', period_end: '2026-09-30', filing_type: 'monthly',
    gst_summaries: { generated_at: '2026-09-16T00:00:00Z', net_tax_payable: 18, mismatch_count: 1, missing_document_count: 0 } };
  const entry = { id: 'fixture-entry', clients: client, transactions: transaction,
    entry_date: '2026-09-16', account_name: 'Fixture account', debit_amount: 118, credit_amount: 0 };
  const audit = { id: 'fixture-audit', action: 'fixture_history_loaded', actor_user_id: 'fixture-user',
    metadata: { correction_note: 'Fixture correction' }, created_at: '2026-09-16T00:00:00Z' };
  let primaryLoaded = false;
  let documentReads = 0;
  function query(table: string) {
    let single = false;
    let head = false;
    const filters: Record<string, unknown> = {};
    const builder: Record<string, unknown> = {};
    for (const method of ['select','eq','in','neq','order','limit','range','gte','lte','lt','not','or','single']) {
      builder[method] = (...args: unknown[]) => {
        if (method === 'single') single = true;
        if (method === 'select') head = Boolean((args[1] as { head?: boolean })?.head);
        if (method === 'eq') filters[String(args[0])] = args[1];
        return builder;
      };
    }
    builder.then = async (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => {
      try {
        if (filters.firm_id !== 'fixture-firm') throw Error('Missing tenant predicate');
        // Shell badge reads are independent of any detail record and stay fast.
        const shell = head && !filters.client_id;
        if (!single && !shell && !primaryLoaded) throw Error('Secondary read before primary authorization');
        if (table === 'documents' && ++documentReads > 1) throw Error('Recent documents fetched twice');
        await delay(single ? (scenario === 'slow-primary' ? 4000 : 80) : shell ? 80 : 4000);
        if (single) {
          if (scenario === 'no-record') return resolve({ data: null, error: { code: 'PGRST116' } });
          primaryLoaded = true;
          return resolve({ data: table === 'clients' ? client : table === 'transactions' ? transaction : table === 'ledger_entries' ? entry : period, error: null });
        }
        if (!shell && scenario === 'secondary-rejection') throw Error('Synthetic private upstream error');
        if (!shell && scenario === 'secondary-error') return resolve({ data: null, count: null, error: { message: 'Synthetic private upstream error' } });
        return resolve({ error: null, count: head ? 1 : null, data: head ? null :
          table === 'audit_logs' ? [audit] : table === 'transactions' ? [transaction] :
          table === 'gst_periods' ? [period] : [{ ...document, id: 'fixture-document', document_type: 'text_note', status: 'received', received_at: '2026-09-16T00:00:00Z' }] });
      } catch (error) { return reject(error); }
    };
    return builder;
  }
  const supabase = { from: query, storage: { from: (bucket: string) => ({
    createSignedUrl: async (path: string, ttl: number) => {
      if (!primaryLoaded || bucket !== 'whatsapp-media-raw' || path !== 'fixture-firm/document.txt' || ttl !== 120) throw Error('Invalid evidence scope');
      await delay(4000);
      if (scenario === 'secondary-rejection') throw Error('Synthetic private upstream error');
      if (scenario === 'secondary-error') return { data: null, error: { message: 'Synthetic private upstream error' } };
      return { data: { signedUrl: '/fixture-evidence.txt' }, error: null };
    }
  }) }} as unknown as SupabaseClient;
  return { firm: { id: 'fixture-firm', name: 'Fixture firm', role: scenario === 'viewer' ? 'viewer' : 'owner' },
    user: { email: 'fixture@example.test' }, userId: 'fixture-user', supabase };
});
export type FirmContext = NonNullable<Awaited<ReturnType<typeof getFirmContext>>>;
`);
}

export async function verifyDetailStreamingFixture({ browser, origin, fixture }) {
  const results = [];
  const routes = [
    { path: "clients/fixture-client", primary: "Client profile", pending: "Loading audit history", loaded: "fixture_history_loaded" },
    { path: "ledger/fixture-entry", primary: "Entry details", pending: "Loading correction audit", loaded: "fixture_history_loaded" },
    { path: "gst-summary/fixture-period", primary: "Saved GST summary", pending: "Loading generation audit", loaded: "fixture_history_loaded" },
    { path: "review-queue/fixture-record", primary: "Review transaction", pending: "Loading original preview", loaded: "Open original text file" },
  ];
  const approveName = "Approve and create ledger handoff";
  for (const width of [390, 834, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => route.request().headers()["next-router-prefetch"] ? route.abort() : route.continue());
    for (const route of routes) {
      const start = Date.now();
      await page.goto(`${origin}/streaming/${route.path}`, { waitUntil: "commit" });
      await page.getByRole("heading", { name: route.primary, exact: true }).waitFor();
      const primaryVisibleMs = Date.now() - start;
      const review = route.path.startsWith("review-queue");
      await (review ? page.getByText(route.pending, { exact: true }) : page.getByLabel(route.pending, { exact: true })).waitFor();
      if (review) {
        assert.equal(await page.getByRole("button", { name: approveName }).count(), 0);
        await page.locator('[name="party_name"]').fill("Unsaved fixture change");
        assert.equal(await page.getByText("Fixture extracted text", { exact: true }).isVisible(), true);
      }
      await page.getByText(route.loaded, { exact: true }).first().waitFor();
      if (review) {
        assert.equal(await page.locator('[name="party_name"]').inputValue(), "Unsaved fixture change");
        assert.equal(await page.getByRole("button", { name: approveName }).isDisabled(), true);
        await page.getByText("Save review edits before approving, rejecting, marking duplicate, or requesting clarification.").waitFor();
      }
      assert.deepEqual((await page.getByRole("alert").allTextContents()).filter(text => text.trim()), []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: join(fixture, `detail-${width}-${route.path.split('/')[0]}.png`) });
      results.push({ width, route: route.path, primaryVisibleMs, syntheticSecondaryDelayMs: 4000 });
      console.log(`PASS detail streaming ${width}px ${route.path}`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  for (const scenario of ["secondary-error", "secondary-rejection", "viewer", "posted", "no-record", "no-document", "unsupported", "slow-primary"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([{ name: "fixture-scenario", value: scenario, url: origin }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const chosen = ["posted", "no-document", "unsupported"].includes(scenario) ? routes.slice(-1) : routes;
    for (const route of chosen) {
      await page.goto(`${origin}/streaming/${route.path}`, { waitUntil: "commit" });
      if (scenario === "no-record") {
        await page.getByRole("heading", { name: "404", exact: true }).waitFor();
        assert.equal(await page.getByRole("heading", { name: route.primary, exact: true }).count(), 0);
        assert.equal(await page.getByText("fixture_history_loaded", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Fixture extracted text", { exact: true }).count(), 0);
        continue;
      }
      if (scenario === "slow-primary") {
        await page.getByRole("heading", { name: "Preparing workspace" }).waitFor();
        assert.equal(await page.getByRole("heading", { name: route.primary, exact: true }).count(), 0);
        assert.equal(await page.getByText("fixture_history_loaded", { exact: true }).count(), 0);
      }
      await page.getByRole("heading", { name: route.primary, exact: true }).waitFor();
      const review = route.path.startsWith("review-queue");
      if (scenario.startsWith("secondary-")) {
        if (review) {
          await page.getByText("Original preview is temporarily unavailable; review the extracted source text below.").waitFor();
          await page.getByRole("button", { name: approveName }).waitFor();
        } else {
          await page.getByRole("alert").filter({ hasText: /could not be loaded/ }).first().waitFor();
          assert.equal(await page.getByText("No corrections recorded", { exact: true }).count(), 0);
        }
        assert.equal(await page.getByText("Synthetic private upstream error", { exact: true }).count(), 0);
      } else if (scenario === "no-document" || scenario === "unsupported") {
        await page.getByRole("button", { name: approveName }).waitFor();
        assert.equal(await page.getByText("Open original text file", { exact: true }).count(), 0);
      } else {
        await page.getByText(route.loaded, { exact: true }).first().waitFor();
      }
      if (scenario === "viewer" || scenario === "posted") {
        assert.equal(await page.getByRole("button", { name: approveName }).count(), 0);
        assert.equal(await page.getByRole("button", { name: "Save review edits", exact: true }).count(), 0);
        assert.equal(await page.getByRole("button", { name: "Archive", exact: true }).count(), 0);
        assert.equal(await page.getByRole("link", { name: "Correct entry", exact: true }).count(), 0);
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
    results.push({ scenario, passed: true });
    console.log(`PASS detail scenario ${scenario}`);
  }
  return results;
}
