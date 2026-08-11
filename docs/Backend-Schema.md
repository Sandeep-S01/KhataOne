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

Phase 6 note: extraction is structured and schema-validated. If a document has no `source_text` yet, the extraction processor must not invent values from unread media; it should use null fields and risk flags such as `OCR_REQUIRED` until OCR/audio/PDF text extraction is implemented.

Fallback note: `ai_extractions.model = rule_based_text_v1` identifies no-cost deterministic text parsing. These rows should carry risk flags such as `RULE_BASED_EXTRACTION` and remain reviewable before approval.

Legacy compatibility note: older imported databases may still have a `transactions.date` column. KhataOne uses `transaction_date` as the canonical field and allows it to be null until CA review confirms uncertain extractions.

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

Phase 10 note: production v1 supports approved transaction CSV exports, GST summary CSV exports, and GST summary PDF exports. Export files are stored in the private `exports` storage bucket and downloaded through an authenticated route after firm membership is verified. Tally-ready export remains a reserved future export type.

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

Phase 11 note: processing jobs are visible from the Operations dashboard for queue health, failed AI extraction work, and future background workflows. Sensitive API routes use lightweight in-process rate limiting as a first guard; production deployments should pair this with platform or edge rate limiting.

Post-phase worker note: AI extraction jobs are claimed through database functions before processing. Claiming sets `status = processing`, increments `attempt_count`, and stores `locked_at`/`locked_by` so cron/manual runs do not process the same queued document twice. The extraction processor remains idempotent and skips documents that already have a transaction.

## Operations And Security Notes

- Audit logs are available in the dashboard with action and entity filters.
- Operations view exposes processing job status, attempts, errors, and client links.
- Settings view exposes firm profile, workspace members, and integration readiness.
- WhatsApp webhook POST, AI extraction job POST, and landing lead requests include basic rate limiting.
- `captureOperationalError` writes structured server logs; production should forward these logs to Sentry or another monitoring system before launch.
- `/api/health` exposes liveness/readiness checks for app, Supabase, OpenAI, and WhatsApp configuration.

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
