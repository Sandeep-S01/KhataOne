# Performance measurement handoff

Updated 2026-09-17. This is the measurement gate after the three local remediation
slices in [the audit](Performance-Latency-Audit.md). It does not authorize or claim
a production speed improvement. The RPC migration and its grant-hardening follow-up
were subsequently deployed; the measurements below distinguish pre- and
post-release observations.

## Evidence collected

The existing browser runner completed a bounded, authenticated, read-only sample
against the previously identified live application on 2026-09-16 UTC. It used the
configured credentials without storing them in evidence. No financial actions
were submitted. The deployed commit and dataset size were not verified.

[Sanitized numeric evidence](performance/2026-09-16-mobile-reference.json) contains
only route, browser configuration, timings and request outcomes. The original
diagnostics remain in ignored `.codex-tmp/performance/mobile-live-reference.json`.

Chromium 153, 390 x 844 touch emulation, requested 4x CPU slowdown and 150 ms network
latency, 200,000 B/s download and 93,750 B/s upload. Destination warmed first;
server cold state and runner location unverified. Three observations per metric:

| Review Queue metric | Samples, ms | Median, ms |
| --- | --- | ---: |
| Dispatched navigation click to visible row DOM | 1384, 1451, 1225 | 1384 |
| Automation click to observed rows, including driver overhead | 1700, 1861, 1773 | 1773 |
| Full navigation to observed rows | 2665, 2704, 2064 | 2665 |
| Document TTFB | 1170, 1359, 728 | 1170 |

DOM visibility is not a browser presentation timestamp or INP. Three observations
are too few to establish tail latency. These samples do not measure the unpushed
candidate, so no improvement percentage or budget pass is claimed.

There were three `requestfailed` events for client navigation requests whose
headers reported HTTP 200, despite all three navigations displaying rows. Their
cause is unclassified; do not discard them or label them server errors/cancellations
without further evidence. The runner does not record the failure reason.
Observed navigation-window long tasks reached 306 ms; that window includes mobile
drawer work. This supports further CPU profiling, not attribution to a component.
Document responses used private/no-store headers, but had no server-timing or
performance correlation identifier. TTFB includes network and delivery costs;
it cannot be equated to database execution time.

## Next comparable browser run

Use `npm.cmd run perf:browser-dashboard` with credentials supplied through the
existing secure environment setup. Never paste credentials into commands or
reports. Required configuration is `LIVE_DASHBOARD_BASE_URL`,
`LIVE_DASHBOARD_EMAIL`, and `LIVE_DASHBOARD_PASSWORD`.

1. Record the actual deployed commit, application/database regions, runner location,
   browser version, fixture size and membership role. Keep private identifiers out
   of committed reports. Use an isolated populated workspace for repeated testing.
2. Set `DASHBOARD_BROWSER_PROFILE` to `mobile` or `mobile-constrained`, and
   `DASHBOARD_BROWSER_ROUTES` to a supported list route. Both that list and the
   source overview must contain rows. Empty/error states must not count as fast results.
3. Set `DASHBOARD_BROWSER_SAMPLE_COUNT=30` for exploratory comparisons, and write
   `DASHBOARD_BROWSER_OUTPUT` under `.codex-tmp/performance/`. Compare the same
   dataset, profile, warm state and route on baseline and candidate. Larger field
   samples are needed for reliable tail estimates.
4. Enable `DASHBOARD_BROWSER_CPU_TRACE=1` for a separate short diagnostic run. The
   existing trace retains only duration events, excluding payloads, URLs and stacks;
   nested events overlap and must not be summed as total wall time.
5. Correlate with existing sampled `KHATAONE_PERF_DIAGNOSTICS` server logs where
   already enabled. Hosted setting changes remain a separate deployment operation.
   Compare auth, membership, list and count spans; preserve tenant checks.
6. Record failed attempts and timeouts separately. The runner is fail-fast only
   for login or setup failure. Once warmup begins, it writes an `attempts` record
   for every requested sample, including sanitized failure phase/kind, and marks
   incomplete runs with a nonzero exit code. A missing report remains an incomplete
   setup run, not a zero-duration result. Preserve failed attempts rather than
   reporting successful runs alone. Raw Playwright exceptions can include filled
   values; the runner prints only generic setup failures.

