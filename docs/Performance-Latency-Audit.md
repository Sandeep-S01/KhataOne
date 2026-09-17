# KhataOne performance and latency audit

Date: 2026-09-16. Source baseline: `f9ee4f3`.

Audit status at the baseline: diagnosis and proposed remediation only. No application code, database,
environment, deployment, or financial records were changed. Findings are grounded
in the current source, existing project records, official documentation, and a
small public-site browser probe. The reported authenticated mobile delay of 3–4
seconds has not been reproduced in this audit.

## Implementation progress — 2026-09-16

The first three remediation slices are implemented locally after the audit. This section
supersedes the audit-only status for the files changed in these slices; the findings
below remain the original source-baseline record.

| Work package | Current state |
| --- | --- |
| Baseline | Isolated production-mode before/after navigation fixture verified. Three authenticated constrained-mobile live observations collected; representative baseline/candidate comparison remains outstanding. |
| Shared filters and feedback | Locally implemented and browser verified; not deployed. |
| Independent shell and page counts | Sidebar badges, Review Queue status counts, and overview summary/snapshot separated locally; production verification pending. |
| Secondary evidence and history | Review preview, Client secondary sections, Ledger audit and GST source/history boundaries implemented locally; hosted verification pending. |
| Query-plan-led database and auth optimization | The missing list RPCs were deployed after historical schema reconciliation; authenticated preflight and sampled local no-fallback spans now pass. Plan-only checks on the small live firm use existing principal indexes. Both index migrations remain pending; hosted spans and representative large-firm execution plans are still needed. |
| Mobile profiling and background-job improvements | Browser harness now records failed samples and a read-only Apply/Clear/status cycle; real-device, CPU attribution and job measurements remain pending. |
| Production canary and field monitoring | Pending. |

### Measurement follow-up, 2026-09-17

The existing live deployment completed three authenticated Review Queue navigation
observations under the constrained-mobile profile on 2026-09-16 UTC. Actual click
to visible row DOM was 1,225 / 1,384 / 1,451 ms (sorted); full navigation to rows
was 2,064 / 2,665 / 2,704 ms. These are preliminary observations of the deployed
version, whose commit was not verified, and do not measure the unpushed changes.
The runner's automation timing includes additional driver overhead.

Three network-failed events occurred after HTTP 200 headers on navigation requests,
although rows appeared in each trial. Their cause remains unclassified. Long tasks
were observed, but server correlation was unavailable, so the delay cannot yet be
attributed to SQL, auth or a specific frontend component. No reliable p95, INP,
production improvement percentage or release-budget pass is claimed.

[Measurement handoff](Performance-Measurement.md) contains exact samples, limitations,
the comparison protocol and `scripts/profile-dashboard-queries.sql`. The diagnostic
uses existing RPCs/counts under authenticated RLS in a read-only transaction with
timeouts. It has not been executed: there is no configured database connection,
psql executable or running local Docker database in this workspace. No schema,
index, authorization, application behavior or hosted configuration changed in this
follow-up. Representative SQL plans and candidate comparisons remain the next gate.

The 2026-09-17 harness follow-up records every navigation attempt and an optional
Review Queue Apply/Clear cycle. One hosted and one local production-build sample
completed at the constrained-mobile profile; the local build showed status
feedback within 83 ms for Apply and 15 ms for Clear. The hosted and local server
environments differ, so their completion times are separate observations, not a
valid improvement comparison. A failed first harness check is preserved and
identified as an empty-state wording mismatch in the check. No production app,
database, financial workflow or deployment was changed by this follow-up.

A further local server trace found both list RPCs taking the missing-RPC/schema-cache
fallback path on every sampled render: three Review Queue RPC errors followed by
three successful compatibility queries, and the same pattern for Inbox. Failed
RPC spans were 207–308 ms before their fallback calls. The exact error code and
target database migration state were not directly inspected; the trace proves
the branch ran against this local app's configured database. Prioritize verifying
the existing `20260913110000` migration and schema cache in the target Supabase
project, then repeat browser/server measurements. [Sanitized spans and procedure](Performance-Measurement.md).

