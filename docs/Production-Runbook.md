# KhataOne Production Runbook

## Release Gate

Do not mark KhataOne production-ready until all of these pass:

- `npm run verify`
- `npm run smoke:local` against the running deployment or preview URL
- Supabase migrations applied successfully
- `docs/Production-Smoke-Test-Checklist.md` completed against live credentials
- Export files reviewed by a practicing CA
- Monitoring/log forwarding configured
- Backup and rollback process confirmed

## Deployment Steps

1. Install dependencies with `npm ci`.
2. Run `npm run verify`.
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
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_API_VERSION`

Recommended for production:

- `ERROR_TRACKING_DSN`

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

- Check `/api/health`.
- Check `/dashboard/operations` for failed jobs.
- Check `/dashboard/audit-logs` for recent user/system actions.
- Check Supabase logs and storage bucket access.
- Check WhatsApp webhook signature failures and retry behavior.
- Check OpenAI extraction errors and model configuration.
- Record the issue, affected firm/client IDs, data impact, and corrective action.
