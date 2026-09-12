# KhataOne Technical Requirements Document

## Target Architecture

KhataOne uses Next.js for the landing page, CA dashboard, API routes, and server actions. Supabase provides authentication, Postgres database, row-level security, file storage, and realtime-ready foundations. WhatsApp Cloud API receives client documents and sends workflow messages. OpenAI powers extraction, classification, summarization, and assistant-style workflows.

## Recommended Stack

- Frontend: Next.js App Router, React, TypeScript.
- Styling: Tailwind CSS with a custom design token layer.
- UI components: shadcn/ui or a small internal component system using Radix primitives.
- Icons: lucide-react.
- Backend: Next.js route handlers and server actions for product APIs.
- Database: Supabase Postgres.
- Auth: Supabase Auth.
- Storage: Supabase Storage for documents, media, generated reports, and export files.
- AI: OpenAI Responses API or structured-output extraction flows.
- Messaging: Meta WhatsApp Cloud API.
- Jobs: Supabase Edge Functions, background worker, or managed queue for AI extraction and report generation.
- Payments: Stripe in future production billing phase.
- Deployment: Vercel for Next.js, Supabase hosted project, optional worker host if needed.
- Observability: Sentry, structured logs, Supabase logs, uptime checks.

## Major System Modules

### Public Website

- Marketing landing page.
- Pricing/demo/signup CTA.
- Product workflow explanation.
- Security and trust sections.

### CA Console

- Firm dashboard.
- Client management.
- Document inbox.
- Review queue.
- Ledger.
- GST summaries.
- Reports and exports.
- Settings, users, audit logs, billing.

### WhatsApp Ingestion

- Webhook verification endpoint.
- Message event processor.
- Media download service.
- Document normalization.
- Client matching by phone number and firm mapping.
- Acknowledgment and clarification message sender.

### AI Processing

- Document type detection.
- OCR and text extraction.
- Audio transcription.
- Structured accounting extraction.
- Confidence scoring.
- Duplicate and anomaly detection.
- Classification into ledger categories.
- Review-needed routing.

### Accounting Core

- Transaction lifecycle: received, extracted, needs_review, approved, rejected, exported.
- Ledger tables.
- GST summary generator.
- Reconciliation hooks.
- Export generator.

### Admin And Operations

- Audit logs.
- Processing logs.
- Error handling.
- Webhook retry visibility.
- Usage tracking.

## API Requirements

### Internal Product APIs

