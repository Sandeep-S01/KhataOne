# KhataOne Performance Diagnosis

Audit date: 2026-09-10
Repository: `khataone`
Commit audited: `a102eb0`
Mode: diagnosis only

## Executive Summary

The repository matches the reported KhataOne architecture: a Next.js App Router application for a CA-first WhatsApp accounting and GST-preparation workflow, backed by Supabase Auth/Postgres/Storage/RLS, WhatsApp Cloud API ingestion, OpenAI extraction, server actions, and Vercel deployment.

The reported slow path, dashboard navigation between Clients, Ledger, and Review Queue, is most likely caused by authenticated server-rendered navigation waiting on several network-bound server tasks: middleware auth, dashboard layout firm context, page-level Supabase queries, RLS-protected joins/counts, and final Server Component response generation. Recent fixes are present in source, but the most important production database part, the composite index migration, is not verified as applied.

Measured unauthenticated protected-route redirects are fast after the latest middleware changes: local production p50 was 9-11 ms for Clients/Ledger/Review Queue redirects; live production p50 was 102-117 ms from this machine. That means the current 2-4 second symptom is not explained by the redirect path. It still needs authenticated browser and server timing with a real live account.

The slowest measured safe route was `/api/health`, not the dashboard redirects: live production p50 was 1037 ms and max was 2082 ms over five samples. Code inspection shows the health route checks Supabase through the admin client, so it is a useful signal that app-to-Supabase latency or Supabase responsiveness can be a material part of end-to-end time.

Highest-impact findings:

- F001 BLOCKED: authenticated dashboard baseline is missing, so the exact 2-4 second critical path is not yet measured.
- F002 BLOCKED: deployed Supabase index state is unverified; migration file exists but production proof is missing.
- F003 CODE-CONFIRMED: the dashboard is intentionally dynamic and each page waits for server auth/firm/database work before meaningful data is visible.
- F004 CODE-CONFIRMED: Clients, Inbox, and Review Queue apply some search/risk/document filters after page fetch, which can be both a correctness and performance issue.
- F005 CODE-CONFIRMED: dashboard/report/operations pages still use multiple exact counts and fixed limits; these can scale poorly under real firm data.
- F006 CODE-CONFIRMED: export generation does CSV/PDF creation and storage upload inside the user request instead of a background job.
- F007 CODE-CONFIRMED: WhatsApp and AI workers process claimed batches sequentially inside each invocation.

## Inventory

Installed/runtime versions from `npm list --depth=0` and `node --version`:

- Node.js local runtime: `v26.5.1`
- Next.js: `16.3.0`
- React / React DOM: `19.2.8`
- TypeScript: `6.0.3`
- Tailwind CSS: `3.4.17`
- `@supabase/ssr`: `0.12.4`
- `@supabase/supabase-js`: `2.112.2`
- OpenAI SDK: `7.4.0`
- PDFKit: `0.19.1`
- Zod: `4.4.3`

Scripts:

- `npm run verify`: lint, typecheck, build
- `npm run smoke:local`: unauthenticated route/status smoke
- `npm run perf:live-dashboard`: authenticated HTTP timing script for live dashboard routes
- `npm run seed:demo`: demo data seed, not run in this diagnosis

Deployment/infrastructure:

- Vercel project linked locally as `sandeep-s01s-projects/khata-one`
- Production URL listed by Vercel: `https://khataone.vercel.app`
- Vercel production env names were listed without values. `SUPABASE_SERVICE_ROLE_KEY` is present; `SUPABASE_ACCESS_TOKEN` is not listed.
- Supabase CLI is not linked to the project from this checkout.

## Architecture Verification

Verified architecture:

- Next.js App Router routes exist under `src/app`.
- Dashboard pages are dynamic Server Components using `export const dynamic = "force-dynamic"`.
- Supabase server helpers live in `src/lib/supabase/server.ts`.
- Middleware auth helper lives in `src/lib/supabase/middleware.ts`.
- Firm context helper lives in `src/lib/firms.ts`.
- Dashboard layout calls `getFirmContext()` in `src/app/(dashboard)/dashboard/layout.tsx:24`.
- Middleware now matches only dashboard/onboarding/auth paths in `middleware.ts:10`.
- Server actions exist for auth, clients, review, ledger, GST, exports, and operations under `src/app/actions`.
- WhatsApp durable ingestion worker exists in `src/lib/whatsapp/ingestion-worker.ts`.
- AI extraction worker exists in `src/lib/ai/extraction-worker.ts`.
- Export download route checks firm ownership before signed download in `src/app/api/exports/[exportId]/download/route.ts`.