A direct authenticated PostgREST check now confirms `PGRST202` for both exact
RPC calls on the configured Supabase project. This identifies a function
signature/schema-cache lookup failure. At that point the database and its
migration history had not been inspected. The reusable read-only preflight and
controlled deployment gate are recorded in the
[measurement handoff](Performance-Measurement.md).

Read-only CLI access on 2026-09-17 matched the KhataOne project to the app's
configured Supabase URL. The live database contains the core tables but neither
dashboard search function, and its `supabase_migrations.schema_migrations` table
is absent. The CLI migration list and dry run therefore treat all 37 repository
migrations as pending. A blanket `db push` was not run; the existing live schema
and migration history must be reconciled before deploying the missing RPCs.
The [schema reconciliation and release record](performance/2026-09-17-supabase-schema-reconciliation.md)
also identifies 24 missing dashboard indexes and the absent `pg_trgm` extension;
all 37 migrations replayed cleanly in an isolated local database, and the
shared functions, policy/trigger definitions, and index definitions match.
The legacy live `clients` table differs in one nullability rule and two checks,
so a blanket history repair remained unsafe. The subsequent controlled release
recorded only 34 historically verified versions, applied the existing RPC
migration, and added one forward grant-hardening migration. Both RPCs now resolve
for an authenticated firm member; `anon` execution is denied. The two index
migrations remain pending. A three-sample hosted mobile check completed after
release, but it cannot establish p95 or a performance gain.

### Implemented boundary

`FilterBar` enhances string-action GET filters through `FilterNavigationForm` and
Next's `Form` component. Existing six dashboard filter pages inherit soft
navigation without page-query changes. Function-action GST/export forms and
explicit native form modes retain native React form behavior. Filter controls
show pending state and disable during submission. On a committed URL change or
restored page, controls reflect server defaults; this handles Clear, presets and
Back/Forward without leaving previous typed values visible.

`NavigationProgress` provides a shared themed, reduced-motion-aware status outside
clipped containers. Shared action/text/preset links and sidebar links use Next's
link pending state; header search uses its router transition. The mobile drawer
can close while the pending indicator remains visible. This does not add financial
optimism, a new cache, cross-request authorization reuse, or database changes.

### Reproducible local verification

Run `npm.cmd run test:filter-navigation-browser`. The script builds a separate
Next application beside the repository, copies actual shared components, binds to
loopback, and uses synthetic records/actions only. It never loads `.env.local` or
connects to Supabase. Its `--baseline` option tests components from `f9ee4f3`.
Generated applications, screenshots, and result JSON stay outside this repository
in the printed `.khataone-filter-navigation-*` directory.

The fixture includes 300 ms simulated server work and 600 ms delayed navigation
requests. These are controlled behavior checks, not production latency samples.
One Apply observation per width was collected; no percentile claim is made.

| Width | Baseline document reloads | Candidate document reloads | Candidate pending feedback observed |
| --- | ---: | ---: | ---: |
| 390 px | 1 | 0 | 68 ms |
| 834 px | 1 | 0 | 62 ms |
| 1440 px | 1 | 0 | 76 ms |

Candidate checks passed for shell state preservation, encoded search values,
hidden filter preservation, pending/disabled state, pagination, Clear, presets,
Back/Forward, Enter submission, mutation-form execution, mobile drawer dismissal
with visible feedback, header search, no-JavaScript submission, and no horizontal
overflow or page exceptions. The fixture is not an authenticated full-page visual
approval and does not exercise financial mutations.

