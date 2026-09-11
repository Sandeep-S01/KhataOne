# Production Hardening Phase 2 Verification Results

Date: 2026-09-11

## Commands Run

```text
npm.cmd run test:hardening
npm.cmd run test:phase2-hardening
npm.cmd run test:performance
npm.cmd run typecheck
npm.cmd run verify
git diff --check
npm.cmd run preflight:export-migration
npm.cmd run test:export-worker
npm.cmd run test:media-extraction-worker
npm.cmd run seed:phase2-staging-fixtures
npm.cmd run smoke:local -- --base-url http://localhost:3001
npm.cmd run cleanup:phase2-staging-fixtures
```

## Results

| Check | Result | Notes |
| --- | --- | --- |
| `npm.cmd run test:hardening` | PASS | Phase 1 atomic approval and CSV safeguards still pass after export worker refactor. |
| `npm.cmd run test:phase2-hardening` | PASS | Static checks confirm media preparation, queued export generation, worker route, claim migration, and cron wiring. |
| `npm.cmd run test:performance` | PASS | Existing dashboard query semantics checks still pass. |
| `npm.cmd run typecheck` | PASS | TypeScript passed after preserving actionable provider failure messages for media fallback failures. |
| `npm.cmd run verify` | PASS | Lint, TypeScript, and production build completed successfully. |
| `git diff --check` | PASS | Only warning was Git line-ending normalization for `.env.example`; no whitespace errors. |
| `npm.cmd run preflight:approval-migration` | PASS | No duplicate ledger handoffs found in the authorized non-production target. |
| `npm.cmd run preflight:export-migration` | PASS | No duplicate export generation jobs found in the authorized non-production target. |
| `npm.cmd run test:approval-rpc` | PASS | Synthetic non-production owner/viewer fixture passed approval RPC concurrency checks; exactly one logical handoff and audit row were observed. |
| `npm.cmd run test:rls-access` | PASS | Synthetic two-firm owner/viewer/revoked fixture passed same-firm visibility, cross-firm denial, and unauthorized approval checks. |
| `npm.cmd run test:export-worker` | PASS / LOCAL APP AGAINST NON-PROD DB | Passed against `http://localhost:3001` using synthetic fixture export `9a31057e-7964-4c5e-8d4b-433ebb56d086`. The configured deployed URL returned `404` for `/api/jobs/exports/run-queued`, so deployed-route verification remains blocked until the current code is deployed. |
| `npm.cmd run seed:phase2-staging-fixtures` | PASS / LOCAL APP AGAINST NON-PROD DB | Created synthetic Phase 2 PDF fixtures in the authorized non-production target. Latest PDF diagnostic fixture: document `12141cec-1ef0-437a-8052-0ffbcbc790ae`, run `phase2-2026-09-11T06-54-35-158Z-478d4b1b`. |
| PDF media extraction diagnostic | BLOCKED BY PROVIDER CREDITS / FAIL-CLOSED | With explicit non-production and provider-cost allowlists, PDF media extraction processed the target job but created no extraction record because OpenAI returned `429 You have no credits remaining`. After the message-preservation patch, job `be0b8bb5-fc36-4a45-8058-21499bc7faba` persisted `429 You have no credits remaining...; fallback unavailable because document source text is missing.` This still does not prove media-byte extraction success. |
| `npm.cmd run smoke:local -- --base-url http://localhost:3001` | PASS / LOCAL APP | Public root and health endpoints returned expected statuses; dashboard routes returned unauthenticated redirects (`307`). |
| Health/readiness HTTP smoke | PASS / DEGRADED | `/api/health/live` returned `ok`; `/api/health/ready` returned `degraded` with Supabase/OpenAI/WhatsApp/job-runner configured, plus expected warnings for missing transcription model, in-process-only rate limiting, untrusted forwarded IP headers, and existing failed jobs. |
| Worker route secret smoke | PASS | `/api/jobs/exports/run-queued` and `/api/jobs/ai-extraction/run-queued` returned `401` without `x-job-runner-secret`. |
| Export download unauthenticated smoke | PASS / REDIRECTED | Unauthenticated request to `/api/exports/dc4d9a51-7bd2-4456-9d3d-6481aeb76243/download` returned the login page rather than export bytes. Full authorized browser download remains unverified without a signed-in test session. |
| Vercel preview deployment smoke | PASS / PROTECTED PREVIEW | Created preview `https://khata-pm7ju8lr2-sandeep-s01s-projects.vercel.app` from the current workspace. Browser smoke redirects to Vercel SSO because Deployment Protection is enabled. Authenticated `vercel curl` returned `/api/health/live` `ok`, `/api/health/ready` `degraded`, and `/api/jobs/exports/run-queued?batch_size=1` `401` without runner secret. |
| Public production alias smoke | PARTIAL / OLD DEPLOYMENT | `https://khataone.vercel.app` serves the public app and dashboard redirects, but current-code routes `/api/health/live`, `/api/health/ready`, and `/api/jobs/exports/run-queued` return `404`; production has not yet been promoted to the preview code. |
| `npm.cmd run cleanup:phase2-staging-fixtures` | BLOCKED / FAIL-CLOSED | Refuses unless explicit non-production cleanup allowlist variables and fixture run ID are supplied. |

## Migration Application Status

`PASS / USER-APPLIED`: The user reported that `20260910160000_atomic_transaction_approval.sql` and `20260910170000_export_generation_jobs.sql` were applied successfully to the authorized non-production Supabase target. Local preflights passed after application, and both `approve_transaction_with_handoff` and `claim_export_generation_jobs` were callable with expected guarded behavior.

Local machine limitation: Supabase CLI is not installed, and no direct database connection string (`DATABASE_URL`, `POSTGRES_URL`, `SUPABASE_DB_URL`, `SUPABASE_DATABASE_URL`, `PGHOST`/`PGPASSWORD`) is configured, so SQL application itself was performed outside this shell.

## Staging Harnesses Added For The Next Authorized Run

```text
npm.cmd run preflight:export-migration
npm.cmd run seed:phase2-staging-fixtures
npm.cmd run test:export-worker
npm.cmd run test:media-extraction-worker
npm.cmd run cleanup:phase2-staging-fixtures
```

These scripts fail closed unless their explicit non-production allowlist environment variables are present. They have now produced partial staging evidence for migrations, approval concurrency, RLS, and queued export generation; media-byte extraction remains failed/unproven.

## Blocked Runtime Checks

These remain unverified or failed after the authorized non-production run:

- Deployed export worker route verification: configured deployed URL returned `404` for `/api/jobs/exports/run-queued`; current-code local verification passed only against `http://localhost:3001`.
- Current-code Vercel preview route exists but is protected by Vercel Deployment Protection; production promotion remains pending.
- Verify signed private export download after generation and after membership revocation. Service-role storage signability passed in `test:export-worker`; full signed-in route download and revoked-session checks remain unverified.
- Run image/PDF/scanned-PDF/audio OpenAI extraction using legally safe fixtures and record accuracy, latency, token/cost, and fallback rates. Current PDF media fixture is blocked by OpenAI account credits (`429 no credits remaining`); the app now preserves that provider error instead of reporting only the text-fallback failure.
- Verify AI extraction failed-job retry/recovery. The batch AI extraction claimer in `supabase/migrations/20260811110000_add_ai_extraction_job_worker.sql` only claims `queued` jobs; failed jobs with remaining attempts were not reclaimed by the queued worker route.
- Run combined ingestion/review/export load and backlog recovery tests.