Previous-fix verification:

- `getFirmContext()` is wrapped in React `cache()` at `src/lib/firms.ts:21`.
- `getFirmContext()` still calls Supabase Auth `getUser()` at `src/lib/firms.ts:29` and active membership lookup at `src/lib/firms.ts:36`.
- Middleware still calls `auth.getUser()` for matched paths at `src/lib/supabase/middleware.ts:61`.
- Dashboard `loading.tsx` exists at `src/app/(dashboard)/dashboard/loading.tsx`.
- Pagination controls exist in `src/components/design-system.tsx`.
- Clients, Inbox, Review Queue, and Ledger use `.range(...)` page fetches.
- Composite performance index migration exists at `supabase/migrations/20260909153000_add_dashboard_performance_indexes.sql`.
- `npm run perf:live-dashboard` exists and measures authenticated HTTP response duration after Supabase sign-in cookies are prepared.

Discrepancies:

- The brief says a Supabase access token may be in Vercel. Vercel env listing did not show `SUPABASE_ACCESS_TOKEN`; it showed `SUPABASE_SERVICE_ROLE_KEY`, which is not the same thing.
- The brief says production migration application was pending. This audit could not verify production index application because Supabase CLI is not linked and no migration/index introspection access is available.
- The live dashboard timing script exists, but local environment lacks `LIVE_DASHBOARD_EMAIL` and `LIVE_DASHBOARD_PASSWORD`, so authenticated timing is blocked.

## Coverage Matrix

| Area | Status | Evidence |
| --- | --- | --- |
| Public pages | Measured and code-reviewed | M001, M002, M007, M008; route inventory |
| Unauthenticated protected redirects | Measured and code-reviewed | M003-M005, M009-M011; middleware matcher |
| Authenticated dashboard navigation | Blocked | B001 missing live credential env |
| Dashboard query inventory | Code-reviewed | `src/app/(dashboard)/dashboard/**/page.tsx` |
| Supabase deployed indexes | Blocked | B002 Supabase CLI not linked |
| Middleware/auth path | Code-reviewed and partially measured | `middleware.ts`, `src/lib/supabase/middleware.ts`; redirect timings |
| Server actions/mutations | Code-reviewed only | Mutation tests blocked without isolated test env |
| WhatsApp webhook/worker | Code-reviewed only | Production mutation/load tests not run |
| AI extraction worker | Code-reviewed only | Paid/external jobs not triggered |
| Exports/download | Code-reviewed only | Export creation is mutation; download needs authenticated export id |
| Browser click-to-visible | Blocked | No live auth/browser credential state available |

## Baseline Results

Full machine-readable results are in `docs/performance/PERFORMANCE_BASELINE.json`.

Key measured results, five samples each:

- Local production `/dashboard/clients` unauth redirect: p50 11 ms, max 15 ms.
- Local production `/dashboard/ledger` unauth redirect: p50 9 ms, max 11 ms.
- Local production `/dashboard/review-queue` unauth redirect: p50 9 ms, max 9 ms.
- Live production `/dashboard/clients` unauth redirect: p50 117 ms, max 118 ms.
- Live production `/dashboard/ledger` unauth redirect: p50 106 ms, max 118 ms.
- Live production `/dashboard/review-queue` unauth redirect: p50 102 ms, max 117 ms.
- Live production `/api/health`: p50 1037 ms, max 2082 ms.

These are HTTP response measurements from Node `fetch`, not browser click-to-visible measurements. They do not prove authenticated dashboard data readiness.

Critical-path interpretation:

- Unauthenticated redirect path is not the observed 2-4 second bottleneck.
- Health route latency suggests Supabase/admin checks can add hundreds of milliseconds to seconds in production.
- Authenticated dashboard critical path remains unresolved until page render timing is captured with valid live credentials.

## Detailed Findings

### F001 - Authenticated Dashboard Critical Path Not Measured

Classification: BLOCKED

Affected journey: Clients, Ledger, Review Queue, Inbox, GST Summary authenticated navigation.

Evidence:

- `npm run perf:live-dashboard` failed before sign-in: missing `LIVE_DASHBOARD_EMAIL`.
- Unauthenticated protected redirects are fast in M003-M005 and M009-M011.

Causal explanation:

The reported 2-4 second delay happens after authentication, where the app performs middleware auth, firm context resolution, page queries, RLS checks, joins, render, and browser update. The current measurements only cover unauthenticated redirects and public pages.

Confidence: High.

Impact:

Without this baseline, further changes can improve plausible causes but cannot prove they fix the user-observed delay.

Proposed remedy:

Run `npm run perf:live-dashboard` with `LIVE_DASHBOARD_EMAIL` and `LIVE_DASHBOARD_PASSWORD`, then add browser automation for click-to-first-feedback and click-to-usable-data.

Validation:

Collect 10-20 samples per route for first visit and repeat navigation. Record tenant size and cache state.

### F002 - Production Index Application Is Unverified

Classification: BLOCKED

Affected journey: all authenticated dashboard list pages and reports using firm-scoped filters/order.

Evidence:

- Migration exists: `supabase/migrations/20260909153000_add_dashboard_performance_indexes.sql`.
- `npx.cmd supabase migration list` failed with `LegacyProjectNotLinkedError`.
- Vercel env listing does not show `SUPABASE_ACCESS_TOKEN`.

Causal explanation:

The code was changed to rely on composite tenant-scoped indexes. If the migration is not applied, production queries may still sort/filter using less optimal single-column indexes or scans.

Confidence: High that status is unverified; unknown whether indexes exist live.

Impact:

Potentially high for Clients, Inbox, Review Queue, Ledger, GST periods, exports, jobs, and audit logs under real data.

Proposed remedy:

Use Supabase CLI/project access or SQL editor to verify `pg_indexes` and migration history. Apply the migration only in the approved migration phase.

Validation:

Run bounded query plans under representative firm user context and compare rows examined, sort method, and execution time.

### F003 - Dynamic Server Rendering Puts Auth And Database Work On Navigation Path

Classification: CODE-CONFIRMED

Affected journey: all protected dashboard page transitions.

Evidence:

- Dashboard pages use `export const dynamic = "force-dynamic"`.
- Dashboard layout awaits `getFirmContext()` at `src/app/(dashboard)/dashboard/layout.tsx:24`.
- `getFirmContext()` calls `auth.getUser()` and `firm_users` lookup at `src/lib/firms.ts:29` and `src/lib/firms.ts:36`.
- Middleware calls `auth.getUser()` at `src/lib/supabase/middleware.ts:61` for matched protected/auth paths.

Causal explanation:

Each authenticated server navigation must wait on a server render and Supabase-backed auth/data work. React `cache()` prevents duplicate `getFirmContext()` calls within a single server render tree, but it does not cache across requests and does not share cache with middleware.

Confidence: High for behavior; runtime impact unmeasured for authenticated navigation.

Impact:

High frequency: every protected page navigation.

Proposed remedy:

Measure middleware, firm context, and page query durations separately. Consider moving nonessential firm display work below a Suspense boundary, using lighter layout data, or selectively caching permission-scoped read models after measuring.

Security/correctness:

Do not bypass Supabase Auth, RLS, or firm membership checks. Any cache must be scoped by user, firm, role, and invalidated on membership/sign-out changes.

### F004 - Search And Some Review Filters Are Applied After Page Fetch

Classification: CODE-CONFIRMED

Affected journey: Clients search, Inbox search, Review Queue search/risk/document filters.

Evidence:

- Clients normalizes search at `src/app/(dashboard)/dashboard/clients/page.tsx:59` and filters page rows at `src/app/(dashboard)/dashboard/clients/page.tsx:110`.
- Inbox filters page rows at `src/app/(dashboard)/dashboard/inbox/page.tsx:136`.
- Review Queue filters page rows at `src/app/(dashboard)/dashboard/review-queue/page.tsx:198`, including risk/document/search checks at lines 210-228.

Causal explanation:

Filtering after pagination means the displayed page may not represent the full filtered result set. It may also fetch rows that are later discarded. This is primarily a correctness issue today and becomes a performance issue as data grows.

Confidence: High.

Impact:

Medium now, high with larger tenant data. A user searching for a client or invoice may see "no match" if the match is outside the current fetched page.

Proposed remedy:

Move safe search and filter predicates into Supabase queries or dedicated RPC/search views. Sanitize PostgREST `or` filters carefully. Validate pagination correctness across multiple pages.

### F005 - Exact Counts And Fixed-Limit Secondary Pages Can Become Hot

Classification: CODE-CONFIRMED

Affected journey: Dashboard home, Reports, Operations, Audit Logs, Exports, GST Summary, client detail pages.

Evidence:

- Dashboard home uses several exact head counts in `src/app/(dashboard)/dashboard/page.tsx`.
- Reports uses exact counts in `src/app/(dashboard)/dashboard/reports/page.tsx`.
- Operations uses list plus exact counts and full job-type fetch in `src/app/(dashboard)/dashboard/operations/page.tsx`.
- Audit Logs uses fixed `.limit(100)` and entity type lookup in `src/app/(dashboard)/dashboard/audit-logs/page.tsx`.
- Exports uses fixed `.limit(80)` in `src/app/(dashboard)/dashboard/exports/page.tsx:95` and `:107`.
- GST Summary uses fixed `.limit(60)` in `src/app/(dashboard)/dashboard/gst-summary/page.tsx:80`.

Causal explanation:

Exact counts can be expensive under RLS and growing tables. Fixed limits protect response size but can silently truncate and do not provide predictable paging. Multiple independent counts create concurrent database work on dashboard/report pages.

Confidence: Medium-high; exact runtime impact requires Supabase query stats/plans.

Impact:

Medium now; high as firms accumulate transactions/jobs/audit logs.

Proposed remedy:

Measure count query durations. Replace exact counts with bounded counts, materialized/denormalized summaries, or lightweight dashboard stats tables where correctness permits. Add pagination to Audit Logs, Operations, Exports, Reports, and GST Summary where needed.

### F006 - Export Generation Blocks The User Request

Classification: CODE-CONFIRMED

Affected journey: CSV/PDF export creation.

Evidence:

- `createExportAction()` starts at `src/app/actions/exports.ts:360`.
- CSV rows are generated in request path at `src/app/actions/exports.ts:173`.
- PDF generation uses PDFKit in request path at `src/app/actions/exports.ts:306`.
- Storage upload happens before action returns at `src/app/actions/exports.ts:503`.

Causal explanation:

Generating large CSV/PDF buffers and uploading them to Supabase Storage inside a server action increases button wait time and risks function timeout/memory pressure for larger periods.

Confidence: High for behavior; size threshold unmeasured.

Impact:

High for large exports; lower for small test datasets.

Proposed remedy:

Move large exports to `processing_jobs`, return queued status immediately, and let Operations/Exports show completion. Keep small exports synchronous only if measured below budget.

Security/correctness:

Preserve private bucket upload, firm ownership checks, audit log, and repeatable export metadata.

### F007 - Queue Workers Process Claimed Batches Sequentially

Classification: CODE-CONFIRMED

Affected journey: WhatsApp ingestion queue and AI extraction queue.

Evidence:

- WhatsApp worker defaults to batch size 10 and max 50 at `src/lib/whatsapp/ingestion-worker.ts:13`.
- WhatsApp worker loops `for (const event of events)` at `src/lib/whatsapp/ingestion-worker.ts:294`.
- AI worker defaults to batch size 5 and max 20 at `src/lib/ai/extraction-worker.ts:5`.
- AI worker loops `for (const job of jobs)` at `src/lib/ai/extraction-worker.ts:190`.

Causal explanation:

Sequential processing is safe and simple, but queue throughput is limited by the slowest event/job in each invocation. During filing bursts, queue wait time may grow even if dashboard pages are optimized.

Confidence: High for behavior; production throughput unmeasured.

Impact:

Medium to high for end-to-end WhatsApp-to-review visibility; not directly responsible for page navigation delay unless workers contend for DB resources.

Proposed remedy:

Measure queue wait time and processing duration by status timestamps. Consider controlled concurrency only after confirming provider rate limits, idempotency, and DB capacity.

### F008 - Health Route Is Measurably Slow Because It Checks Supabase

Classification: MEASURED

Affected journey: health checks, deployment monitoring, possible cold-path diagnostics.

Evidence:

- Local production `/api/health`: p50 488 ms, max 1733 ms.
- Live production `/api/health`: p50 1037 ms, max 2082 ms.
- Health route uses admin Supabase client and selects from `firms` in `src/app/api/health/route.ts:99`.

