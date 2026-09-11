# Findings

## KO-LAUNCH-001 - P1 - Media Extraction Gap

Requirement/source: BRD production v1 requires common invoice, receipt, text, image, PDF and audio inputs; TRD calls for OCR and audio transcription. Evidence: `src/lib/ai/extraction-providers.ts:54` uses `source_text` when present, and otherwise sends only metadata plus an `OCR_REQUIRED` instruction. `src/lib/ai/extraction-providers.ts:285` makes the rule-based path fail when `source_text` is absent. No OCR, PDF text extraction, scanned PDF processing, or audio transcription implementation was found in the inspected AI path.

Observed versus expected: Text-note extraction has a real path; media-only image/PDF/audio inputs are stored and can be routed, but the audited code does not prove bytes are converted into accounting text before extraction. This breaks the end-to-end USP for the promised media types.

Implementation: `PARTIAL`. Verification: `FAIL` by code inspection for OCR/transcription implementation; runtime media extraction was `BLOCKED` by lack of authorized staging fixtures. Minimal fix: add bounded OCR/PDF/audio text preparation before OpenAI extraction, persist extracted text/provenance, and add labeled fixtures covering clear/poor images, digital PDFs, scanned PDFs and audio. Regression test: a fixture set where media bytes produce expected draft fields and unsupported media stays visible as recoverable review work.

## KO-LAUNCH-002 - P1 - Approval/Handoff Atomicity Gap

Requirement/source: CRD requires approval creates or reuses one ledger handoff and audit log. Evidence: `src/app/actions/review.ts:344` updates the transaction to `approved`; `src/app/actions/review.ts:371` then creates/reuses the ledger handoff; `src/app/actions/review.ts:390` rolls back the transaction on failure. `src/app/actions/review.ts:169` checks for an existing ledger row before insert, but migrations only show a non-unique `ledger_entries_transaction_id_idx`, not a unique constraint.

Observed versus expected: The code attempts recovery, but the transaction approval, ledger insert and audit log are not one database transaction. Concurrent approvals can race between the pre-insert lookup and insert. A failure after approval but before audit/ledger needs stronger consistency guarantees.

Implementation: `PARTIAL`. Verification: `NOT_TESTED`; no concurrent approval or fault-injection test was run. Minimal fix: move approval, one-handoff creation, and audit logging into a single database RPC/transaction with a unique constraint on `ledger_entries.transaction_id`. Regression test: double-submit and two-reviewer approval produce one ledger handoff and one logical audit outcome.

## KO-LAUNCH-003 - P1 - Worker Cadence And Recovery Not Proven

Requirement/source: PRD/TRD require reliable webhook handling, retries and scalable background processing. Evidence: `vercel.json:1` configures daily cron for AI and WhatsApp ingestion workers. Job claim functions exist in migrations with `for update skip locked`, but no local/staging crash recovery, poison-job, stale lease, or backlog recovery run was executed.

Observed versus expected: Daily Vercel cron cannot by itself support the proposed p95 <=60s document-to-reviewable-draft target. Tracker notes mention an external scheduler history, but this audit did not verify deployed scheduler activation or recovery behavior.

Implementation: `PARTIAL`. Verification: `BLOCKED`. Minimal fix: verify the actual deployed scheduler, set a documented non-production test target, and run crash/retry tests at each stage. Regression test: accepted webhook events survive worker crashes and drain within the agreed latency budget.

## KO-LAUNCH-004 - P1 - Tenant Isolation Runtime Gap

Requirement/source: security rules require Supabase RLS and service-role paths to preserve firm isolation. Evidence: migrations enable RLS and policies on core tables; dashboard/server actions consistently filter by `firm_id` in inspected paths. However workers and exports use `createAdminClient`, including export storage operations at `src/app/actions/exports.ts:416` and downloads at `src/app/api/exports/[exportId]/download/route.ts:29`.

Observed versus expected: The implementation has good tenant-filtering patterns, but no restricted-principal two-firm test was executed. Service-role paths bypass RLS by design, so code review alone cannot grant a launch pass.

Implementation: `PARTIAL`. Verification: `BLOCKED`. Minimal fix: run the existing RLS verification plan with two firms, owner/admin/staff/viewer/revoked users, cross-tenant IDs, signed export/document access and service-role worker cases. Regression test: every cross-tenant read/write/download attempt fails.

## KO-LAUNCH-005 - P1 - Target Capacity Unverified

Requirement/source: audit prompt asks whether the tested configuration sustains 10,000 and 20,000 DAU. Evidence: only local build/smoke/static checks ran. No authorized staging/prod load target, quotas, database plan, provider limits, app instance count, worker topology, or representative dataset were available.

Observed versus expected: The code includes dashboard pagination/index work and background job foundations, but this pass cannot certify 10k or 20k DAU capacity. Capacity verdict remains insufficient evidence.

Implementation: `PARTIAL`. Verification: `BLOCKED`. Minimal fix: provision an allowlisted staging target with production-like Supabase plan, storage, worker cadence and synthetic multi-tenant data; run open-arrival webhook tests plus authenticated dashboard session tests and reconcile business state.

## KO-LAUNCH-006 - P2 - CSV Formula Injection

Requirement/source: export safety in the audit prompt and TRD. Evidence: `src/app/actions/exports.ts:94` quotes CSV cells and escapes quotes, but does not neutralize values beginning with `=`, `+`, `-`, `@`, tab or carriage return.

Observed versus expected: A malicious invoice number or party name could become an executable spreadsheet formula when opened by a CA in Excel/Sheets.

Implementation: `PARTIAL`. Verification: `NOT_TESTED`. Minimal fix: prefix dangerous spreadsheet-leading characters with a single quote or tab-safe neutralization and add export fixture tests.

## KO-LAUNCH-007 - P2 - Non-Distributed Rate Limit

Requirement/source: production-grade abuse control and 10k/20k workload planning. Evidence: `src/lib/rate-limit.ts:12` stores limits in an in-process `Map`; webhook route limit is `240` per minute at `src/app/api/webhooks/whatsapp/route.ts:47`.

Observed versus expected: The limiter does not coordinate across instances and resets on process restart. If Meta traffic is concentrated behind a small number of observed IP keys, `240/min` equals 4 rps, below the illustrative 20k-DAU peak document-bearing rate of 10 rps before callbacks/retries.

Implementation: `PARTIAL`. Verification: `NOT_TESTED`. Minimal fix: move launch-critical rate limits to platform/edge or durable shared storage and size limits against real Meta callback behavior.

## KO-LAUNCH-008 - P2 - Synchronous Export Generation

Requirement/source: TRD says large exports and PDF generation should run as jobs. Evidence: `src/app/actions/exports.ts:436` creates an export record, then immediately generates CSV/PDF and uploads. `src/app/actions/exports.ts:122` buffers PDF chunks in memory.

Observed versus expected: Small exports may work, but large period exports can tie up request execution, memory and user feedback. No large-export benchmark ran.

Implementation: `PARTIAL`. Verification: `NOT_TESTED`. Minimal fix: queue large exports, acknowledge the request quickly, process with bounded worker memory, and expose completion/failure status.
