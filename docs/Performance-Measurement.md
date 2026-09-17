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
