# KhataOne Production Smoke Test Checklist

Run this checklist before marking a deployment production-ready.

## Automated Checks

- `npm run verify` passes.
- `SMOKE_BASE_URL=<deployment-url> npm run smoke:local` passes.
- `LIVE_DASHBOARD_BASE_URL=<deployment-url> npm run perf:live-dashboard` passes with `LIVE_DASHBOARD_EMAIL` and `LIVE_DASHBOARD_PASSWORD` configured for an approved live test account.
- `/api/health/live` returns `ok`.
- `/api/health` or `/api/health/ready`, called with the readiness bearer secret, returns `ok` or an expected `degraded` status with only intentionally disabled integrations; unauthenticated production requests return `401`.

## Environment

- Supabase URL, anon key, and service role are configured.
- OpenAI API key and extraction model are configured.
- WhatsApp verify token, app secret, access token, phone number ID, and Graph API version are configured.
- Job runner secret is configured for non-public job execution.
- Readiness check secret is configured for protected operational diagnostics.
- Readiness and rate-limit key secrets are independent random values of at least 32 characters.
- Shared rate-limit migration is applied before setting `RATE_LIMIT_SHARED_ENFORCEMENT=shared-store` and `RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT=true`.
- Error tracking or structured log collection is configured.
- Supabase backups and restore process are confirmed.

## Access And Isolation

- A signed-out user cannot access `/dashboard`.
- A user without a firm is redirected to onboarding.
- Firm A cannot read clients, transactions, GST summaries, exports, audit logs, or jobs owned by Firm B.
- Viewer roles cannot perform mutation workflows once role-specific server checks are finalized.
- Export download route refuses export IDs owned by another firm.

## Core Workflow

- Create a client with GSTIN and WhatsApp number.
- Receive or seed a WhatsApp document message.
- Store the raw WhatsApp event and original media.
- Create a processing job for the document.
- Run AI extraction for a text-backed document.
- Review and approve the transaction.
- Confirm ledger entry creation.
- Generate GST summary for the approved period.
- Generate transactions CSV, GST summary CSV, and GST summary PDF.
- Download generated exports through the authenticated route.

## Operations

- Failed extraction jobs appear in `/dashboard/operations`.
- Audit entries appear in `/dashboard/audit-logs` for client changes, AI extraction, review actions, ledger corrections, GST summaries, and exports.
- Shared rate limits return `429` across separate application instances on repeated sensitive endpoint calls and fail closed with `503` when the configured store is unavailable.
- Webhook signature failures return `401`.
- Deployment rollback path is documented and tested.

## Data Safety

- Private storage buckets do not expose public URLs.
- Export files cannot be downloaded without active firm membership.
- Source transactions and AI extraction records remain unchanged after ledger corrections.
- GST summary screens state that filing/submission is not performed in v1.