Causal explanation:

The route likely includes network time to Supabase plus any function/server warm-up. It is not a dashboard route, but it proves a simple Supabase-backed server route can exceed 1 second in production from this test location.

Confidence: Medium-high.

Impact:

Medium for monitoring; diagnostic signal for app-to-Supabase latency.

Proposed remedy:

Split health into fast liveness and deeper readiness checks, or cache readiness briefly. Do not remove the deeper DB check if it is needed for production monitoring.

### F009 - Browser-Level UX Readiness Is Unmeasured

Classification: BLOCKED

Affected journey: perceived navigation responsiveness and button responsiveness.

Evidence:

- Current measurements use Node `fetch`, not a browser.
- `perf:live-dashboard` reads response bodies; it does not measure click-to-feedback, skeleton display, hydration, client router behavior, LCP, CLS, or INP.

Causal explanation:

The user reports perceived delay after clicking. HTTP response time is only one part of that. The browser may also wait for RSC payload, route prefetch state, Suspense fallback availability, JavaScript hydration, table rendering, fonts, and main-thread work.

Confidence: High.

Impact:

High for user experience.

Proposed remedy:

Add Playwright or browser-based lab script for authenticated flows with explicit readiness selectors for table rows/header/empty state. Keep traces sanitized and out of commits.

## Journey Map And Critical Paths

### Dashboard Navigation

User click -> Next Link/router navigation -> middleware for protected path -> Supabase Auth `getUser()` -> dashboard layout may require firm context -> page awaits `getFirmContext()` from request cache -> page queries Supabase -> Server Component response streams/renders -> browser swaps route -> destination table/card visible.

Current evidence:

- Middleware now only covers protected/auth routes.
- `loading.tsx` exists and can provide fallback for page-level work below layout.
- Layout-level firm context still blocks protected layout rendering when required.

### Review Approval

Click approve -> server action validates auth/firm -> loads transaction -> updates transaction -> creates ledger entry if needed -> writes audit log -> revalidates Review Queue and Ledger -> redirects to Ledger.

Risks:

- Multi-step mutation latency can make button wait feel slow.
- Correctness requires preserving transaction/ledger/audit consistency.

### GST Summary Generation

Submit GST form -> server action checks client ownership -> loads approved transactions for client/period -> counts pending review items -> upserts period/summary -> writes audit log -> revalidates and redirects.

Risks:

- Period-wide transaction aggregation runs in request path.
- Large periods need query timing and possibly RPC/summary tables.

### Export Creation

Submit export form -> insert export row -> load transactions or GST summary -> create CSV/PDF buffer -> upload to private storage -> update export -> write audit -> revalidate pages -> return.

Risks:

- Large exports block user request and can hit runtime/memory limits.

### WhatsApp To Review Queue

Meta webhook -> signature verification -> durable event upsert -> background worker claims events -> message matching/media/document creation -> processing job -> AI worker claims job -> provider/fallback extraction -> ai_extractions row -> draft transaction -> Review Queue visibility.

Risks:

- End-to-end latency depends on scheduler cadence, worker batch size, external provider latency, media download, and queue backlog.

## Deployed Index Verification Status

Not verified.

The migration file exists and is source-controlled, but this audit could not prove it has been applied to production. Supabase CLI returned `LegacyProjectNotLinkedError`, and Vercel env listing did not include `SUPABASE_ACCESS_TOKEN`.

Safe verification commands once credentials are available:

```powershell
npx.cmd supabase link --project-ref <project-ref>
npx.cmd supabase migration list
```

Or, in Supabase SQL editor:

```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'clients_firm_status_created_at_idx',
    'clients_firm_created_at_idx',
    'whatsapp_messages_firm_status_received_at_idx',
    'whatsapp_messages_firm_received_at_idx',
    'transactions_firm_status_created_at_idx',
    'transactions_firm_client_status_created_at_idx',
    'ledger_entries_firm_entry_created_at_idx',
    'ledger_entries_firm_client_entry_date_idx',
    'gst_periods_firm_status_period_start_idx',
    'exports_firm_status_created_at_idx',
    'processing_jobs_firm_status_scheduled_at_idx',
    'audit_logs_firm_created_at_idx'
  )
order by tablename, indexname;
```

