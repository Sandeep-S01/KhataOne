# KhataOne Production Runbook

## Release Gate

Do not mark KhataOne production-ready until all of these pass:

- `npm run verify`
- `npm run verify:release-local` for the complete local hardening suite
- `npm run smoke:local` against the running deployment or preview URL
- Supabase migrations applied successfully
- `docs/Production-Smoke-Test-Checklist.md` completed against live credentials
- Export files reviewed by a practicing CA
- Monitoring/log forwarding configured
- Backup and rollback process confirmed

## Deployment Steps

1. Install dependencies with `npm ci`.
2. Run `npm run verify`.
   For a hardened release candidate, run `npm run verify:release-local` instead; it includes
   the build plus local security, financial-integrity, recovery, and performance regressions.
3. Apply Supabase migrations in chronological order.
4. Configure production environment variables from `.env.example`.
5. Deploy the Next.js app.
6. Run `SMOKE_BASE_URL=https://your-domain.example npm run smoke:local`.
7. Complete the production smoke checklist.

## Environment Variables

Required for baseline app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Required for full workflow:

- `OPENAI_API_KEY`
- `OPENAI_EXTRACTION_MODEL`
- `AI_EXTRACTION_PROVIDER_ORDER`
- `JOB_RUNNER_SECRET`
- `CRON_SECRET`
- `READINESS_CHECK_SECRET`
- `RATE_LIMIT_KEY_SECRET`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_IMMEDIATE_INGESTION_ENABLED` (keep `false` until the controlled canary;
  set exactly `true` to enable post-response ingestion wake-up)
- `WHATSAPP_IMMEDIATE_AI_ENABLED` (keep `false` until WA-LAT-3 is deployed and a
  controlled matched text-invoice canary is ready; set exactly `true` to wake only newly
  created extraction jobs after durable ingestion)
- `WHATSAPP_GRAPH_API_VERSION`
- `WHATSAPP_GRAPH_TIMEOUT_MS` (defaults to `10000`; bounded to 1-60 seconds)
- `WHATSAPP_OLDEST_QUEUED_WARNING_SECONDS` (defaults to `60`)
- `WORKER_COMPLETION_WARNING_SECONDS` (defaults to `300`)

Recommended for production:

- `ERROR_TRACKING_DSN`
- `RATE_LIMIT_SHARED_ENFORCEMENT=shared-store` after migration `20260912190000` is applied, or `platform`/`edge` only after that external control is independently verified.
- `RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT=true` after shared enforcement is verified.
- Use independent random values of at least 32 characters for `READINESS_CHECK_SECRET` and `RATE_LIMIT_KEY_SECRET`.
- `TRUST_FORWARDED_IP_HEADERS=true` only when the app is behind a trusted proxy that sets those headers correctly.
- Apply migration `20260912200000_classify_whatsapp_retries.sql` before deploying the
  WA-LAT-4 worker code so terminal failed webhook events are not automatically replayed.
- Apply migration `20260912210000_bound_worker_concurrency_ordering.sql` after `200000`
  and before deploying WA-LAT-5 so overlapping workers honor global sender/client ordering.
- Apply migration `20260912220000_observe_whatsapp_recovery.sql` after `210000` and before
  deploying WA-LAT-6 recovery-route observability.

## WhatsApp Recovery Cadence

- Immediate ingestion and exact-job AI wake-up are the normal path. GitHub Actions invokes
  each protected recovery route at minutes 2, 7, 12, and so on as a safety net.
- After deployment, run `scripts/preflight-whatsapp-recovery-observability.sql`. Expect up
  to 12 completed rows per worker over a healthy one-hour window and investigate missing
  runs or any observed completion gap over five minutes.
- Configure an independent monitor to call protected `/api/health/ready`. Route-side
  structured errors are alert signals only after log/error forwarding is configured; they
  cannot detect a period in which every scheduler invocation is absent.
- Prove recovery with one owner-controlled message while immediate wake-up is deliberately
  disabled, then restore the flag. The event must remain singular and reach terminal status
  within the five-minute schedule plus measured scheduler and worker runtime variance.
- The daily Vercel cron remains a last-resort sweep on Hobby. Move recovery to per-minute
  Vercel cron only after a plan upgrade and a separate deployment/cadence verification.

For no-credit AI testing, set:

```bash
AI_EXTRACTION_PROVIDER_ORDER=rule_based_text
```

This keeps simple WhatsApp text invoices flowing into Review Queue with conservative rule-based extraction.

For legacy key mapping from the old application env file, see
`docs/Environment-Mapping.md`.

## Demo Data

After migrations and at least one Supabase Auth user exist, seed a demo path:

```bash
npm run seed:demo
```

To force a specific owner:

```bash
DEMO_USER_ID=<auth-user-id> npm run seed:demo
```

The demo seed creates a firm, client, source document, approved transaction,
ledger entry, GST period, GST summary, processing job, and audit entry.

## Rollback

- Revert the app deployment to the last known good version.
- Do not roll back database migrations without a tested down migration or backup restore.
- If an export or AI extraction issue affects client data, preserve audit logs and source records before correction.
- Disable external webhook delivery before investigating repeated ingestion failures.

## Incident Checklist

- Check `/api/health/live` for fast application liveness.
- Check `/api/health/ready` or `/api/health` with `Authorization: Bearer <READINESS_CHECK_SECRET>` for environment and database readiness. Keep `/api/health/live` public for load-balancer liveness.
- Treat `rate_limit_enforcement` readiness warnings as a production-hardening blocker for unrestricted target-scale launch.
- Treat `forwarded_ip_trust` readiness warnings as an environment review item before tuning per-IP limits.
- Treat `processing_jobs` readiness warnings as an operations follow-up: inspect queue age, failed jobs, provider credentials, and worker scheduler status.
- Treat `whatsapp_pipeline` readiness warnings as urgent when inbound age exceeds one minute,
  a recovery worker has not completed for five minutes, leases are stale, or terminal
  failures increased recently.
- Check `/dashboard/operations` for failed jobs.
- Check `/dashboard/audit-logs` for recent user/system actions.
- Check Supabase logs and storage bucket access.
- Check WhatsApp webhook signature failures and retry behavior.
- Check OpenAI extraction errors and model configuration.
- Record the issue, affected firm/client IDs, data impact, and corrective action.