Set `DASHBOARD_BROWSER_INCLUDE_FILTERS=1` and include
`/dashboard/review-queue` in `DASHBOARD_BROWSER_ROUTES` to add one read-only
Review Queue filter cycle after the requested navigation samples. It searches for
an impossible diagnostic term, waits for a confirmed empty result, then clears
and waits for populated rows. The report records Apply/Clear completion and,
where visible in the current document, tap-to-status feedback. It stores no
search term or record content. The existing generic empty copy is accepted as a
valid zero-row result and reported as `empty_state_kind: generic`.

[Sanitized filter observations](performance/2026-09-17-filter-interactions.json)
show one successful sample on the deployed app and one on the local production
build. Apply to empty result took 1,474 ms hosted and 1,662 ms locally; Clear to
rows took 1,214 ms hosted and 1,815 ms locally. The local build showed status
feedback in 83 ms on Apply and 15 ms on Clear. The hosted probe did not observe
the shared status indicator. These environments differ in server location,
deployment revision and delivery path; do not calculate a speed gain or loss from
them. One earlier incomplete validation attempt is retained in the evidence: the
original harness expected only the filtered-empty heading and timed out on the
valid generic-empty heading. That was a harness expectation error, not an app
failure. Client navigation requests still had network-failed events after HTTP
200 headers; their cause is unknown.

The runner covers warm list navigation, full navigations, one filter Apply/Clear
cycle and status feedback. Pagination, detail opening and real Android/iOS
interaction timings remain separate checks; synthetic interaction tests already
cover correctness. Save and approval timing requires a disposable test workspace,
not live customer records.

## Local server timing finding

[Sanitized server spans](performance/2026-09-17-local-server-spans.json) came from
one authenticated production-build run of Review Queue and one of Inbox against
the database configured in `.env.local`. Diagnostics were enabled only on the
temporary local server. Three Review Queue RPC spans returned `error` (226–308 ms),
and each render then took the existing compatibility query (256–289 ms). Three
Inbox RPC spans similarly returned `error` (207–307 ms), then its compatibility
query succeeded (198–221 ms). These calls are sequential in the inspected page
source. The fallback branch only runs when its missing-RPC/schema-cache check
matches. The exact PostgREST error code was not logged, so the evidence does not
separately establish whether the functions are absent in Postgres or only absent
from the schema cache. The local runs recorded 2,043 ms Review Queue and 1,923 ms
Inbox click-to-rows, with one sample each. They are not hosted percentiles.

Authentication and membership reads also took hundreds of milliseconds in some
local requests. Their spans belong to different requests and can overlap with
other reads, so do not add all recorded durations as one critical path. The
confirmed sequential RPC failure and fallback is the first dependency to resolve;
after that, repeat the same trace to decide whether auth, the successful RPC or
mobile CPU work should be next.

## Read-only database plans

`scripts/profile-dashboard-queries.sql` is a psql diagnostic, not a migration. It
uses the actual Review Queue/Inbox RPCs, four existing preset-count predicates,
and the current client-options lookup. It includes first-page, search and offset
cases. It first checks that both function signatures exist in the target database
and stops with a generic error if either is missing. It does not create indexes,
change functions, or alter RLS.

Use an authorized database connection through standard `PGSERVICE`/libpq settings
and a password file or environment secret. No connection URL belongs in command
history. A database role able to `SET ROLE authenticated` is required. With that
role assumed, the script sets an authorized member's JWT claim context and checks
active membership. This measures SQL under RLS; it does not test Auth token
validation, PostgREST serialization, connection pools or HTTP latency.

Example PowerShell, with environment variables securely populated beforehand:

```powershell
New-Item -ItemType Directory -Force .codex-tmp/performance | Out-Null
psql -X -v "firm_id=$env:PERF_FIRM_ID" -v "user_id=$env:PERF_USER_ID" -f scripts/profile-dashboard-queries.sql -o .codex-tmp/performance/query-plans.txt
```

