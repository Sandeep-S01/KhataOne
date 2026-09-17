# Read-only live dashboard query statistics — 2026-09-17

The active Supabase project's `extensions.pg_stat_statements` was queried through
the CLI in read-only mode. The query returned only aggregate timing and call
counts; it did not return SQL text, tenant IDs, rows, credentials, or document
content. Entries were restricted to `WITH` statements containing the two
dashboard search RPC names and PostgREST's `pgrst_call`/`pgrst_source` markers.
The statistics were last reset on 2026-06-28 at 05:53:54 UTC. These functions
were deployed on 2026-09-17, so the figures describe recorded calls since
their deployment, subject to normal statement-statistics retention.

| PostgREST RPC | Recorded calls | Mean database execution | Maximum recorded execution |
| --- | ---: | ---: | ---: |
| `search_whatsapp_inbox` | 58 | 1.20 ms | 10.15 ms |
| `search_review_queue` | 78 | 3.45 ms | 16.31 ms |

The live planner's approximate table-size estimates were three clients, five
transactions, and 37 WhatsApp messages across the project. They are estimates,
not tenant counts or a substitute for a representative larger-firm workload.
`pg_stat_statements` is cumulative and does not supply a request-level p95 or
separate each filter/page combination here. Its execution times exclude
application work, network transport, browser scripting, and rendering.

The earlier local production-build spans observed approximately 217–616 ms for
successful Inbox RPC operations and approximately 256–263 ms for Review Queue
operations. Those spans include the local app-to-hosted-database path and
cannot be subtracted precisely from these cumulative database statistics.
Together, the evidence does **not** identify PostgreSQL execution as the cause
of the reported multi-second wait in the current small live workspace.

The [isolated larger-firm index benchmark](2026-09-17-isolated-index-benchmark.md)
and [pagination/search follow-up](2026-09-17-pagination-search-followup.md)
remain capacity evidence, not deployment justification for this live dataset.
Keep the two broad index migrations unapplied and the numbered-page/search
contracts unchanged. If a new user-visible delay is reported, capture a
matching app request span and database timing for the specific route and
filter/page state before selecting a narrow remedy. No production data, schema,
or application code changed in this check.
