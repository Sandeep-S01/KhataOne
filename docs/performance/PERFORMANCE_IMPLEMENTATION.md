# KhataOne Performance Implementation

Date: 2026-09-10
Base commit: `676a5bb`
Mode: safe local implementation, no production deployment

## Summary

This pass implemented the safe parts of the performance plan and prepared the database work that still needs Supabase project access. It does not claim the live 2-3 second authenticated navigation delay is fixed, because authenticated browser timing and production query plans are still not available from this checkout.

## Implemented Changes

### F001 - Authenticated dashboard timing

Status: PARTIALLY IMPLEMENTED

- Added opt-in server timing spans through `KHATAONE_PERF_DIAGNOSTICS=1`.
- Instrumented middleware auth, firm context auth, firm membership lookup, Clients, Inbox, Review Queue, Ledger, and health database checks.
- Added `npm run perf:browser-dashboard` as an optional Playwright browser harness for click-to-usable-data timing.
- Kept all timing metadata sanitized. It records route classes, filter booleans, page number, and durations, not emails, firm IDs, user IDs, document paths, or payloads.

Remaining evidence:

- Run `npm run perf:browser-dashboard` with `LIVE_DASHBOARD_EMAIL` and `LIVE_DASHBOARD_PASSWORD` in a safe runner where Playwright is installed.
- Enable `KHATAONE_PERF_DIAGNOSTICS=1` only during a short diagnostic window and inspect Vercel logs for the `[khataone-perf]` entries.

### F002 - Production index state

Status: PREPARED, NOT APPLIED

- Added `supabase/migrations/20260910113000_add_dashboard_search_and_tiebreak_indexes.sql`.
- The migration adds deterministic pagination tie-break indexes and trigram search indexes for dashboard list/search workflows.
- Production application is intentionally left to the Supabase deployment phase because this checkout still cannot verify the linked Supabase project/migration history.

### F003 - Dynamic server navigation

Status: OBSERVABLE

- No auth/RLS shortcut was introduced.
- The expensive pieces on the authenticated navigation path are now independently measurable: middleware auth, `getFirmContext()` auth, membership lookup, and page-level data reads.

### F004 - Post-page filtering

Status: PARTIALLY FIXED

- Fixed Clients search so business name, contact name, phone, WhatsApp phone, GSTIN, and state code search are applied in Supabase before `.range(...)`.
- Added a sanitized PostgREST OR pattern helper so raw user search text is not interpolated into `.or(...)`.
- Added deterministic `id desc` tie-break ordering on Clients, Inbox, Review Queue, and Ledger page queries.
- Moved Review Queue `low_confidence` filtering to the database because it is a base transaction column.
- Left relationship-aware Inbox search and Review Queue client/document/risk-flag search observable but not fully moved, because preserving exact behavior without fetching whole tenant pages requires a database-side view/RPC/query contract.

### F005 - Pagination/count behavior

Status: PARTIALLY IMPROVED

- Hot pages keep bounded page-size plus lookahead fetches.
- Clients no longer displays counts derived from a filtered in-memory subset.
- Exact total counts remain deferred until authenticated timing shows where count queries are needed and where approximate or cached counts are better.

### F006 - Export generation

Status: DEFERRED

- No export generation behavior was changed in this pass. Export work can mutate storage and audit records, so it needs isolated integration tests before moving request-time generation into jobs.

### F007 - Worker throughput

Status: DEFERRED

- WhatsApp and AI worker throughput was not changed. Sequential worker behavior is safer until idempotency and retry regression tests exist for representative queued jobs.

### F008 - Health endpoint

Status: IMPROVED

- The health endpoint now includes Supabase database check duration in the database check message.
- The same check is covered by optional server timing logs.

### F009 - Browser user experience

Status: PREPARED

- Added a browser harness for navigation measurement. It measures sign-in through the real UI and then records dashboard route click-to-list-ready durations.
- This is intentionally not a load test and does not send WhatsApp messages, trigger AI extraction, or mutate accounting data.

## Validation

Commands run locally:

- `npm.cmd run test:performance` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.

Not run:

- Authenticated live browser timings, because local live dashboard credentials are not present in this checkout.
- Supabase migration verification/application, because the Supabase CLI project link is still unavailable locally.
- Export and worker load tests, because those can mutate production-adjacent data or call paid/external services.

## Remaining Implementation Plan

1. Run authenticated browser timing on live and local production builds with the same seeded tenant size.
2. Enable `KHATAONE_PERF_DIAGNOSTICS=1` temporarily and correlate browser delay with middleware, firm context, and page query spans.
3. Verify production indexes and apply pending Supabase migrations only through the approved Supabase release process.
4. Implement database-side exact search endpoints/views for Inbox and Review Queue so cross-table search, document type, and risk-flag predicates happen before pagination.
5. Re-run `npm run perf:browser-dashboard`, `npm run perf:live-dashboard`, and `npm run verify` after migration and runtime search changes.