The default is plan-only. On an appropriate test database, add `-v analyze=true`
to collect execution/buffer statistics. Optional `search_term` should be a
representative non-sensitive fixture term; `page_offset` defaults to 50 and is
bounded to 5000. Use both selective and broad fixture searches. Do not infer large
firm behavior from an empty or tiny workspace.

The script uses a read-only transaction, authenticated role, RLS, five-second
statement timeout and one-second lock timeout, ending with rollback. Timeout or
missing-function errors stop the run; do not raise limits merely to get a pass.
Raw plans may contain tenant UUIDs and search literals: keep them in ignored local
evidence and redact before sharing. Run with `psql -X` to avoid local startup files
affecting behavior; `-o` writes the query output, not a single JSON document.

Check estimated versus actual row counts, rows removed by filters, repeated RLS
work, sort spills, buffers and execution time. A sequential scan on a small table
is not automatically a defect. If an RPC is shown only as a Function Scan, the
inner plan is still unknown; obtain an equivalent body plan under the same role
and predicates before proposing an index. Compare deployed migrations/indexes
against repository history first. Never run the diagnostic as an unrestricted
role and present it as authenticated application performance.

PostgreSQL documents that `EXPLAIN ANALYZE` executes the statement and adds profiling
overhead; the script defaults to estimates for that reason.
[PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html).
Supabase recommends testing query behavior with the relevant authenticated role
and JWT context when evaluating RLS costs.
[Supabase RLS guidance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv).

## Historical decision gate before the RPC release

No database connection, psql executable or running local Docker database was
available in this workspace. The diagnostic has been source-reviewed against the
current functions; database execution and query plans remain unverified.

The local page trace raises a more immediate release prerequisite: verify that
`supabase/migrations/20260913110000_complete_dashboard_filtered_results.sql`
is applied to the target Supabase project and that PostgREST can resolve both
RPC signatures for an authenticated user. This migration already exists in the
repository; do not create a replacement. The browser fallback prevents a hard
failure but costs a failed round trip before each compatibility query in the
sampled setup. After the target migration/schema cache is verified, rerun the
authenticated Review Queue and Inbox checks and confirm that `compat_query`
spans disappear and successful RPC spans replace the errors. Only then run
query plans to decide on any index or SQL changes. Database access needed for
this verification/application was not configured at the time of this gate.

### Direct authenticated RPC result, 2026-09-17

`npm.cmd run preflight:dashboard-rpcs` now calls both RPCs with the same named
arguments as the pages, using a normal active firm membership and a one-row
limit. It retains only status and error code. The read-only check returned
`PGRST202` for **both** functions on the Supabase project configured in
`.env.local`; see [sanitized evidence](performance/2026-09-17-rpc-deployment-check.json).
The CLI exits nonzero until both RPCs become available. It creates an in-memory
login session and does not print credentials, tenant IDs or returned rows.

