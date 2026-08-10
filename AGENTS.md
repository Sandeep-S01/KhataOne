# AGENTS.md

## Purpose

This file is the operating guide for AI agents working on KhataOne. Its job is to reduce hallucination, preserve product intent, and keep implementation aligned with the planning documents in `docs/`.

KhataOne is a WhatsApp-first AI accounting and GST workflow platform for Indian SMBs, operated through a CA and accounting firm console. Do not reinterpret it as a generic SaaS dashboard, CRM, ERP, or consumer finance app.

## Required Reading Order

Before making product, architecture, schema, or UI decisions, read these files:

1. `docs/rules.md`
2. `docs/PRD.md`
3. `docs/TRD.md`
4. `docs/Backend-Schema.md`
5. `docs/Implementation-Plan.md`
6. `docs/Design.md` and `docs/UI-UX-Design-Brief.md` for any UI work
7. `docs/Tracker.md` before starting and after finishing meaningful work

If a request conflicts with these documents, follow the user's latest explicit instruction and update the relevant document if the decision changes project direction.

## KhataOne Skills

Use these local Codex skills when the task matches their scope:

- `$khataone-product-planning` for BRD, PRD, app flow, roadmap, and feature-scope work.
- `$khataone-frontend-design` for landing page, CA dashboard, review queue, ledger, reports, and UI/UX work.
- `$khataone-backend-architecture` for Supabase schema, APIs, auth, storage, RLS, jobs, exports, and backend security.
- `$khataone-whatsapp-ingestion` for WhatsApp Cloud API webhooks, media intake, client matching, and clarification flows.
- `$khataone-ai-extraction` for OpenAI document extraction, structured outputs, confidence scoring, risk flags, and review routing.
- `$khataone-gst-workflows` for GST summaries, readiness, exports, mismatch handling, and future GST integration boundaries.
- `$khataone-implementation-tracker` for build sequencing, phase planning, done criteria, and tracker updates.

## Product Truths

- Product name: KhataOne.
- Primary buyer/user: CA firms and accounting teams in India.
- Primary SMB client interface: WhatsApp.
- Primary professional interface: web dashboard for CAs.
- Production v1: landing page, CA dashboard, WhatsApp ingestion, AI extraction, review workflow, ledger, GST summaries, reports, exports, audit logs.
- Long-term platform: direct GST integration, bank/GSTR reconciliation, Tally/accounting software sync, billing, advanced analytics.
- GST filing must not be described as live unless it is actually implemented, verified, and compliant.

## Approved Stack

Use this stack unless project documents are intentionally updated:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Row Level Security
- WhatsApp Cloud API
- OpenAI structured extraction
- lucide-react icons
- Vercel deployment target

Do not introduce a new framework, database, auth system, queue, styling approach, or AI provider without a clear reason and a documented decision.

## Anti-Hallucination Rules

- Do not invent implemented features. If code does not exist, say it is planned or proposed.
- Do not invent external API capabilities, pricing, policies, GST filing permissions, or legal/compliance status.
- Do not claim direct GST filing works until the integration exists and has been tested.
- Do not invent database tables, fields, or routes that conflict with `docs/Backend-Schema.md` and `docs/TRD.md`.
- Do not make up metrics, testimonials, certifications, partnerships, bank integrations, or government approvals.
- Do not treat AI extraction as authoritative accounting truth.
- Do not auto-approve high-risk financial records without a documented review policy.
- Do not delete or overwrite source documents, raw webhook events, or raw AI outputs.
- Do not assume WhatsApp sender identity is always unique; shared phones and multiple GSTINs must be handled carefully.
- If information is missing, make a conservative implementation assumption and document it, or ask the user when the assumption could create security, compliance, or data-loss risk.

## Evidence Rules

When working in this repository:

- Inspect existing files before editing.
- Prefer existing patterns once code exists.
- Ground answers in actual files and docs.
- For current third-party API details, verify against official documentation when needed.
- If unable to verify something, label it as an assumption.
- Mention unverified assumptions in the final response.

## Security And Data Rules

- Every firm-owned record must include `firm_id`.
- Enforce tenant isolation with Supabase RLS.
- Never expose private client documents publicly.
- Use signed URLs for document previews.
- Verify WhatsApp webhook signatures.
- Store secrets only in environment variables.
- Keep raw WhatsApp events for traceability.
- Keep original uploaded documents.
- Keep raw and normalized AI extraction outputs.
- Log sensitive business actions to audit logs.
- Add role checks for firm owner, admin, staff, and viewer flows.

## AI Extraction Rules

- Use structured outputs and schema validation.
- Store model, prompt version, schema version, confidence score, risk flags, and raw output.
- Route low-confidence or incomplete extraction to `needs_review`.
- Preserve original input for side-by-side CA review.
- Duplicate detection should flag records, not delete them.
- Extraction should create draft transactions, not final ledger truth.
- Approved transaction records must store who approved them and when.

## Accounting And GST Rules

- Production v1 prepares GST summaries and export data.
- Direct GST filing is a future capability unless implemented and verified.
- GST summaries must be traceable to source transactions.
- Missing documents, invalid GSTINs, tax mismatches, and low-confidence transactions must affect filing readiness.
- Financial edits must preserve before/after state in audit logs.
- Reports and exports must be repeatable and traceable.

## UI Rules

- Landing page comes first in the build sequence.
- Dashboard must feel like a dense professional CA operations console.
- Use compact tables, filters, split panes, clear status chips, and right-aligned numeric values.
- Use monospace styling for amounts, invoice numbers, GSTINs, and ledger-like values.
- Use lucide-react icons for icon buttons.
- Do not build generic decorative SaaS card dashboards.
- Do not add feature-explainer text inside operational app screens.
- Keep UI accessible, keyboard-friendly, responsive, and free of text overlap.

## Implementation Workflow

Work in vertical slices:

1. Foundation
2. Landing page
3. Auth and firm workspace
4. Dashboard shell
5. Client management
6. WhatsApp ingestion
7. AI extraction
8. Review queue
9. Ledger
10. GST summary
11. Reports and exports
12. Audit, security, operations
13. Production hardening

For each feature, handle:

- Data model
- UI state
- Loading state
- Empty state
- Error state
- Authorization
- Audit behavior
- Tests or verification

## Documentation Maintenance

Update `docs/Tracker.md` after meaningful work.

Update the relevant document when project direction changes:

- Business/product change: `docs/BRD.md` or `docs/PRD.md`
- Technical decision: `docs/TRD.md`
- Schema change: `docs/Backend-Schema.md`
- Build sequence change: `docs/Implementation-Plan.md`
- UI/design change: `docs/Design.md` or `docs/UI-UX-Design-Brief.md`
- Agent/process rule change: `docs/rules.md` or this file

## Completion Checklist

Before calling work complete:

- Relevant docs were read.
- Code matches the approved stack and product direction.
- Tenant isolation was considered.
- Private financial data is protected.
- AI outputs remain reviewable.
- GST claims are accurate.
- Audit logging exists for sensitive actions.
- Lint/typecheck/build/tests were run where available.
- `docs/Tracker.md` was updated if the work changed project status.

## If Unsure

Pause before implementing anything that could affect:

- GST filing or legal/compliance claims.
- Tenant isolation.
- Deletion of financial records or source documents.
- Public exposure of private files.
- Automatic approval of AI-generated accounting entries.
- New external integrations or paid services.

For ordinary UI and implementation details, make a conservative decision that matches the existing docs and continue.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
