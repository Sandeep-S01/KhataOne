# Dashboard search and pagination follow-up — 2026-09-17

This continues the [isolated index benchmark](2026-09-17-isolated-index-benchmark.md)
in the same disposable Supabase database. Firm A had 40,000 synthetic reviewable
transactions and 40,000 synthetic WhatsApp messages. Every timed query ran as
an authenticated firm member with RLS enabled. Timings are the median of three
warmed `EXPLAIN ANALYZE` executions after one warm-up, on one local machine.
They are diagnostic comparisons, not hosted latency or user-experience claims.

## Default and later pages

The current Review Queue RPC sorts by `(created_at DESC, id DESC)` and Inbox
sorts by `(received_at DESC, id DESC)`, then applies a numbered-page offset.
Both pages pass `(page - 1) * 50` to their RPCs. The shared
`PaginationControls` emits `?page=N` Previous/Next links, and Review Queue
preserves filter/return context in URLs. Those contracts matter if paging is
changed later.

| Query | Existing indexes | Local order-matched index | Candidate index |
| --- | ---: | ---: | --- |
| Review first page | 1,083 ms | 2 ms | `(firm_id, created_at DESC, id DESC)` |
| Review offset 5,000 | 1,082 ms | 525 ms | Same |
| Inbox first page | 7 ms | 2 ms | `(firm_id, received_at DESC, id DESC)` |
| Inbox offset 5,000 | 957 ms | 466 ms | Same |

The Review order-matched index was a **local probe** and is absent from both
pending migrations. Their transaction indexes put `status` or `client_id`
before the timestamp, which did not give the unfiltered Review first page the
same ordered access. The Inbox candidate is already in the later pending
migration. Neither index removes the cost of skipping thousands of rows on a
deep numbered page.

The probe then used the row immediately before offset 5,000 as a cursor and
queried the next 51 rows with the same firm predicate, joins, sort order, and
RLS role. The returned IDs and order matched the existing offset RPC page for
both lists in this static fixture.

| Candidate page query | Without order-matched index | With order-matched index |
| --- | ---: | ---: |
| Review cursor page | 453 ms | 2 ms |
| Inbox cursor page | 3 ms | 2 ms |

The Review cursor plan read 51 transaction rows through the new order-matched
index. Inbox's cursor query was already fast using an existing timestamp
index, so a new Inbox index is not justified by this candidate alone. The
test did not cover changing records between page visits, filtered cursor
navigation, direct links to arbitrary page numbers, or Previous-page behavior.
A production cursor switch would require a reviewed RPC contract, stable URL
and filter semantics, shared pagination changes, return-context handling,
tenant-isolation tests, and representative hosted measurements.

## Text search

Review and Inbox text searches still took roughly 600–655 ms and 406–434 ms
in the prior comparison with and without the 24-index bundle. Their RPCs call
`position()` on a lowercased concatenation assembled after joining records;
the proposed trigram indexes cover different expressions on individual
tables. No proposed trigram index appeared in the authenticated search plans.
The Review sample examined 40,000 joined transaction candidates before the
text filter, and the Inbox sample inspected about 15,000 messages before it
found its requested page. A search rewrite or purpose-built search projection
would need exact filter-result equivalence, RLS checks, and write-maintenance
cost measurements. No current evidence supports a blind trigram deployment.

## Decision

Keep the live RPCs, numbered pagination, and two pending index migrations as
they are. The hosted test workspace remains tiny, and the owner has not asked
for further agent-led app/phone testing in this phase. If a larger authorized
workspace reports slow first pages, status filters, search, or deep paging,
measure that specific path and evaluate the narrow candidate above before a
production migration or UI contract change. No hosted schema, application
code, or financial data was changed by this follow-up.