The existing authenticated `perf:browser-dashboard` runner now accepts
`DASHBOARD_BROWSER_PROFILE=desktop`, `mobile`, or `mobile-constrained` and opens the
mobile drawer before measuring a destination click. Reports record the chosen
viewport and throttling. Use an isolated populated test workspace, securely
injected credentials, and `DASHBOARD_BROWSER_SAMPLE_COUNT=30` or more for exploratory
comparisons. Its measurements remain warm-route navigation observations; filter
timing, real-device traces, and failure-inclusive field percentiles remain further
measurement work. No live authentication or production timing run was performed
for this slice.

### Second slice: independent counts and overview sections

The dashboard layout still awaits the authenticated firm context before rendering.
It starts sidebar counts without awaiting them and passes only a promise of two
nullable numbers into the existing sidebar. Suspense surrounds the badge content,
not the sidebar or navigation links. Collapse state, focusable links and tooltips
therefore remain mounted while totals arrive. Existing hidden zero/unavailable
sidebar badge behavior is retained; this does not introduce realtime subscriptions
or change when persistent layouts refresh.

Review Queue starts its four count reads alongside the existing record/client
queries, then awaits only the latter for the page. Each preset uses the shared
`DeferredCount` inside `FilterPresetLink`; links remain available during loading.
Missing or failed counts render `n/a`, never a fabricated zero. Records, filters,
pagination, compatibility fallback and firm predicates are unchanged.

Overview starts the same six count reads and eight-record snapshot concurrently,
rendering its header immediately after authentication. The summary/worklist and
snapshot have separate Suspense boundaries using shared tiles, section cards and
table skeletons. Counts still use existing unavailable-state helpers. Counts are
not cached across requests, and this slice does not make the SQL itself faster.

Run `npm.cmd run test:dashboard-streaming-browser` for the isolated production-mode
fixture. It copies the actual layout, overview and Review Queue pages and replaces
only server dependencies in the disposable app with synthetic, firm-scoped data.
No authentication credentials, environment files or production connections are
used. It verifies records before six-second count delays at 390/834/1440px,
sidebar collapse preservation, typed filters surviving streamed badges, true zero
counts, resolved count errors, rejected count reads, and slow records not blocking
overview totals. It also reruns the existing filter-navigation interaction suite.
Screenshots verify containment; fixture fonts and extra test controls mean they
are not production visual approval. Timing observations are synthetic and are
not authenticated mobile latency percentiles.

The final local run retained evidence at
`D:\P\.khataone-filter-navigation-2kjehP` (`streaming-results.json`, pending/loaded
screenshots and filter `results.json`). In the six page/viewport observations,
fixture records appeared in 366-453 ms while counts were deliberately delayed
6000 ms. This proves the dependency separation under these fixture conditions;
it does not establish a production response-time budget.

Local lint, typecheck, production build, navigation/shared-component/refinement,
availability, query/filter, accessibility, responsive and return-context checks
passed. The availability source test had a pre-existing literal class assertion
that no longer matched the committed StatTile flex layout; it now allows layout
classes while retaining its check that static tiles do not gain hover styling.

### Third slice: detail-page evidence and history

The four detail routes retain their authenticated, firm-scoped primary lookup and
existing missing-record handling before rendering any record or starting its
secondary reads. The new shared server `DeferredSection` composes the existing
section/table components with independent loading and generic query-rejection
feedback. It does not send query builders, callbacks or Supabase clients to the
browser.

- Client profile/header render before summary counts, recent documents, recent
  GST periods and audit history. Those sections load independently; the recent
  document read is shared between its table and summary tile rather than fetched
  twice. Existing row limits and predicates are retained.
- Ledger details and source transaction no longer wait for correction history.
  Audit failures now show a query error instead of appearing as no corrections.
  Its audit wrapper has `min-w-0` to keep the existing wide table from expanding
  the mobile page, discovered during browser verification.
- GST saved totals and period identity render before live source transactions
  and generation audit. The two tables load independently, and the current-blocker
  count still comes from the live source rows. Saved/live provenance copy and
  source date/client predicates are preserved. This does not add pagination to
  the existing unbounded source read.
