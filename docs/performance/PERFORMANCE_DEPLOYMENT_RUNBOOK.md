# Performance Deployment Runbook

Date: 2026-09-10

## Goal

Validate and deploy the performance fixes without weakening tenant isolation, Supabase RLS, private storage, audit logs, AI review policy, or GST preparation boundaries.

## Pre-deployment Checks

1. Confirm the target branch includes the implementation files and migrations.
2. Run `npm.cmd run verify`.
3. Run `npm.cmd run test:performance`.
4. Confirm no production-only secrets are printed in terminal, logs, or artifacts.
5. Confirm `KHATAONE_PERF_DIAGNOSTICS` is unset or `0` by default.

## Supabase Migration Review

Prepared migrations:

- `supabase/migrations/20260909153000_add_dashboard_performance_indexes.sql`
- `supabase/migrations/20260910113000_add_dashboard_search_and_tiebreak_indexes.sql`

Before applying:

1. Link the Supabase CLI to the correct project or use the Supabase SQL editor with the same reviewed SQL.
2. Verify whether each index already exists:

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
    'clients_firm_status_created_id_idx',
    'clients_firm_created_id_idx',
    'whatsapp_messages_firm_status_received_id_idx',
    'whatsapp_messages_firm_received_id_idx',
    'transactions_firm_status_created_id_idx',
    'transactions_firm_client_status_created_id_idx',
    'ledger_entries_firm_entry_created_id_idx',
    'clients_search_trgm_idx',
    'whatsapp_messages_search_trgm_idx',
    'documents_search_trgm_idx',
    'transactions_review_search_trgm_idx',
    'ai_extractions_risk_flags_gin_idx'
  )
order by tablename, indexname;
```

3. For a large production database, prefer scheduled low-traffic windows and review whether indexes should be created manually with `CREATE INDEX CONCURRENTLY` instead of a transaction-wrapped migration.

## Diagnostic Window

Only during measurement:

1. Set `KHATAONE_PERF_DIAGNOSTICS=1` in the target environment.
2. Reproduce navigation between `/dashboard/clients`, `/dashboard/ledger`, `/dashboard/review-queue`, and `/dashboard/inbox`.
3. Capture `[khataone-perf]` entries from Vercel logs.
4. Remove or reset `KHATAONE_PERF_DIAGNOSTICS` after the diagnostic window.

The log metadata is intentionally sanitized. It should not include emails, firm IDs, user IDs, GSTINs, phone numbers, document paths, invoice numbers, raw WhatsApp payloads, or AI outputs.

## Browser Timing

Install Playwright only in the measurement runner if needed:

```powershell
npm.cmd install -D playwright
npx.cmd playwright install chromium
```

Run:

```powershell
$env:LIVE_DASHBOARD_BASE_URL="https://khataone.vercel.app"
$env:LIVE_DASHBOARD_EMAIL="<set in shell without committing>"
$env:LIVE_DASHBOARD_PASSWORD="<set in shell without committing>"
npm.cmd run perf:browser-dashboard
```

Expected output is JSON with per-route click-to-list-ready samples. Compare it with `npm run perf:live-dashboard` HTTP timings and server spans.

## Acceptance Criteria

- Authenticated repeat navigation p50 is below 1000 ms for Clients, Ledger, Review Queue, and Inbox on representative tenant data.
- No route shows repeat navigation max above 2500 ms in a small diagnostic sample unless a cold start is clearly identified.
- Clients search returns matches beyond the first page.
- Page ordering is stable when multiple rows share the same timestamp.
- RLS still denies cross-firm access.
- Export, ledger approval, audit log, private storage, and GST summary semantics remain unchanged.

## Rollback

Runtime code rollback:

- Revert the application commit and redeploy the previous Vercel version.

Database rollback:

- These migrations only add indexes/extensions. If an index causes unexpected write overhead, drop that specific index by name during a maintenance window.
- Do not drop tables, policies, source documents, raw webhook events, raw AI outputs, or audit records.
