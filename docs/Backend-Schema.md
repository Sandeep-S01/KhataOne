# KhataOne Backend Schema

## Schema Principles

- Every business record belongs to a firm.
- Most client-facing records also belong to a client.
- Raw inbound data should be retained for traceability.
- AI outputs should be versioned and auditable.
- Approved accounting data should never silently overwrite source extraction data.
- Row Level Security must enforce firm isolation.

## Core Tables

### firms

- `id`
- `name`
- `slug`
- `owner_user_id`
- `gstin`
- `phone`
- `email`
- `address`
- `status`
- `created_at`
- `updated_at`

### firm_users

- `id`
- `firm_id`
- `user_id`
- `role`
- `status`
- `invited_by`
- `created_at`
- `updated_at`

Roles:

- `owner`
- `admin`
- `staff`
- `viewer`

### clients

- `id`
- `firm_id`
- `business_name`
- `contact_name`
- `phone`
- `whatsapp_phone`
- `email`
- `gstin`
- `state_code`
- `filing_frequency`
- `assigned_user_id`
- `status`
- `created_at`
- `updated_at`

Statuses:

- `onboarding`
- `active`
- `pending_documents`
- `review_needed`
- `filing_ready`
- `archived`

### whatsapp_messages

- `id`
- `firm_id` nullable until sender is matched to a client
- `client_id` nullable until sender is matched to a client
- `provider_message_id`
- `sender_phone`
- `message_type`
- `raw_payload`
- `received_at`
- `processing_status`
- `created_at`

Processing statuses:

- `received`
- `matched`
- `unmatched`
- `media_downloaded`
- `media_failed`
- `queued`
- `ignored`
- `failed`

### documents

- `id`
- `firm_id`
- `client_id`
- `whatsapp_message_id`
- `document_type`
- `file_name`
- `file_mime_type`
- `storage_path`
- `source_text`
- `status`
- `received_at`
- `created_at`
- `updated_at`

Document types:

- `purchase_invoice`
- `sales_invoice`
- `receipt`
- `bank_statement`
- `payment_proof`
- `audio_note`
- `text_note`
- `unclear`

### ai_extractions

- `id`
- `firm_id`
- `client_id`
- `document_id`
- `model`
- `prompt_version`
- `schema_version`
- `raw_output`
- `normalized_output`
- `confidence_score`
- `risk_flags`
- `status`
- `created_at`

Extraction statuses:

- `extracted`
- `needs_review`
- `failed`

Phase 6 note: extraction is structured and schema-validated. OpenAI-backed extraction prepares bounded inputs from private `whatsapp-media-raw` storage for supported image and PDF media, and can transcribe supported audio when `OPENAI_TRANSCRIPTION_MODEL` is configured. Media is validated before download, streamed through the applicable byte cap, and subject to a bounded storage timeout; provider requests also have bounded timeout and retry settings. Failed or unsupported media remains reviewable through failed extraction records and risk flags instead of silently becoming approved accounting data.

Fallback note: `ai_extractions.model = rule_based_text_v1` identifies no-cost deterministic text parsing. These rows should carry risk flags such as `RULE_BASED_EXTRACTION` and remain reviewable before approval.

Legacy compatibility note: older imported databases may still have required legacy `transactions` columns such as `date`, `amount`, or stricter `category` constraints. KhataOne uses `transaction_date` and `total_amount` as canonical fields and allows draft accounting fields to be null until CA review confirms uncertain extractions. The normalization migration relaxes non-core transaction fields so fallback extraction can create reviewable rows instead of failing one legacy constraint at a time.

### transactions

- `id`
- `firm_id`
- `client_id`
- `document_id`
- `ai_extraction_id`
- `transaction_type`
- `status`
- `transaction_date`
- `party_name`
- `party_gstin`
- `invoice_number`
- `description`
- `category`
- `place_of_supply`
- `taxable_amount`
- `cgst_amount`
- `sgst_amount`
- `igst_amount`
- `cess_amount`
- `total_amount`
- `payment_mode`
- `confidence_score`
- `approved_by`
- `approved_at`
- `created_at`
- `updated_at`

Transaction statuses:

