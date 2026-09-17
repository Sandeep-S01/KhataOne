# Dashboard RPC follow-up — 2026-09-17

The local production build was connected to the active Supabase project after
deployment of the two search RPCs. Performance diagnostics were enabled only on
this temporary local server, at a 100% sample rate. The existing authenticated
browser runner completed three desktop trials each for Review Queue and Inbox;
both lists were populated and all six trials completed. Raw browser diagnostics
remain in ignored `.codex-tmp/performance/` and contain no credentials.

| Server span | Successful RPC durations, ms | Compatibility-query spans |
| --- | --- | ---: |
| Review Queue | 262, 263, 256 | 0 |
| Inbox | 217, 616, 234, 219, 291 | 0 |

The instrumentation can observe multiple page requests per browser trial because
of hard navigation, client navigation and prefetch. Therefore the span count is
not a trial count. Every captured `dashboard.review_queue.query` and
`dashboard.inbox.query` span had status `ok`; no `compat_query` span appeared in
these two local runs. This confirms the post-release application path for the
sampled local build. Hosted server spans were not available, and these timings
include the local app-to-database network path, not only PostgreSQL execution.

Ten `EXPLAIN (FORMAT JSON)` plans were obtained through the Supabase CLI for the
same signed-in account's active firm. Each ran in a `BEGIN READ ONLY` transaction
with a five-second statement timeout, one-second lock timeout, `SET LOCAL ROLE
authenticated`, row security enabled, JWT claim context, and an active-membership
check. `ANALYZE` was **off**, so these are planner choices and estimates, not
execution timings or buffer measurements. No row data, credentials or tenant IDs
are retained here.

| Cases | Relevant planner choices |
| --- | --- |
| Review first page, search, offset page | `transactions_firm_id_idx`, `documents_pkey`, `ai_extractions_firm_id_idx`; sequential scan of the tiny `clients` relation; sort then limit. |
| Inbox first page and search | `whatsapp_messages_firm_id_idx`; sequential scan of `clients`; sort then limit. |
| Review counts | `transactions_firm_id_idx` for all; `transactions_status_idx` for each status count. |
| Review client options | Sequential scan of `clients`, then sort. |

Planner row estimates were one Review Queue row, four Inbox rows, and one client
row on this account. The existing indexes already serve the principal firm/status
access paths at this scale. The sequential client scan is not evidence of a
bottleneck on a relation this small. Do not apply the two pending index migrations
solely because their index names are absent. This sample cannot predict larger
firms, selective-search behavior on larger datasets, p95 latency, or index write
cost. A populated isolated fixture and `EXPLAIN ANALYZE (BUFFERS)` under the same
authenticated role are needed before an index release decision.