- Review fields, summary and already-fetched extracted text render before private
  URL signing completes. The shared `DeferredReviewEvidence` only suspends the
  original preview and decision actions; approve/reject/duplicate/clarification
  retain their signing-request wait. Editing does not reset when evidence arrives,
  and dirty-state decision blocking remains active. Posted/viewer records remain
  read-only. A rejected signing request uses the existing unavailable-preview
  fallback; private bucket, 120-second TTL and storage-path checks are unchanged.
  This gates on completion of URL signing, as before, not on browser media decoding.

Verification command: `npm.cmd run test:dashboard-detail-streaming-browser`.
The disposable production app copies the real four pages, review workspace and
shared components. It replaces only server dependencies with synthetic records
and mocked actions that throw if submitted. It exercises delayed secondary reads,
read failures/rejections, missing records, a delayed primary record, viewer/posted
states, missing/unsupported media, edited-field preservation, and mobile table
containment. Storage assertions check bucket/path/TTL, and fixture query checks
enforce firm predicates and primary-before-secondary ordering. These are local
behavior checks; they do not prove hosted RLS, real storage signing or production
latency. No production records, credentials or financial mutations are used.

Local verification passed: lint, typecheck, production build, evidence/provenance
(including runtime signed-URL failure/rejection tests), dirty-state interlock,
role affordances, availability, return context, responsive/accessibility contracts,
shared components, semantic accuracy and action-outcome checks. The browser run
passed all four routes at 390/834/1440px and all eight failure/role/primary-loading
scenarios. Evidence is retained outside the repository at
`D:\P\.khataone-filter-navigation-QHRm43` (`detail-results.json` and screenshots).
The twelve synthetic primary-visible observations ranged from 418 to 1040 ms
while secondary reads were deliberately delayed 4000 ms. This is a controlled
dependency check, not production speed or a statistical latency guarantee.

Next: collect representative authenticated mobile traces and read-only database
query plans. Use those measurements to select the next query/auth/payload change;
do not add cross-request permission caching or speculative indexes. The hosted
baseline, background-job measurements and production canary remain outstanding.

## Assessment

There are concrete opportunities to reduce both real waiting time and uncertainty
after a tap. The strongest initial candidates are full-document filter submission,
blocking shell counts, page-wide waits for secondary queries, and missing immediate
navigation feedback. Authentication, search query plans, and mobile main-thread
work need correlated measurements before attributing a share of the reported delay.

UI consistency completion does not establish performance readiness. No retention
or abandonment measurements were available; a retention improvement cannot yet be
quantified.

## Scope and evidence limits

- Traced shared navigation, mobile drawer, header search, filter submission,
  pagination, authentication, workspace loading, dashboard list/detail reads,
  review decisions, clarification, GST generation, export enqueueing, and manual
  worker execution.
- Inspected query/search/index migrations, timing instrumentation, existing browser
  performance harness, loading boundaries, fonts, private evidence previews,
  public assets, and deployment-region configuration.
- Read the required product/design/technical documents and installed Next.js
  navigation/loading documentation; checked current official guidance online.
- No authenticated session or private dashboard records were accessed. No load
  test, provider invocation, query-plan execution, or production setting change
  was performed. Production migrations, signing-key mode, database load, diagnostic
  flags, and current function-region placement remain unverified.
- Existing build artifacts were not treated as fresh bundle measurements. This was
  not an exhaustive CPU profile of every screen or API endpoint.

## Current request flow

For a protected server request, middleware calls Supabase `getUser`. Server
rendering then calls the request-memoized `getFirmContext`, which performs another
`getUser` followed by an active membership lookup. After that, layout counts and
page data can run in parallel. Independent page queries generally use
`Promise.all`; their durations must not simply be added together.

