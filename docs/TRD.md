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