Supabase defines `PGRST202` as a function signature missing from PostgREST's
schema cache, which can mean a stale signature or that the function does not
exist in the database. The result confirms the local app's fallback trigger;
it does **not** by itself distinguish a missing migration from a stale cache.
[Supabase PostgREST error codes](https://supabase.com/docs/guides/api/rest/postgrest-error-codes).

Before a database release, confirm that the configured project is the intended
target, then inspect its migration history and the CLI dry-run. The repository
contains many migrations, so review **all** pending entries before running a
remote push. Supabase's documented sequence is `supabase link`,
`supabase migration list`, `supabase db push --dry-run`, then `supabase db push`
once the target and pending set are correct. Do not put a database password on
the command line or run a remote reset.
[Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations),
[CLI reference](https://supabase.com/docs/reference/cli/su).

### Read-only database verification, 2026-09-17

CLI login now works. Its project list identifies the KhataOne project whose ref
matches the app's configured Supabase URL. Explicit `--project-ref` checks
reached that database without modifying it. `migration list` reports all 37
repository migrations as local-only, and `db push --dry-run --skip-vault` would
push all 37. SQL metadata confirms the live `firms`, `transactions`, and
`whatsapp_messages` tables exist, while
`supabase_migrations.schema_migrations` and both `search_review_queue` and
`search_whatsapp_inbox` functions do not. The table columns and
`is_firm_member(uuid)` dependency needed by the final RPC migration exist.
This is an untracked live schema, not an empty database. Do not run the proposed
37-migration push. Reconcile the existing schema with repository migrations
before recording a baseline or deploying only the missing RPC definitions.
No schema or migration history was changed during this check.

The deeper [schema reconciliation inventory](performance/2026-09-17-supabase-schema-reconciliation.md)
replayed all 37 migrations successfully in an isolated local Supabase database
and compared the resulting catalog with production. The 28 existing functions,
shared policies, triggers, index definitions, and most columns/constraints
match. Production lacks the two search RPCs, 24 dashboard indexes, `pg_trgm`,
and two client checks; its legacy `clients.phone` column is `NOT NULL` rather
than nullable. Keep the blanket push and blanket migration-history repair
blocked. The missing indexes should be prioritized from query plans rather
than name presence alone.

If migration history says `20260913110000` is applied, check the two exact
function signatures and `authenticated` EXECUTE privileges directly in the
database. If the functions exist with matching signatures but PostgREST still
returns `PGRST202`, refresh its schema cache through the project's normal
database administration path and rerun the preflight. Supabase documents
`NOTIFY pgrst, 'reload schema';` for that case.
[Supabase schema refresh](https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema).
If the functions are absent despite migration history, reconcile that drift
through the controlled migration process rather than hiding the failed RPC in
another application fallback.

Verification for this preflight addition: `npm.cmd run verify` (lint, typecheck,
production build), `test:dashboard-filter-rpcs`, `test:dashboard-rpc-compatibility`,
`test:performance`, and `git diff --check` passed. The live preflight exited
nonzero as intended for the two `PGRST202` results. This verifies detection and
safe reporting, not migration deployment or post-migration speed.

Verification: `test:performance`, `test:performance-tracing` and
`test:performance-session` passed, as did whitespace checks and a source check of
the diagnostic's ten EXPLAIN statements, read-only transaction/role settings and
absence of data/schema mutations. Numeric evidence consistency was checked. These
are not SQL execution tests. This follow-up changes diagnostic files and
documentation only; the earlier application build verification remains recorded
in the audit.

Choose later implementation from evidence: SQL/index work for expensive query
plans; bounded lookup data for measured payload growth; frontend work for attributed
CPU cost. Revisit auth only with measured spans and a separate security review.
Candidate deployment comparisons, representative SQL plans, real-phone checks,
failure-inclusive field monitoring and background-job timing remain outstanding.

## Controlled RPC release and post-release check, 2026-09-17

The [schema reconciliation and release record](performance/2026-09-17-supabase-schema-reconciliation.md)
documents the verified migration-history baseline and two narrow pushes. The
existing `20260913110000` migration created both missing search RPCs. The forward
`20260917060000` migration removed Supabase's explicit `anon` EXECUTE grants while
preserving authenticated access. `migration list` shows 36 applied versions and
only the two previously identified index migrations pending. The authenticated
one-row preflight now reports both RPCs `available` without `PGRST202`; catalog
checks show both functions are security-invoker, `anon_execute=false`, and
`authenticated_execute=true`. No financial/customer rows were changed.

A [sanitized three-sample hosted mobile check](performance/2026-09-17-post-rpc-mobile-sample.json)
completed after the database change, with three successful populated Review Queue
loads. Click-to-visible-row DOM was 941, 1,217 and 1,625 ms (sorted); full
navigation to rows was 1,764, 2,135 and 2,902 ms. These are synthetic-browser
observations, not INP, a real-phone measurement or a reliable p95. Deployment
revision, server state and run conditions are not controlled sufficiently to
credit any difference from the earlier three samples to the RPC deployment.

At the RPC release, successful RPC/no-fallback spans and authenticated SQL plans
remained to be checked. The local small-firm checks below now cover those paths;
hosted server spans and a representative populated test firm remain outstanding.
Keep both index migrations pending until their benefit and write cost are
measured. The deployed application commit and larger-firm behavior remain
unverified.

### Local RPC path and plan-only results

[Post-release query evidence](performance/2026-09-17-post-rpc-query-plans.md)
records a local production-build run against the current database: three populated
browser trials per page completed; every captured Review Queue and Inbox RPC span
was successful, with no compatibility-query span in the sampled requests. Ten
read-only `EXPLAIN` plans ran as an authenticated active firm member with RLS on.
Existing firm/status indexes serve the principal tables in these small-data
plans. This clears the local fallback-path check, not hosted server-span or
representative large-firm performance checks. No index migration was applied.

## Review workflow baseline, 2026-09-17

[Sanitized workflow evidence](performance/2026-09-17-workflow-baseline.json) adds
the previously missing pagination, transaction-opening and save observations.
The new `npm run perf:workflow-dashboard` runner follows real Review Queue links
and records click-to-visible-DOM, correlated RSC first-byte timing and long tasks.
Its optional save check requires both an explicit disposable-save flag and a
synthetic user on a loopback app. It reloads the page to confirm persistence.
The disposable run used an isolated local Supabase stack with one synthetic firm,
one client and 64 reviewable transactions. The app build used only that local
Supabase URL and key. No customer financial record was edited.

On a 390 x 844 emulated mobile viewport with requested 4x CPU slowdown and
150 ms network latency, local pagination click-to-visible-DOM took 658-915 ms
across three trials; opening a review transaction took 638-1,440 ms. One
disposable description edit had a 2,383 ms **automation** interval to the
action response and ready button, and its value persisted after reload. That
interval includes Playwright driver overhead; the browser-click correction below
is the better user-facing diagnostic. In a separate read-only hosted run, opening a
transaction took 1,022-1,358 ms across three trials. A hosted second-page
sample is unavailable because the authorized firm has fewer than 50 review
records. No hosted save was attempted.

These are small exploratory samples, not p95, actual paint, INP or real-phone
results. RSC first-byte wait includes network plus server time; time after the
first byte also includes transfer and scheduling, so it is not a pure React
render duration. One hosted trial had no valid split because of streaming or
prefetch clock order. The local synthetic dataset and hosted environment are not
equivalent, so the numbers do not establish an improvement or regression.
Next, compare the same deployed revision and dataset under repeated phone and
browser profiles, then profile the long tasks and save-action server span before
choosing another optimization. Hosted pagination still needs a populated,
authorized test firm; live financial saves remain excluded.

## Review detail attribution and prefetch crossover, 2026-09-17

[Sanitized attribution evidence](performance/2026-09-17-review-detail-attribution.json)
comes from an isolated 64-record fixture and a production-mode build with
diagnostics enabled. The review detail transaction lookup took 9-18 ms in
sampled local spans. In five original-behavior browser trials, the selected
approximately 3.2 KB encoded RSC response ended 717-1,206 ms before its
heading became visible. A single Chrome renderer trace recorded two FunctionCall
events over 50 ms, with a largest event of 160 ms. Those observations point to
client-side scheduling/render work and competing prefetch as candidates, but
do not identify a specific component or measure React render time directly.

A **disposable-copy-only** experiment disabled prefetch on Review Queue row
links. It reduced captured detail-route prefetch requests from 11-15 to 2-4
per click. The original first five-trial median was 1,204 ms, the candidate
median was 818 ms, and the restored-original median was 797 ms. The restored
run removes the apparent consistent speed win. Warm state, order and two setup
timeouts limit this crossover; no repository prefetch behavior was changed.
This also agrees with the earlier sidebar prefetch preview's warning against
assuming fewer requests means faster navigation.

Two later successful disposable saves used a browser click probe. The button
showed `Saving...` after 30 and 81 ms and returned to ready after 874 and
954 ms; both edits persisted. The action's transaction lookup spans took
9-11 ms and its update RPC spans took 15-54 ms across the profiling session.
The older 2,383 ms automation number should not be presented as a customer's
save wait. The remaining difference includes browser scheduling, action
transport, redirect/re-render and driver overhead; no single cause is proven.
Two setup attempts timed out before measurement and remain recorded as failures.
The next useful check is repeated real-device and hosted canary measurement
with the same revision, dataset and network profile, plus a symbolized client
CPU profile before editing rendering or prefetch policy.

A separate read-only hosted trace opened the review detail in 1,038, 1,205
and 736 ms. Two valid timing splits showed click-to-first-byte waits of 519
and 464 ms and response-end-to-visible-DOM intervals of 424 and 149 ms;
the third split was invalid because of streaming/prefetch ordering. One
sanitized renderer trace had a largest FunctionCall event of 162 ms. The
hosted run did not attempt a save or pagination. It supports measuring both
server/network and client work; it does not connect those events to a specific
source function or establish a field percentile.

## Live small-workspace read-only audit, 2026-09-17

The authorized test account was used to open every top-level dashboard route on
the live site. No client, transaction, financial, export, or job mutation was
submitted. Browser reports contain route names and aggregate timings only; no
credential, user identifier, customer field, screenshot, or document content was
recorded. The deployed application commit was not independently verified.
The workspace had no visible Review Queue, Inbox, Ledger, GST, Reports, or Export
rows, but other administrative/client table rows existed; call it *lightly
populated*, not a proven empty database. The raw sanitized results are in
[desktop/mobile route samples](performance/2026-09-17-live-small-firm-routes.json),
[constrained one-pass samples](performance/2026-09-17-live-constrained-onepass.json),
[constrained repeats](performance/2026-09-17-live-constrained-repeat.json),
[focused Review Queue recheck](performance/2026-09-17-live-review-recheck.json),
and [filter cycles](performance/2026-09-17-live-small-firm-filters.json).

| Check | Observation |
| --- | --- |
| Direct authenticated requests | Six core routes returned HTTP 200. Overview took 2,195 ms end-to-end; the other five took 584-1,030 ms in one server-side request pass. |
| Chromium, normal desktop | Two full loads of each of 12 routes completed. Overview settled in 1,296-1,711 ms. Inbox was 1,240 and 3,132 ms; the other routes were 766-1,505 ms. |
| Chromium, normal 390px mobile emulation | Two full loads of each of 12 routes completed in 750-1,204 ms. This was a warmed synthetic browser, not a physical phone. |
| Chromium, constrained 390px mobile emulation | Requested 150 ms network latency and 4x CPU slowdown. First full loads of Overview, Inbox, Review Queue, Clients, Ledger and GST settled in 4,448, 2,708, 3,658, 2,415, 2,150 and 2,303 ms respectively. |
| Constrained repeat | Three attempts each of Overview, Inbox, Review Queue. Successful warm Overview loads settled in 1,926-2,137 ms, Inbox in 1,379-2,288 ms, and Review Queue in 2,090-2,244 ms. One Review Queue attempt timed out and cannot be counted as a fast or successful load; a separate five-attempt Review Queue recheck completed in 1,544-4,346 ms. |
| Internal navigation | Desktop sidebar links kept the document mounted and generally settled in about 0.6-1.5 seconds. Four constrained-mobile links settled in 0.9-1.6 seconds. |
| Read-only filter Apply/Clear | Review Queue, Inbox and Clients each passed on desktop and normal mobile. Apply committed filtered results in 643-899 ms; Clear returned in 586-812 ms. These transitions kept the document mounted. Review Queue and Inbox show generic “no items yet” copy for a no-match search, while Clients uses a filtered-empty message. |

All 12 routes returned HTTP 200 in the normal browser pass, with no page or
console errors or HTTP 5xx responses there. The constrained run had one
unclassified failed resource and the repeat had one console event; neither was
captured with enough context to diagnose. The original browser runner also
recorded network-failed requests during full navigations, which may include
cancelled prefetches; classify them before calling them application failures.

Initial document first byte arrived in approximately 70-260 ms on the
constrained samples, but full response delivery and visible heading came much
later. For example, the first constrained Overview response ended around 1.1
seconds while its heading appeared around 4.2 seconds. This supports profiling
streaming completion and browser main-thread work separately; it does not prove
which component or query caused the wait. Two samples per route and three core
repeats do not establish p95 or physical-phone performance. The 1-4 second
wait remains **unresolved**, especially on constrained devices and first loads.
Next, correlate a repeatable cold/warm browser trace with sampled server auth,
membership, primary-query and React/render spans, then test a real Android and
iPhone before attributing or changing the critical path.

## First-load attribution follow-up, 2026-09-17

Two further fresh-context Overview loads used 390×844 Chromium touch emulation,
requested 150 ms network latency and 200 KB/s download, and 4× CPU slowdown.
The sanitized [attribution summary](performance/2026-09-17-initial-load-attribution.json)
contains no credentials, account identifiers, private record data, or screenshots.
The document response ended at 0.88–1.11 seconds, first contentful paint was
2.60–2.72 seconds, the CA operations heading appeared at 6.00–6.04 seconds,
and the page settled at 6.66–6.75 seconds. A shared React DOM/runtime chunk
transferred approximately 73 KB (229 KB uncompressed) and took 2.44–2.93
seconds to evaluate under the requested 4× CPU slowdown. Browser long-task
observation also recorded a 2.45–2.98-second task around that point. This
identifies a substantial **browser main-thread cost** on these simulated cold
loads; it does not identify an application component to remove. One earlier
Overview trial took about 26 seconds, but it was not reproduced and its cause
remains unclassified.

For a separate local production-build pass against the configured hosted
Supabase project, six authenticated Overview/Inbox/Review Queue navigations
completed in 1.01–1.99 seconds to visible heading without CPU/network
throttling. Correlated server spans show sequential middleware `getUser`
(213–566 ms), server firm-context `getUser` (224–339 ms), and firm membership
lookup (205–268 ms). The route's list/count queries then ran concurrently:
typical spans were 218–319 ms, with one Overview export-attention count at
543 ms. These are local-to-hosted measurements, **not** production Vercel
server spans; they establish where the local critical path spends time but
cannot be subtracted from the live browser trace as an exact decomposition.

The largest confirmed simulated browser cost is shared React runtime
evaluation; a speculative dashboard component or prefetch edit would not
remove that runtime and the earlier prefetch crossover showed no stable win.
The controlled server path also has multiple sequential remote auth/membership
calls, so an independently measured auth gate is a suitable small candidate.

### Protected-route auth-gate candidate

The configured Supabase project publishes one ES256 verification key. Supabase
[documents `getClaims()`](https://supabase.com/docs/reference/javascript/auth-getclaims)
as verified JWT checking that can run locally with asymmetric signing keys,
while `getUser()` always fetches the current user from Auth. For protected
dashboard/onboarding requests, middleware now uses `getClaims()` as its first
gate. Login/signup middleware still uses `getUser()`. The dashboard's server
`getUser()` and firm membership lookup, onboarding's server `getUser()`, and
server-action authorization checks remain unchanged. This preserves the
authoritative current-user and firm checks before private data is read or
mutated. Invalid sessions still redirect; unexpected auth errors remain 503.

In a local production build against the same hosted Supabase project, the
middleware gate took **5–9 ms in six candidate protected navigations**, versus
**213–566 ms in six original navigations**. The server-side `getUser()` and
membership checks still took 243–532 ms and 251–309 ms respectively in the
candidate. Visible headings across Overview, Inbox and Review Queue took
893–1,252 ms in the candidate versus 1,008–1,993 ms in the original local
sample. The before/after samples were sequential, small, and subject to
network/cache variance, so this is a promising local improvement rather than
a field latency percentile or proof that all users save the entire auth-span
difference. The focused auth/timeout test, security-boundary and tracing
tests, lint, typecheck, production build, and unauthenticated redirect passed.

This candidate does **not** change the measured shared React runtime cost on
slow simulated phones. At this local checkpoint it had not yet been deployed
or checked on physical Android/iPhone devices. The reported 3–4-second wait
remained open pending deployed and real-device verification.

### First deployed read-only verification

Commit `07a9eab` was pushed to `main`. GitHub CI and the Vercel commit status
both completed successfully. After that status, six authenticated direct
requests to the live Overview, Clients, Ledger, Review Queue, Inbox, and GST
Summary routes returned HTTP 200. The Overview request took 2,547 ms; the
other five took 531–935 ms. An unauthenticated dashboard request still
redirected to `/login?next=%2Fdashboard`.

Two fresh-context live browser loads each of Overview, Inbox, and Review Queue
used the same requested 390×844 touch, 150 ms RTT, 200 KB/s download, and 4×
CPU profile as the earlier attribution run. All six returned HTTP 200 and
finished without a heading or loading-state timeout. Overview headings were
visible in 3,491–4,265 ms, Inbox in 3,677–4,330 ms, and Review Queue in
3,522–3,992 ms. First contentful paint was 2,076–2,808 ms. The longest
observed browser task in each run was 804–1,517 ms, so meaningful browser
work remains after the server response. The sanitized
[deployed check](performance/2026-09-17-deployed-auth-gate-check.json) records
route-level timings and excludes session or customer data.

These small sequential samples show the protected routes still work and that
the prior approximately 6-second Overview pair was not repeated in this pair.
They do **not** establish a statistically reliable before/after improvement:
the older broader constrained run included faster Overview samples, and the
live server auth spans are unavailable. No physical Android or iPhone was
connected to this workspace. The 3–4-second slow-device wait remains open;
the next useful investigation is a physical-device trace or equivalent real
user timing that separates network, server, shared runtime execution, and
page hydration on the same deployed revision.

## Controlled browser CPU and viewport follow-up, 2026-09-17

After the deployed auth-gate check, the live Overview was measured in four
fresh-context Chromium conditions. Every condition requested the same 150 ms
RTT and 200 KB/s download; viewport and requested CPU slowdown varied. Two
read-only runs were completed per condition. The sanitized
[CPU/viewport matrix](performance/2026-09-17-client-cpu-matrix.json) contains
only timings and browser event categories.

| Viewport | Requested CPU | Document response end | Heading visible | Longest layout event |
| --- | ---: | ---: | ---: | ---: |
| Desktop 1440×900 | 1× | 865–947 ms | 1,092–1,216 ms | 68–72 ms |
| Phone-sized 390×844 | 1× | 912–1,079 ms | 1,417–1,538 ms | 41–74 ms |
| Desktop 1440×900 | 4× | 791–885 ms | 4,176–4,923 ms | 1,029–1,668 ms |
| Phone-sized 390×844 | 4× | 782–929 ms | 3,671–3,889 ms | 831–1,153 ms |

The similar response-end ranges and much larger 4× browser intervals point
to main-thread work, not a proportional server or document-transfer delay,
in this synthetic profile. Chrome attributed substantial 4× time to layout
and script evaluation. A separate CPU sample across Overview, Inbox and Review
Queue showed the same broad desktop-versus-constrained pattern, but most
samples were in browser `(program)` frames and minified shared runtime code.
That sample cannot identify a specific KhataOne component or establish that
removing any one component would reduce user-visible latency. CPU throttling
is a laboratory approximation and two samples per condition cannot establish
field percentiles or a physical-device outcome. No application code was
changed from this evidence.

`adb devices -l` found **no connected device**, so no physical-phone trace
was taken. The product owner has since manually checked the experience and
decided that a separate phone trace or further agent-led app testing is not
needed for this phase. Treat the synthetic 4× finding as a recorded limitation,
not a release blocker or proof that the wait is resolved. Resume targeted
performance work only if a new user-visible problem is reported. If a physical
trace is later needed, Chrome supports
[remote-device inspection](https://developer.chrome.com/docs/devtools/remote-debugging)
and [record-and-reload tracing](https://developer.chrome.com/docs/devtools/performance/reference);
raw authenticated traces should remain private because they may contain
customer data.
