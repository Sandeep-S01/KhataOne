# Isolated dashboard index benchmark — 2026-09-17

## Boundary and method

This experiment used a disposable local Supabase Postgres container, never the
hosted project. It replayed the 36 migrations currently recorded as applied in
the hosted database and omitted the two pending index migrations. Synthetic
firm A had 300 clients, 40,000 reviewable transactions, and 40,000 WhatsApp
messages; firm B had 30 clients and 10,000 of each record. No customer data or
production credentials were copied. The fixture had no joined documents or AI
extractions, so it is a query stress sample, not a full production data model.

Queries matched the current `search_review_queue` and
`search_whatsapp_inbox` RPC calls, including first/later pages, status, client,
and text filters. Counts and client options matched the dashboard's separate
reads. Each `EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, FORMAT JSON)` ran as an
`authenticated` active firm member with row security enabled and a ten-second
statement timeout. One warm-up run was discarded; values below are the median
of the next three executions. A cross-tenant read returned zero rows. Local
CPU, warmed cache, synthetic data, and the small sample limit any extrapolation
to hosted latency or real-user percentiles.

| Query | Existing indexes | All 24 pending indexes | Observation |
| --- | ---: | ---: | --- |
| Review first page | 1,083 ms | 1,114 ms | No useful improvement. |
| Review status = needs_review | 342 ms | 4 ms | Composite firm/status/order index was used. |
| Review client = one client | 9 ms | 6 ms | Both variants were fast. |
| Review text search | 640 ms | 655 ms | Search still examined many rows. |
| Review page at offset 5,000 | 1,082 ms | 1,137 ms | No useful improvement. |
| Inbox first page | 7 ms | 3 ms | Small absolute difference. |
| Inbox status = received | 3 ms | 4 ms | No useful improvement. |
| Inbox text search | 434 ms | 406 ms | Search still examined many rows. |
| Inbox page at offset 5,000 | 957 ms | 1,023 ms | No useful improvement. |
| Review count, all reviewable statuses | 538 ms | 490 ms | Count still scanned 40,000 firm rows. |
| Client options | 8 ms | 5 ms | Both variants were fast. |

The 24 new indexes occupied about 30 MB in this fixture. The four proposed
trigram search indexes had no observed scans in these RPC runs. The RPCs use
`position()` over `lower(concat_ws(...))`; the proposed indexes cover different
`coalesce(...) || ...` expressions. Those indexes should not be treated as a
fix for the current search implementation without a separately reviewed query
rewrite and tenant-isolation check.

To isolate the strongest signal, all 24 added indexes were removed from the
disposable database. The status-filtered Review Queue query again took 387 ms
(three-run median). Adding only
`transactions_firm_status_created_id_idx` reduced it to 3 ms. The Review first
page and text search stayed near 1,096 ms and 600 ms respectively. This
supports that **one specific index benefits a status-filtered, larger-firm
workload in this fixture**; it does not support deploying both pending
migrations or promise the same improvement for the current small hosted firm.

## Release decision

Keep both pending index migrations unapplied. The current hosted workspace is
too small to establish a production benefit, and the bundled migrations add
overlapping indexes and ordinary index creation. If a larger firm reports a
slow status-filtered Review Queue, repeat the authenticated measurement on a
representative isolated copy and prepare a narrow, rollout-safe index change
for that query. Investigate broad review/inbox search and later-page work as
separate query-shape issues before proposing indexes for them. No application
code, hosted schema, or financial records changed in this experiment.
The [pagination and search follow-up](2026-09-17-pagination-search-followup.md)
tests separate order-matched and cursor-page candidates in the same fixture.
