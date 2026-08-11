# Auto AI Extraction Worker Implementation Plan

## Goal

Automatically process queued AI extraction jobs after WhatsApp messages create documents, so CA users see draft or needs-review transactions in the Review Queue without manually calling `/api/jobs/ai-extraction`.

## Current State

The live pipeline currently reaches this point:

```txt
WhatsApp -> webhook -> whatsapp_messages -> documents -> processing_jobs
```

The existing manual endpoint processes one document:

```txt
POST /api/jobs/ai-extraction
body: { "document_id": "..." }
```

This means inbound WhatsApp messages can be acknowledged and stored, but the Review Queue may stay empty until the AI extraction endpoint is triggered manually.

## Target State

The target production v1 behavior is:

```txt
WhatsApp message received
-> raw message stored
-> client matched
-> document created
-> ai_extraction job queued
-> worker picks queued job
-> AI extraction runs
-> ai_extractions row is stored
-> draft/needs_review transaction is created
-> Review Queue shows the item
```

AI output remains reviewable. The worker must not approve transactions automatically.

## Architecture Decision

Use a protected batch worker route triggered by Vercel Cron for v1.

Do not run OpenAI extraction directly inside the WhatsApp webhook. The webhook should stay fast and reliable for Meta delivery retries. The webhook only stores raw data, creates the document/job, and sends a short acknowledgment.

Recommended worker trigger:

```txt
Vercel Cron -> GET /api/jobs/ai-extraction/run-queued
```

Add an optional manual dashboard action later:

```txt
Operations / Inbox -> Run extraction now
```

Vercel Cron should be configured through `vercel.json` and verified against the current official Vercel docs before implementation.

## Build Order

### 1. Add Job Claiming Safety

Add a migration that makes queued job processing safe when multiple requests happen close together.

Recommended changes:

- Add `locked_at timestamptz`.
- Add `locked_by text`.
- Add `updated_at timestamptz`.
- Add an index for queue pickup:

```txt
job_type, status, scheduled_at, created_at
```

Preferred database function:

```txt
claim_ai_extraction_jobs(batch_size integer, worker_id text)
```

The function should:

- Select queued AI extraction jobs due now.
- Lock rows with `FOR UPDATE SKIP LOCKED`.
- Increment `attempt_count`.
- Set status to `processing`.
- Set `locked_at` and `locked_by`.
- Return claimed job rows.

This prevents duplicate cron calls from processing the same job twice.

### 2. Make Extraction Idempotent

Before creating a new AI extraction and transaction, `processDocumentExtraction(documentId)` should check whether the document already has a completed extraction or reviewable transaction.

Expected behavior:

- If a transaction already exists for the document, do not create another duplicate transaction.
- Mark the job completed or skipped with a clear message.
- Keep duplicate detection as a review flag, not an automatic delete.

This is required because WhatsApp, Vercel, and manual retry flows can all produce repeated requests.

### 3. Add Queued Worker Route

Create a protected route:

```txt
GET /api/jobs/ai-extraction/run-queued
```

The route should:

- Require a secret header.
- Accept Vercel Cron authorization if `CRON_SECRET` is configured.
- Optionally accept `x-job-runner-secret` for manual/internal calls.
- Claim a small batch of queued jobs.
- Call the existing `processDocumentExtraction(entity_id)` for each claimed document.
- Mark each job completed, failed, or skipped.
- Return a summary:

```json
{
  "ok": true,
  "processed": 5,
  "completed": 4,
  "failed": 1,
  "skipped": 0
}
```

Recommended v1 batch size:

```txt
5 jobs per run
```

This keeps Vercel function duration and OpenAI spend controlled.

### 4. Add Retry Rules

Use `attempt_count` to prevent infinite retries.

Recommended defaults:

- Max attempts: `3`.
- Retry only jobs with temporary errors.
- Do not endlessly retry missing configuration errors.
- Set `last_error` with a useful but non-secret message.
- Keep failed jobs visible in Operations.

Suggested status behavior:

```txt
queued -> processing -> completed
queued -> processing -> failed
failed -> queued only when manually retried or retry policy allows it
```