- `POST /api/auth/*` through Supabase Auth integration.
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/documents`
- `GET /api/review-queue`
- `PATCH /api/transactions/:id`
- `POST /api/transactions/:id/approve`
- `POST /api/transactions/:id/reject`
- `GET /api/gst-summary`
- `POST /api/exports`
- `GET /api/audit-logs`

### WhatsApp APIs

- `GET /api/webhooks/whatsapp` for Meta verification.
- `POST /api/webhooks/whatsapp` for inbound events.
- Media download through WhatsApp Graph API.
- Outbound message send through WhatsApp Graph API.

### AI APIs

- Structured extraction endpoint wrapping OpenAI.
- Prompt/version management.
- JSON schema validation for AI output.
- Retry and fallback behavior.

### Future GST APIs

- Dedicated `integrations/gst` module.
- Interface should separate internal GST summary generation from external filing/submission.
- Store external request/response logs where allowed.
- Support provider abstraction for GST Suvidha Provider or approved API partner.

## Security Requirements

Audit remediation (2026-09-12, local only): privileged export downloads validate
the firm/export storage prefix and a safe generated filename before admin storage
access. Worker processors validate job firm/client ownership before processing;
direct extraction POST requires an explicitly configured operator secret. Outbound
clarification requires owner/admin/staff. These guards supplement rather than
replace RLS and database integrity constraints; deployed-policy verification and
database write restrictions remain pending. See `docs/security-hardening-plan.md`.


Protection decision (2026-09-12, local only): retain in-process endpoint counters as
an early guard and add Supabase-backed atomic fixed-window enforcement for distributed
Vercel instances. Store only HMAC-SHA-256 key identifiers generated with a dedicated
32-character-or-longer secret; deny browser access and bound counter cleanup. A selected
but unavailable shared store fails closed. Keep cheap `/api/health/live` public, while
production deep readiness requires a separate strong bearer secret, returns no-store
responses, and verifies shared-store reachability. Migration and environment activation
must be staged together; external platform/edge declarations require independent proof.

- Supabase Row Level Security for firm-scoped data.
- Firm isolation on every query.
- Secure webhook signature validation.
- No public access to private documents.
- Signed URLs for document previews.
- Audit logs for sensitive actions.
- Environment variables for all secrets.
- PII and financial data minimization where possible.
- Role-based permissions.
- CSRF protection for sensitive browser actions where applicable.
- Rate limiting for auth, webhooks, and AI-heavy endpoints.

## Data Processing Requirements

- Raw inbound events must be stored for traceability.
- Media files must be stored with firm/client ownership metadata.
- AI extraction output must preserve model, prompt version, confidence, and raw result.
- Approved transactions must preserve approval actor and timestamp.
- Edited transactions must preserve before/after changes in audit logs.
- Export jobs must be repeatable and traceable.

## Performance Requirements

- Dashboard should load firm summary within 2 seconds for normal firm sizes.
- Transaction tables must support pagination, sorting, and filters.
- AI extraction should run asynchronously.
- Webhook response should be fast and defer long processing.
- Exports and PDF generation should run as jobs for large datasets.

## Deployment Requirements

Dashboard latency decision (2026-09-12): deploy Vercel functions in `hnd1` near the confirmed Supabase primary in Tokyo (`ap-northeast-1`). The controlled preview reduced review-queue median click-to-rows from 1905 ms to 913 ms; p95 remains above target, so this does not establish complete performance readiness. Keep selective prefetch suppression disabled by default. `vercel.json` preserves existing cron jobs. Region-only commit `c62e3ef` was built and promoted as deployment `dpl_CUpLfdbKjMnDntcXEuShjQQdsVtH`; public-domain authenticated Clients, Ledger and Review Queue smoke verified populated rows and hnd1 responses. Original Edge middleware remains unchanged. The release commit is now integrated into main and pushed to GitHub. The subsequent Git-triggered deployment `dpl_jkyuKGWc8XiDEyELvAcdefJzsMF9` is READY and serves khataone.vercel.app; its API metadata confirms the exact commit and hnd1. Other diagnostic/recovery changes are not included. See `docs/performance/dashboard-latency-results.md` for deployment evidence, limitations and rollback.

Auth resilience (2026-09-12): middleware retains fresh Supabase `getUser` verification with a five-second application deadline and abortable auth transport. Invalid/missing sessions retain login redirects; transient failures, unknown exceptions and deadline expiry fail closed with a private, non-cacheable 503 and Retry-After, never authenticated fallback. Preserve cookies written before completion and ignore late writes. The deadline is best effort under runtime scheduling delays and does not bound server-render auth or membership queries. Numeric HTTP-header timing distinguishes transport from the outer SDK operation without logging URLs, tokens or bodies. This is a preview-validated resilience change, not evidence that latency targets are met.

Server workspace recovery (2026-09-12): `getFirmContext` preserves fresh server auth and active membership lookup with request-scoped React memoization. Invalid/missing sessions still redirect to login; a successful lookup with no active membership still redirects to onboarding. Resolved auth-service or membership-query failures now throw generic errors instead of being mistaken for missing access. A route-group error boundary above the dashboard layout offers explicit Next 16.3 `retry()` recovery without displaying upstream messages or automatically replaying mutations. This does not introduce cross-request permission caching or extend the middleware timeout to server queries. API/action callers still fail closed before obtaining context; their complete error-presentation integration remains a separate verification concern.

- Production, staging, and local environments.
- Database migrations tracked in source control.
- Seed data for development.
- Environment variable template.
- CI checks for lint, typecheck, tests, and build.
- Production smoke test checklist.

## Technical Risks

- AI hallucination or extraction error.
- WhatsApp media expiry and retry handling.
- GST integration complexity and compliance requirements.
- High document volume during filing periods.
- Poor tenant isolation if RLS is incomplete.
- Export correctness and audit expectations.

## Architecture Decision Records To Add Later

- ADR: Supabase Auth and RLS tenant model.
- ADR: AI extraction schema and confidence policy.
- ADR: WhatsApp webhook processing and retry strategy.
- ADR: GST integration provider strategy.
- ADR: Export format strategy.
- ADR: Platform extension gating for GST, bank reconciliation, billing, and accounting sync.