- `draft`
- `needs_review`
- `approved`
- `rejected`
- `duplicate`
- `exported`

### ledger_entries

- `id`
- `firm_id`
- `client_id`
- `transaction_id`
- `entry_date`
- `account_name`
- `debit_amount`
- `credit_amount`
- `narration`
- `created_at`
- `updated_at`

Phase 7 note: approving a transaction creates a ledger handoff entry if one does not already exist for the transaction. The current handoff is intentionally simple and traceable; formal accounting export mapping is handled in later ledger/export phases.

Production hardening note: `ledger_entries.transaction_id` is unique in the hardened handoff model. The `approve_transaction_with_handoff` database function revalidates active firm role membership and performs transaction approval, single handoff upsert, and approval audit logging inside one PostgreSQL transaction boundary.

Phase 8 note: ledger entries can be filtered and corrected. Corrections update the ledger handoff record only and create `audit_logs` entries with `entity_type = ledger_entry`; source transactions and AI extraction records remain intact.

### gst_periods

- `id`
- `firm_id`
- `client_id`
- `period_start`
- `period_end`
- `filing_type`
- `status`
- `created_at`
- `updated_at`

Statuses:

- `open`
- `missing_documents`
- `needs_review`
- `ready`
- `exported`
- `filed_future`

### gst_summaries

- `id`
- `firm_id`
- `client_id`
- `gst_period_id`
- `sales_taxable_amount`
- `purchase_taxable_amount`
- `output_cgst`
- `output_sgst`
- `output_igst`
- `input_cgst`
- `input_sgst`
- `input_igst`
- `net_tax_payable`
- `mismatch_count`
- `missing_document_count`
- `generated_at`
- `created_at`

Phase 9 note: GST summaries aggregate approved transactions only. Draft, needs-review, duplicate, missing-document, and mismatched tax/GSTIN conditions affect readiness status. This is review/export preparation and does not submit GST filings.

Prepared atomic GST migration (not applied): `generate_gst_summary(uuid,uuid,date,date,text)`
revalidates role/client ownership, aggregates approved amounts and unresolved counts
in PostgreSQL, and upserts the period/summary with an audit record atomically.
Regeneration includes previous summary data in the audit. Browser writes to periods
and summaries are restricted to this definer boundary; service-role administration
is not replaced. Existing accounting classification/readiness semantics are retained.
Migration and action require coordinated rollout; see docs/security-hardening-plan.md.

### exports

- `id`
- `firm_id`
- `client_id`
- `gst_period_id`
- `export_type`
- `status`
- `storage_path`
- `requested_by`
- `completed_at`
- `metadata`
- `created_at`
- `updated_at`

Export types:

- `csv_transactions`
- `pdf_summary`
- `tally_ready`
- `gst_summary`

Phase 10 note: production v1 supports approved transaction CSV exports, GST summary CSV exports, and GST summary PDF exports. Export requests create queued records and `processing_jobs.job_type = export_generation`; the protected worker creates the private `exports` storage artifact and records `export.generated` audit logs. Download remains authenticated after firm membership is verified. Tally-ready export remains a reserved future export type.

Export hardening note: worker-generated transaction exports use the export request creation time as an approval snapshot boundary (`approved_at <= export.created_at`), enforce `EXPORT_MAX_TRANSACTION_ROWS` and `EXPORT_MAX_FILE_BYTES`, and store generated row/file metadata on the export record.

Prepared security migration `20260912100000_protect_worker_inputs.sql` (not applied):
restrictive policies require staff export requests to reference owned clients/periods,
use the authenticated requester and current transaction timestamp, and start queued
without artifact fields. A browser-update trigger permits only queued-to-failed enqueue
compensation with status/metadata changes; request identity and generated artifacts are
worker-managed. Browser document mutations and job state/history mutations are denied.
Job inserts require a matching firm/client document or queued export and pristine queue
state. Existing service-role workers retain writes; no rows are rewritten or deleted.
The export action discards the inactive selector because both selectors stay mounted.
Live policies, grants and historical ownership must be checked before applying.

### audit_logs

