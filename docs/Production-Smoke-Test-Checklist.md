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
- `WHATSAPP_GRAPH_TIMEOUT_MS` is configured or intentionally uses the 10-second default.
- `WHATSAPP_IMMEDIATE_INGESTION_ENABLED` is explicitly `false` before the canary and is
  changed to `true` only for the event-driven ingestion verification.
- `WHATSAPP_IMMEDIATE_AI_ENABLED` is explicitly `false` before the WA-LAT-3 canary and
  is changed to `true` only after the deployment is healthy.
- Job runner secret is configured for non-public job execution.
- Readiness check secret is configured for protected operational diagnostics.
- Readiness and rate-limit key secrets are independent random values of at least 32 characters.
- Shared rate-limit migration is applied before setting `RATE_LIMIT_SHARED_ENFORCEMENT=shared-store` and `RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT=true`.
- WhatsApp retry-classification migration `20260912200000` is applied before deploying
  WA-LAT-4 worker code.
- Worker ordering migration `20260912210000` is applied after `200000` before deploying
  WA-LAT-5 worker code.
- Recovery observability migration `20260912220000` is applied after `210000` before
  deploying WA-LAT-6 worker-route code.
- Error tracking or structured log collection is configured.
- Supabase backups and restore process are confirmed.

## Access And Isolation

- A signed-out user cannot access `/dashboard`.
- A user without a firm is redirected to onboarding.
- Firm A cannot read clients, transactions, GST summaries, exports, audit logs, or jobs owned by Firm B.
- Viewer roles cannot perform mutation workflows once role-specific server checks are finalized.
- Export download route refuses export IDs owned by another firm.

## Core Workflow

- WA-LAT-2 help-message canary passed on 2026-09-12: 66 ms queue-to-claim,
  1.32 s queue-to-acknowledgment, 1.40 s queue-to-terminal status, one event, one message,
  no event error, and no Vercel error logs. Matched text/media canaries remain pending.
- WA-LAT-3 text-invoice canary passed on 2026-09-12: 63 ms queue-to-claim, 976 ms
  queue-to-acknowledgment, 1.18 s queue-to-job creation, and 1.54 s queue-to-extraction
  completion. One row exists at each boundary, output is `needs_review`, no errors or
  historical failed-job replay occurred, and image/PDF/audio canaries remain pending.
- Trigger one controlled retryable provider failure and confirm it becomes due `queued`
  work with a future `scheduled_at`; confirm a permanent failure remains `failed` and
  visible without automatic replay.
- Send controlled work for at least two independent clients plus two ordered messages for
  one sender. Confirm independent work overlaps within the three-ingestion/two-AI caps,
  same-sender/client work remains sequential, and no duplicate document, job, extraction,
  transaction, or acknowledgment is created.
- Create a client with GSTIN and WhatsApp number.
- Receive or seed a WhatsApp document message.
- Confirm the signed webhook returns after durable enqueue without waiting for ingestion.
- With immediate ingestion enabled, confirm one matched message receives exactly one
  acknowledgment before media processing and without waiting for a scheduled run.
- With immediate AI enabled, confirm only the newly created extraction job is claimed;
  existing failed jobs remain untouched and the resulting transaction is draft or
  needs-review rather than approved.
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
- `/dashboard/operations` shows aggregate WhatsApp/AI due work, p95 claim and acknowledgment
  delay, retries, terminal failures, stale leases, and latest worker completion/success.
- `scripts/preflight-whatsapp-recovery-observability.sql` shows service-only functions,
  browser denial, and the expected recovery cadence during the observation window.
- With immediate wake-up disabled for one controlled message, the external recovery sweep
  processes the event within the measured five-minute schedule plus runtime variance; the
  flag is restored immediately afterward.
- Audit entries appear in `/dashboard/audit-logs` for client changes, AI extraction, review actions, ledger corrections, GST summaries, and exports.
- Shared rate limits return `429` across separate application instances on repeated sensitive endpoint calls and fail closed with `503` when the configured store is unavailable.
- Webhook signature failures return `401`.
- Deployment rollback path is documented and tested.

## Data Safety

- Private storage buckets do not expose public URLs.
- Export files cannot be downloaded without active firm membership.
- Source transactions and AI extraction records remain unchanged after ledger corrections.
- GST summary screens state that filing/submission is not performed in v1.
