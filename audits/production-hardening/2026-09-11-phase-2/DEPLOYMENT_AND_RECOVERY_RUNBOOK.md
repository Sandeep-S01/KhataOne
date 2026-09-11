# Production Hardening Phase 2 Deployment And Recovery Runbook

Date: 2026-09-11

## Preconditions

- Use only an explicitly labeled non-production Supabase project for first verification.
- Confirm backups or disposable test data before applying migrations.
- Configure `SUPABASE_SERVICE_ROLE_KEY`, `JOB_RUNNER_SECRET` or `CRON_SECRET`, `OPENAI_API_KEY`, `OPENAI_EXTRACTION_MODEL`, and, for audio, `OPENAI_TRANSCRIPTION_MODEL`.
- Confirm the private `exports` and `whatsapp-media-raw` buckets exist.

## Migration Order

1. Apply earlier pending migrations required by the target environment.
2. Run `KHATAONE_EXPORT_MIGRATION_ALLOW_NON_PROD=true KHATAONE_EXPORT_MIGRATION_TARGET_LABEL=non-production npm.cmd run preflight:export-migration`.
3. Apply `supabase/migrations/20260910170000_export_generation_jobs.sql`.
4. Verify `claim_export_generation_jobs` executes only with service-role privileges.

## Smoke Checks

1. Create an export from `/dashboard/exports`.
2. Confirm the export row has `status = queued`.
3. Confirm one `processing_jobs` row exists with `job_type = export_generation`.
4. Call `/api/jobs/exports/run-queued?batch_size=1` with `JOB_RUNNER_SECRET`.
5. Confirm export status becomes `completed`, private storage path is populated, and an `export.generated` audit log exists.
6. Download the export through `/api/exports/[exportId]/download` as an authorized firm member.
7. Repeat as a revoked or cross-firm user and confirm denial.

To seed a small synthetic staging fixture instead of preparing records manually:

```text
KHATAONE_PHASE2_FIXTURE_ALLOW_NON_PROD=true
KHATAONE_PHASE2_FIXTURE_TARGET_LABEL=non-production
KHATAONE_PHASE2_FIXTURE_FIRM_ID=<firm-id>
KHATAONE_PHASE2_FIXTURE_CLIENT_ID=<client-id>
KHATAONE_PHASE2_FIXTURE_REQUESTED_BY_USER_ID=<owner-admin-or-staff-user-id>
KHATAONE_PHASE2_FIXTURE_MEDIA_FILE=<local-safe-image-pdf-or-audio-file>
KHATAONE_PHASE2_FIXTURE_MEDIA_MIME_TYPE=<mime-type>
npm.cmd run seed:phase2-staging-fixtures
```

The script prints `KHATAONE_EXPORT_WORKER_EXPORT_ID` and `KHATAONE_MEDIA_EXTRACTION_DOCUMENT_ID` for the smoke scripts below. Use only legally safe, synthetic media fixtures.

The scripted worker smoke entry point is:

```text
KHATAONE_EXPORT_WORKER_ALLOW_NON_PROD=true
KHATAONE_EXPORT_WORKER_TARGET_LABEL=non-production
KHATAONE_EXPORT_WORKER_BASE_URL=<staging-url>
KHATAONE_EXPORT_WORKER_EXPORT_ID=<queued-export-id>
JOB_RUNNER_SECRET=<staging-job-secret>
npm.cmd run test:export-worker
```

The scripted media extraction smoke entry point is:

```text
KHATAONE_MEDIA_EXTRACTION_ALLOW_NON_PROD=true
KHATAONE_MEDIA_EXTRACTION_TARGET_LABEL=non-production
KHATAONE_MEDIA_EXTRACTION_ALLOW_PROVIDER_COST=true
KHATAONE_MEDIA_EXTRACTION_BASE_URL=<staging-url>
KHATAONE_MEDIA_EXTRACTION_DOCUMENT_ID=<queued-media-document-id>
JOB_RUNNER_SECRET=<staging-job-secret>
npm.cmd run test:media-extraction-worker
```

After the staging smoke run, clean up only records from the printed fixture run:

```text
KHATAONE_PHASE2_CLEANUP_ALLOW_NON_PROD=true
KHATAONE_PHASE2_CLEANUP_TARGET_LABEL=non-production
KHATAONE_PHASE2_CLEANUP_FIRM_ID=<firm-id>
KHATAONE_PHASE2_CLEANUP_RUN_ID=<printed-run-id>
npm.cmd run cleanup:phase2-staging-fixtures
```

## Recovery Notes

- Failed export jobs are marked `failed` with `last_error`; exports are marked `failed` with error metadata.
- Stale processing jobs can be reclaimed by the claim function after the configured stale interval.
- Do not manually edit completed export files in storage; regenerate by creating a new export request or, in staging only, by queuing a fresh attributed processing job.