- `id`
- `firm_id`
- `client_id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `before_data`
- `after_data`
- `metadata`
- `created_at`

### processing_jobs

- `id`
- `firm_id`
- `client_id`
- `job_type`
- `entity_type`
- `entity_id`
- `status`
- `attempt_count`
- `last_error`
- `scheduled_at`
- `completed_at`
- `created_at`
- `locked_at`
- `locked_by`
- `updated_at`

Phase 11 note: processing jobs are visible from the Operations dashboard for queue health, failed AI extraction work, and future background workflows. Sensitive API routes retain an in-process first guard. Migration `20260912190000_add_shared_rate_limits.sql` adds service-role-only, HMAC-SHA-256-keyed fixed-window counters for cross-instance enforcement when `RATE_LIMIT_SHARED_ENFORCEMENT=shared-store`; browser roles cannot inspect or consume buckets. Expired buckets are pruned in bounded batches during consumption.

Post-phase worker note: AI extraction and export generation jobs are claimed through database functions before processing. Claiming sets `status = processing`, increments `attempt_count`, and stores `locked_at`/`locked_by` so cron/manual runs do not process the same queued document or export twice. The extraction processor remains idempotent and skips documents that already have a transaction.

Operations note: authorized owner/admin/staff users can manually run retryable queued or failed AI extraction and export generation jobs from the Operations dashboard. Manual runs still claim jobs through service-role-only database functions before processing.

Operations health note: the Operations dashboard groups queue health by `job_type`, shows active/failed/completed counts, and flags active jobs older than `OPERATIONS_ACTIVE_JOB_WARNING_MINUTES`. Readiness health also reports aggregate processing-job status and degrades when active-job age or failed-job count crosses `OPERATIONS_ACTIVE_JOB_WARNING_MINUTES` / `OPERATIONS_FAILED_JOB_WARNING_COUNT`.

## Operations And Security Notes

- Audit logs are available in the dashboard with action and entity filters.
- Operations view exposes processing job status, attempts, errors, and client links.
- Settings view exposes firm profile, workspace members, and integration readiness.
- WhatsApp webhook POST, worker routes, AI extraction job POST, and landing lead requests include configurable local rate limiting and optional atomic shared-store enforcement. A selected but unavailable shared store fails closed. Readiness verifies store reachability rather than trusting configuration alone. Forwarded IP headers are used for rate-limit keys only when `TRUST_FORWARDED_IP_HEADERS=true` is explicitly configured behind a trusted proxy.
- `captureOperationalError` writes structured server logs; production should forward these logs to Sentry or another monitoring system before launch.
- `/api/health/live` exposes only cheap app liveness. `/api/health/ready` and compatibility `/api/health` expose deeper operational checks only after readiness bearer authentication in production and return private, no-store responses.

## Future Integration Tables

### gst_integrations

- `id`
- `firm_id`
- `provider`
- `status`
- `credentials_reference`
- `metadata`
- `created_at`
- `updated_at`

### gst_integration_logs

- `id`
- `firm_id`
- `client_id`
- `gst_period_id`
- `provider`
- `operation`
- `request_reference`
- `response_summary`
- `status`
- `created_at`

Phase 13 note: future GST integration tables now exist behind RLS and support provider status/log tracking. Direct GST filing remains blocked until a provider is implemented, verified, and compliance-approved.

### external_integrations

- `id`
- `firm_id`
- `integration_type`
- `provider`
- `status`
- `credentials_reference`
- `metadata`
- `created_at`
- `updated_at`

Integration types:

- `tally`
- `zoho_books`
- `quickbooks`
- `banking`
- `billing`
- `analytics`

### integration_events

- `id`
- `firm_id`
- `client_id`
- `integration_id`
- `event_type`
- `entity_type`
- `entity_id`
- `status`
- `request_reference`
- `response_summary`
- `created_at`

Phase 13 note: external integrations are roadmap scaffolding only. They create a tenant-safe audit/event boundary for future accounting sync, bank reconciliation, billing, and analytics; they do not perform syncs yet.

## Storage Buckets

- `client-documents`
- `generated-reports`
- `exports`
- `whatsapp-media-raw` private bucket for original WhatsApp media downloads

## RLS Requirements

- Users can only access rows for firms where they have an active `firm_users` membership.
- Staff permissions should be restricted by role.
- Storage access should require firm ownership validation.
- Public landing page must not expose private Supabase data.

## Indexes

- `firm_id` on every firm-owned table.
- `client_id` on client-owned workflow tables.
- `received_at` on WhatsApp messages and documents.
- `transaction_date` on transactions.
- `status` on documents, transactions, exports, and jobs.
- `gst_period_id` on summaries and exports.
- `provider_message_id` unique index on WhatsApp messages.

Performance note: dashboard list screens also maintain composite indexes for
common tenant-scoped query shapes such as `(firm_id, status, created_at desc)`,
`(firm_id, processing_status, received_at desc)`, `(firm_id, entry_date desc,
created_at desc)`, and related client/status/date combinations. These indexes
support faster protected navigation without weakening RLS.

Performance implementation note: dashboard pagination uses unique `id desc`
tie-break ordering on hot list pages. Prepared search indexes use `pg_trgm` for
client, WhatsApp message, document, and review transaction search fields, plus a
GIN index for AI extraction risk flags. Runtime code must not depend on these
indexes being present until the production Supabase migration state is verified.

Ledger integrity note (prepared locally, not applied): migration
`20260912120000_atomic_ledger_correction.sql` adds `correct_ledger_entry` with active
reviewer membership, source ownership and amount validation. Corrections lock the
handoff row and write before/after audit atomically without changing source records.
Restrictive browser INSERT/UPDATE/DELETE policies require authorized functions for
ledger writes; read policies remain unchanged. Coordinate the action and migration
release. Repeated-approval overwrite and transaction lifecycle reconciliation remain
open, as do general audit-log permission restrictions.

Approval idempotency note (prepared locally, not applied): migration
`20260912130000_preserve_ledger_corrections_on_reapproval.sql` keeps the existing
approval RPC signature but never rewrites an existing handoff for an already-approved
transaction. A missing handoff may be repaired once and is recorded with a distinct
audit action. This does not define void/reversal behavior for later source edits or
rejection, which remains a separate lifecycle change.

Posted lifecycle note (prepared locally, not applied): migration
`20260912140000_protect_posted_transaction_lifecycle.sql` adds an invoker trigger
that prevents authenticated/anonymous browser roles from updating or deleting
`approved` and `exported` transactions. Controlled SECURITY DEFINER and service-role
workflows remain responsible for their own authorization and audit guarantees. This
is an immutability boundary only; no void or reversal schema has been invented.

Transaction review integrity note (prepared locally, not applied): migration
`20260912150000_atomic_transaction_review_mutations.sql` adds tenant-scoped,
role-authorized functions for review field edits and reject/duplicate decisions.
Each function locks the source row and writes its before/after audit in the same
transaction; repeated identical decisions are idempotent. Clarification delivery and
remaining direct browser/audit write restrictions are intentionally not claimed by
this migration.

Clarification/write-boundary note (prepared locally, not applied): migration
`20260912160000_control_transaction_clarification_and_writes.sql` records a request
before external WhatsApp delivery and links a second success/failure audit event.
Restrictive transaction INSERT/UPDATE/DELETE policies then deny browser writes while
retaining SECURITY DEFINER review functions and service-role AI processing. External
delivery cannot be transactionally atomic with PostgreSQL; an operational error is
captured if delivery succeeds but its follow-up audit cannot be recorded.

Dashboard audit-writer note (prepared locally, not applied): migration
`20260912170000_control_dashboard_audit_writers.sql` moves client creation/update/
archive, export plus generation-job enqueue, and manual job requests into authorized
functions that derive audit data from owned rows. Restrictive policies deny browser
writes to clients, exports, jobs and audit logs while service-role workers retain
access. This migration and its matching actions require a coordinated release after
the read-only preflight and hosted staging verification.

AI job recovery note (prepared locally, not applied): migration
`20260912180000_recover_ai_extraction_jobs.sql` keeps existing claim signatures while
adding ten-minute abandoned-lease recovery, three-attempt
exhaustion, and terminal failure for stale exhausted processing rows. Claims remain
bounded and use `for update skip locked`; failed rows remain manual until retry
classification and backoff are implemented.