```text
Tap
  -> browser navigation / form submission
  -> middleware auth request
  -> server auth request -> active membership lookup
  -> parallel branches:
       layout: sidebar counts -> shell
       page: rows + lookup lists + counts -> page content
  -> response download -> browser rendering -> usable records
```

Soft navigation can reuse an existing layout. Full-document GET filter submissions
re-enter the initial shell path. Prefetch/cache state can change which work is
needed at click time. Mutations additionally include validation, an authorized
write, invalidation, and sometimes a destination-page render.

## Prioritized findings

### P1 — Shared filters trigger full-document navigation

Confirmed in `src/components/design-system.tsx:768`: `FilterBar` renders a native
`form`. Clients, Inbox, Review Queue, Ledger, Operations, and Audit Logs pass string
actions without a client submission handler. Apply therefore takes the native GET
navigation path. That restarts document rendering and shell work; cached assets
may be reused, so this does not mean every script is downloaded again.

Smallest proposed integration: enhance the shared GET-filter boundary with Next
`Form` or an equivalent URL-preserving client transition. Retain parameter names,
filter semantics, Back/Forward behavior, Enter submission, and accessibility. The
same `FilterBar` is also used by GST and export mutation forms: preserve their
Server Action and pending behavior rather than indiscriminately replacing every
form. Next documents client navigation and progressive enhancement for string
actions in its [Form component](https://nextjs.org/docs/app/api-reference/components/form).

### P1 — Secondary counts block initial shell and page content

Confirmed in `dashboard/layout.tsx:69`: the shell awaits two exact-count queries
before returning. These run even on a mobile initial load, although the mobile
drawer does not receive the count props. The only dashboard `loading.tsx` is below
this layout; it does not cover the layout's own wait.

Confirmed in `dashboard/review-queue/page.tsx:428`: rows, client options, and four
exact-count queries share one `Promise.all` before any page JSX is returned.
Overview similarly waits for six counts plus a row snapshot. Overview and shell
repeat the same review/intake count definitions in separate requests.

Proposed: after authorization, independently stream badges/summary sections and
primary records; reuse a request-scoped count loader where queries are identical.
Measure whether grouping status counts in one tenant-scoped aggregate helps.
Keep unavailable/loading distinct from zero. Badge freshness and refresh behavior
must be explicit; current server-rendered badges are not a realtime subscription.
The [Next loading reference](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
explains that a loading boundary does not wrap its sibling layout.

### P1 — Two auth service calls are on the protected request path

Confirmed in `src/lib/supabase/middleware.ts:102` and `src/lib/firms.ts:34`.
React `cache` already deduplicates workspace loading within a server render, but
does not merge the separate middleware and server calls. Middleware has a
five-second fail-closed deadline; server auth and membership do not use that
application deadline. A timeout is a resilience boundary, not a speed improvement.

Proposed: measure both auth spans and membership independently first. Preserve
the project's documented fresh-user and active-membership guarantees. An optional
later evaluation of verified JWT claims requires checking signing keys, refresh,
revocation expectations, roles, and invalid-session tests. It is not permission to
remove server authorization or trust `getSession` data. Supabase describes the
network/freshness distinction in its [SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

### P1 — Navigation feedback is inconsistent

Confirmed: shared navigation/pagination links do not expose a pending state;
the mobile menu closes immediately on selection; header search closes and uses
`router.push`. There is one generic dashboard skeleton and no nested Suspense
boundaries in the inspected dashboard source. Existing review decision and
generation forms do have pending labels, so feedback is not missing everywhere.

Proposed: shared pending navigation/filter feedback, appropriate route skeletons,
and an updating indicator while retaining usable existing results where practical.
Show feedback promptly, prevent duplicate writes, and distinguish requested,
processing, succeeded, and failed. Never show financial approval as completed
before the server confirms it. Next's [navigation guidance](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
covers streaming, partial prefetching, and link pending feedback on slow networks.

### P2 — Search indexes do not establish an efficient search plan

Confirmed in `20260913110000_complete_dashboard_filtered_results.sql`: Review Queue
and Inbox search use `position(... in lower(concat_ws(...)))` across joined data.
The September 10 trigram indexes target different per-table concatenations.
Those indexes do not directly match these predicates. Tenant/date/order indexes
can still help; a full scan or actual SQL duration has not been measured.

Both pages also issue a second, sequential compatibility query if their RPC is
missing. The later local server trace above confirms this branch for the configured
database, while the hosted server branch remains unverified.

Proposed: verify hosted migration state; inspect query plans using realistic
tenant sizes and the authenticated role; compare blank, common, rare, and no-match
searches. Then select an indexed search shape while preserving cross-field search,
RLS, filtering before pagination, and ordering. Evaluate deep offset pagination
before considering cursors. Do not add indexes solely because a column exists.
See [Supabase query optimization](https://supabase.com/docs/guides/database/query-optimization)
and [PostgreSQL trigram index support](https://www.postgresql.org/docs/current/pgtrgm.html).

### P2 — Some secondary data grows with firm size

Confirmed examples:

- Review Queue, Ledger, GST Summary, and export forms retrieve client option lists
  without an explicit application page limit.
- Audit Logs loads entity types as rows and deduplicates them in application code.
  Its visible-page query also retrieves before/after/metadata for investigation.
- Operations retrieves job-type rows and up to 1,000 health rows, along with counts
  and a pipeline-health snapshot, before rendering its page.
- GST period detail retrieves source transactions without application pagination
  and calculates current blockers from the returned array.

Supabase may impose a server row cap. That is not a complete pagination strategy
and may also make derived totals incomplete for large datasets.

Proposed: bounded/searchable shared selectors, database distinct/aggregate reads,
paginated detail tables, and separately loaded investigation payloads if needed.
Do not calculate whole-period financial or blocker totals from only a visible page.

### P2 — Detail pages and long actions have additional waits

Confirmed: review detail waits for its transaction and then a private-storage
signed URL before rendering. Its image/PDF preview loads the original asset; image
dimensions are not explicitly reserved. GST detail awaits period, source rows,
then audit history; after period authorization, source rows and history can be
independent. Ledger detail similarly awaits entry then audit history.

Proposed: keep ownership checks first, separate evidence/history loading from the
main workspace, reserve preview dimensions, and measure large original-media cost
on phones before introducing private thumbnails or explicit preview loading.

Regular exports already enqueue work. Manual Operations actions instead await
worker execution, and clarification awaits the external WhatsApp send and its
delivery audit. Classify these separately from list navigation. If these are slow,
use the existing durable job pattern with truthful status, retry, and completion
visibility; do not merely detach a promise and claim success. Preserve atomic
approval/ledger/audit behavior.

### P2 — Current monitoring does not establish mobile experience

Confirmed: optional sampled server timing, request correlation, and a browser
click-to-visible-rows harness exist. The harness defaults to three samples and
warms destinations before its main measurements. No application Web Vitals
reporter was found. Current production diagnostic activation is unknown.

Proposed: extend existing instrumentation to measure tap-to-feedback,
tap-to-current-results, mutation confirmation, network/server spans, browser long
tasks, errors, and timeouts. Include phone-class CPU/network profiles and actual
Android Chrome/iOS Safari. Record route templates and timings, not search text,
financial records, tokens, signed URLs, or customer identifiers.

## Cross-page audit map

| Area | Main performance concern / existing strength |
| --- | --- |
| Landing and public auth | Optimized font loading and small public assets; profile hydration/main-thread work and separate cold versus cached delivery. |
| Shell, mobile menu, topbar | Auth and counts before initial shell; limited pending navigation feedback. |
| Clients and Inbox | Bounded 50-row pages already exist; shared native GET filters; Inbox conditional RPC fallback. |
| Review Queue | Bounded rows, but four counts and client options gate the page; search-plan mismatch candidate. |
| Ledger | Bounded list; client selector growth; detail history can be separately rendered. |
| Overview and Reports | Parallel reads already exist; independent counts still gate primary content. |
| GST Summary/detail | List pagination exists; detail source rows need explicit pagination and independent totals/history. |
| Exports | Enqueue workflow exists; measure queue-to-file separately from request acknowledgement. |
| Operations | Multiple health reads and aggregation; manual worker completion is a distinct long-running workflow. |
| Audit Logs | Paged rows, but unbounded entity-type options and potentially large investigation payloads. |
| Settings and Platform | Parallel independent reads; shared auth/shell still applies. No special bottleneck established. |
| Client detail and editing | Entity-first checks are appropriate; stream independent history/counts after authorization. |

## Existing work to preserve

- Request-scoped firm-context memoization and parallel independent reads.
- Server-rendered dashboard pages and bounded principal lists with unique ordering.
- Narrow middleware matcher, shared design components, and existing mutation feedback.
- `next/font` Manrope and a roughly 20 KB original brand asset; no evidence that
  replacing the font or icon library is the principal dashboard fix.
- Queued standard exports, background AI ingestion, transactional review RPCs,
  RLS, private storage, and audit records.
- `vercel.json` selects `hnd1`. TRD/Tracker record a previously verified Tokyo
  database and an earlier median improvement from 1,905 to 913 ms after colocation.
  These are historical records, not fresh measurements. Current placement must be
  checked before changing regions. [Vercel region guidance](https://vercel.com/docs/functions/configuring-functions/region)
  recommends proximity to the data source.
- Tracker records that a previous selective-prefetch experiment reduced request
  count but worsened p95. Do not globally disable prefetch as a presumed fix.

## Public browser observation, 2026-09-16

Chromium headless, 390 x 844 viewport, touch/mobile emulation, no authentication.
One fresh context per mode; landing then login share that context. Constrained mode
requested 4x CPU slowdown, 150 ms network latency, 200,000 bytes/s download and
93,750 bytes/s upload via CDP. Measurements were observed two seconds after load.
Cache, connection reuse, prefetch, and emulation affect these results. This is one
sample per route/mode, not a benchmark or a real-phone field percentile.

| Mode / route | HTTP | Cache header | TTFB ms | Observed LCP ms | Long tasks / total ms |
| --- | --- | --- | ---: | ---: | ---: |
| Normal / | 200 | HIT | 3039 | 3608 | 1 / 66 |
| Normal /login, after landing | 200 | PRERENDER | 82 | 1332 | 0 / 0 |
| Constrained / | 200 | HIT | 280 | 2900 | 3 / 1751 |
| Constrained /login, after landing | 200 | HIT | 82 | 484 | 2 / 119 |

Landing transferred approximately 163 KB of script responses and 215 KB of all
resource responses, excluding the main document. Login reused assets; its smaller
additional transfer must not be represented as its complete standalone bundle.
The slow normal first request cannot be attributed to backend execution from this
probe. The long-task observation justifies profiling, not a claim that a particular
component caused it. INP was not measured by this passive page-load probe.

## Proposed remediation order and acceptance

1. **Establish the current baseline.** Use the existing correlated harness on a
   populated, isolated workspace. Test initial navigation, warm navigation, Apply,
   Clear, presets, pagination, Back, review detail, save, and approval independently.
   Include 390/430 px phones and desktop, normal and constrained networks, small
   and large firms, and expired/refreshing sessions. Start with 30–50 repetitions
   for exploratory comparisons; accumulate larger field samples for reliable tail
   estimates. Include failures/timeouts rather than reporting only successful runs.
2. **Fix shared interaction overhead.** Enhance GET filters, add shared pending
   navigation feedback, and validate URL/history/pagination behavior. This is the
   first implementation slice because it benefits multiple pages without changing
   accounting rules.
3. **Shorten the rendering dependency chain.** Separate shell badges, counts,
   evidence, and histories from primary records; deduplicate identical reads.
   Confirm with traces that faster rows actually reach the screen sooner.
4. **Optimize measured server/database costs.** Verify migrations/regions, inspect
   authenticated query plans, bound lookup data, and consolidate counts where
   beneficial. Revisit auth only through a separately validated security design.
5. **Address measured mobile and job costs.** Profile hydration, long tasks, preview
   bytes, and page payloads. Defer expensive nonessential work where demonstrated.
   Track queue acknowledgement and completion separately for long operations.
6. **Prevent regressions.** Compare a production-mode canary with the baseline;
   retain changes only when correctness, p95, errors, and phone usability improve.
   Use field monitoring after rollout, including slow networks and failed requests.

Initial proposed product budgets, subject to baseline validation:

| Metric | Proposed acceptance target |
| --- | --- |
| Visible acknowledgement of a tap | Within 100–200 ms on target phones |
| Warm list/filter tap to current visible results | p50 <= 700 ms; p95 <= 1,500 ms on the defined normal-mobile profile |
| Initial authenticated usable dashboard | Work toward the existing TRD 2-second normal-firm goal; define and report its percentile explicitly |
| Core Web Vitals, mobile and desktop separately | p75 INP <= 200 ms, LCP <= 2.5 s, CLS <= 0.1 |
| Long jobs | Prompt durable acceptance/status; separate job-type completion targets based on measured work |

These are proposed targets, not achieved results or guarantees on every network.
INP measures responsiveness through the next paint, not the full wait for fetched
records. A fast spinner can coexist with a slow query. Track both. Core Web Vitals
thresholds and the p75 evaluation approach come from [web.dev](https://web.dev/articles/vitals).

Caching should follow an explicit freshness policy. Start with request deduplication
and existing router reuse. Any cross-request cache must be scoped to tenant and
authorization, invalidated after relevant changes, and cleared on session/workspace
changes. Financial writes must be confirmed by the server. No public caching of
private dashboard data, generic Redis rollout, architecture rewrite, or hosting
upgrade is justified by this audit alone.

## Follow-up workflow measurements, 2026-09-17

The [performance handoff](Performance-Measurement.md#review-workflow-baseline-2026-09-17)
now includes three synthetic mobile-emulation trials each for Review Queue
pagination and transaction opening in a disposable local Supabase fixture, one
persisted synthetic review edit, and three read-only hosted transaction-opening
trials. The hosted firm has fewer than 50 review records, so a hosted second-page
timing still requires a populated authorized test workspace. These observations
fill exploratory coverage gaps; they do not establish real-phone p95 or a
before/after improvement. The next diagnostic target is the measured long-task
and save-action interval, with a controlled deployment/dataset comparison before
any further shared-component or query change.

The [isolated detail attribution](Performance-Measurement.md#review-detail-attribution-and-prefetch-crossover-2026-09-17)
subsequently found fast local transaction lookup/update RPC spans and a longer
response-end-to-visible-DOM interval. A row-prefetch experiment reduced requests
but showed no stable latency advantage when the original behavior was restored;
there is no repository prefetch change. A direct browser click probe corrected
the earlier save automation timing. Real-device and controlled hosted checks
remain necessary before a user-facing performance claim.

## Verification performed

- `npm.cmd run test:performance` — passed query-semantic checks.
- `npm.cmd run test:performance-tracing` — passed tracing/privacy/sampling checks.
- `npm.cmd run test:performance-session` — passed mocked auth/cookie/deadline checks.
- Four public browser observations above — HTTP 200.

These checks validate existing safeguards; they do not certify speed. No application
code changed, so a new production build was not needed for this audit. Authenticated
mobile timings, SQL plans, real-device traces, current deployment configuration,
and field percentile/retention evidence remain outstanding.