### 5. Add Vercel Cron Configuration

Add a root `vercel.json` entry after the worker route exists:

```json
{
  "crons": [
    {
      "path": "/api/jobs/ai-extraction/run-queued",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Vercel Hobby supports daily cron frequency. Use `0 0 * * *` on Hobby so deployment succeeds. For near-real-time automatic processing, upgrade to a plan that supports per-minute cron or use an external scheduler to call the protected worker route.

Required Vercel environment variable:

```txt
CRON_SECRET
```

Keep `JOB_RUNNER_SECRET` for manual calls if already used.

### 6. Update Admin Visibility

Improve Operations and Inbox enough that the CA can understand what happened.

Operations should show:

- Queued jobs
- Processing jobs
- Completed jobs
- Failed jobs
- Attempt count
- Last error
- Scheduled time
- Linked client
- Linked document id

Inbox should show:

- WhatsApp message status
- Linked document status
- Linked AI job status when available

Review Queue should not need a large redesign for this phase. It should automatically populate once transactions are created.

### 7. Add Manual Fallback

Add a "Run extraction now" action for queued or failed documents/jobs.

Rules:

- Only firm owner/admin/staff can run it.
- It must check firm membership before triggering extraction.
- It should reuse the same worker logic where practical.
- It should not bypass idempotency checks.

This gives a simple recovery path when cron is delayed, disabled, or rate-limited.

### 8. Add Audit And Logs

Use existing audit and operational logging patterns.

Required audit/log events:

- Job claimed
- Extraction completed
- Extraction failed
- Manual retry requested

Do not store secrets in logs.

### 9. Verification Plan

Local verification:

1. Create or confirm a matched client with WhatsApp phone.
2. Insert/send a WhatsApp text invoice.
3. Confirm rows are created in `whatsapp_messages`, `documents`, and `processing_jobs`.
4. Trigger the worker route manually with the configured secret.
5. Confirm `processing_jobs.status = completed`.
6. Confirm one `ai_extractions` row exists for the document.
7. Confirm one `transactions` row exists with `draft` or `needs_review`.
8. Confirm Review Queue displays the transaction.

Duplicate verification:

1. Run the worker route twice quickly.
2. Confirm no duplicate transaction is created for the same document.

Failure verification:

1. Temporarily remove or invalidate OpenAI config in a safe environment.
2. Trigger the worker.
3. Confirm the job becomes `failed`, `last_error` is useful, and Operations shows the failure.

Production verification:

1. Deploy to Vercel production.
2. Confirm `CRON_SECRET`, `JOB_RUNNER_SECRET`, `OPENAI_API_KEY`, and `OPENAI_EXTRACTION_MODEL` are configured.
3. Trigger the cron route manually from Vercel.
4. Send a real WhatsApp test message.
5. Confirm the transaction appears in Review Queue without manually calling the old one-document endpoint.

### 10. Done Criteria

This feature is complete when:

- A WhatsApp text invoice automatically becomes a Review Queue item.
- Webhook response stays fast and does not wait on OpenAI extraction.
- Jobs are claimed safely and not double-processed.
- Attempts and failures are visible.
- Failed jobs can be manually retried.
- AI-created transactions remain `draft` or `needs_review`.
- Tenant isolation is preserved with `firm_id` and `client_id`.
- `npm run verify` passes.
- Live Vercel and Supabase smoke test passes.

## Scope Boundaries

Included in this feature:

- Text-note extraction from WhatsApp messages.
- Queued job worker.
- Safe retry and idempotency behavior.
- Operations/Inbox status visibility.
- Manual run fallback.

Not included in this feature:

- OCR for images/PDFs.
- Audio transcription.
- Direct GST filing.
- Bank statement reconciliation.
- Tally/Zoho/QuickBooks sync.
- Automatic approval of transactions.

## Recommended Next Feature After This

After automatic AI job processing works, the next best feature is Review Queue polish:

- Side-by-side source WhatsApp text and extracted fields.
- Clear status timeline.
- Better failed/queued document recovery.
- Faster approval/edit workflow for CA staff.