## Ranked Next-Phase Recommendations

1. Measure authenticated live dashboard navigation before further optimization.
   - Run `npm run perf:live-dashboard` with valid live credential env vars.
   - Add browser measurement for click-to-first-feedback and click-to-usable-data.

2. Verify and apply production Supabase indexes.
   - Confirm migration state and `pg_indexes`.
   - Validate representative query plans under RLS.

3. Add server timing instrumentation behind an env flag.
   - Measure middleware auth, firm context, each page query group, and render total.
   - Keep disabled by default and sanitize logs.

4. Fix filter correctness on paginated pages.
   - Move Clients/Inbox/Review Queue search/risk/document filters into SQL or RPC.
   - Validate results across pages, not only fetched rows.

5. Reduce expensive exact counts and secondary fixed-limit pages.
   - Prioritize Dashboard home, Reports, Operations, Audit Logs, Exports, GST Summary.
   - Consider summary tables or RPCs for frequently used counts.

6. Move large exports to background jobs.
   - Keep small synchronous exports only if measured below budget.
   - Preserve audit and private storage guarantees.

7. Measure worker throughput separately from dashboard navigation.
   - Track queue wait, claim time, active processing, provider time, retry/error rates.
   - Consider concurrency only with idempotency and provider limits validated.

Existing optimizations that should remain:

- Narrow middleware matcher.
- Request-cached `getFirmContext()`.
- Page-level `loading.tsx`.
- Pagination on Clients, Inbox, Review Queue, Ledger.
- Composite tenant-scoped index migration in source.

## Proposed Performance Budgets

These are targets, not achieved results:

- Public page repeat HTML response from Vercel: p50 under 300 ms, p95 under 1200 ms from target geography.
- Protected dashboard click to first visible feedback: under 150 ms.
- Protected dashboard click to meaningful table/empty state: p50 under 1200 ms, p95 under 2500 ms for normal tenant size.
- Clients/Ledger/Review Queue server response after warm auth: p50 under 900 ms, p95 under 2000 ms.
- Simple server action validation failure feedback: under 500 ms.
- Approval/ledger handoff completion: p50 under 1500 ms, p95 under 3000 ms.
- Large export request acknowledgement: under 800 ms if queued; synchronous exports only for measured small datasets under 2500 ms.
- WhatsApp webhook acknowledgement: under 500 ms excluding Meta network variance.
- WhatsApp-to-review visibility: budget depends on scheduler; target should separate queue wait from processing time.

## Missing Evidence And Exact Commands

Authenticated live HTTP timing:

```powershell
$env:LIVE_DASHBOARD_BASE_URL='https://khataone.vercel.app'
$env:LIVE_DASHBOARD_EMAIL='<set in shell, do not print>'
$env:LIVE_DASHBOARD_PASSWORD='<set in shell, do not print>'
npm.cmd run perf:live-dashboard
```

Local production unauth baseline reproduction:

```powershell
npm.cmd run build
npm.cmd run start -- --port 3100
```

Then run the fetch timing harness used for this audit, or repeat with browser automation once live credentials are available.

Production index verification:

```powershell
npx.cmd supabase link --project-ref <project-ref>
npx.cmd supabase migration list
```

Production Vercel env name inspection:

```powershell
npx.cmd vercel env ls production
```

Functional verification run:

```powershell
npm.cmd run verify
$env:SMOKE_BASE_URL='http://localhost:3000'
npm.cmd run smoke:local
```

## Diagnostic File Changes

Created:

- `docs/performance/PERFORMANCE_DIAGNOSIS.md`
- `docs/performance/PERFORMANCE_BASELINE.json`

No application runtime code, business logic, migrations, package upgrades, production indexes, or infrastructure settings were changed.

To remove these diagnostic artifacts:

```powershell
Remove-Item -LiteralPath docs/performance/PERFORMANCE_DIAGNOSIS.md
Remove-Item -LiteralPath docs/performance/PERFORMANCE_BASELINE.json
```

## Limitations

- No authenticated browser trace was captured.
- No production Supabase query plans or query statistics were captured.
- No production index existence proof was available.
- No mutation runtime tests were run because no isolated test environment was verified.
- No WhatsApp, AI, upload, or export production jobs were triggered.
- Five-sample p95 values are descriptive only and should not be treated as reliable tail latency.
