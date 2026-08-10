# KhataOne AI Agent Rules

## Product Rules

- KhataOne is a CA-first operations platform, not a generic SaaS dashboard.
- WhatsApp is the SMB client input channel.
- The CA dashboard is the review, control, GST preparation, and export layer.
- AI output must be treated as draft until reviewed or explicitly approved.
- Do not imply KhataOne files GST directly until direct GST integration is actually implemented and compliant.
- Always preserve auditability for financial and compliance-related actions.

## Architecture Rules

- Use Next.js, TypeScript, Supabase, WhatsApp Cloud API, and OpenAI unless a document is updated to say otherwise.
- Keep tenant isolation central. Every firm-owned table needs `firm_id`.
- Use Supabase RLS for firm data isolation.
- Store raw inbound WhatsApp events before processing.
- Store original documents and AI extraction outputs.
- Validate AI output with structured schemas before saving business records.
- Long-running work should run through jobs or background processing.
- Keep future GST integration behind a dedicated integration boundary.

## UI Rules

- Dashboard screens should be dense, professional, and optimized for scanning.
- Use tables, filters, split panes, and compact status chips for operational workflows.
- Use real workflow visuals on the landing page.
- Do not build decorative dashboards full of generic cards.
- Use clear approval states: draft, needs review, approved, rejected, exported.
- Use monospace styling for amounts, GSTINs, invoice numbers, and tabular financial data.
- Use icons from lucide-react when icons are needed.
- Keep controls accessible and keyboard-friendly.

## Security Rules

- Never expose private documents publicly.
- Use signed URLs for document previews.
- Verify WhatsApp webhook signatures.
- Keep secrets in environment variables.
- Add rate limiting to auth, webhook, and AI-heavy endpoints.
- Log sensitive business actions to audit logs.
- Never skip firm ownership checks in server code.

## Development Rules

- Read the relevant docs before changing implementation.
- Update `docs/Tracker.md` after meaningful project changes.
- Prefer small vertical slices over broad unfinished scaffolding.
- Add migrations for schema changes.
- Add tests for security, parsing, workflow state transitions, and exports.
- Run lint, typecheck, and build before considering work complete.
- Keep implementation aligned with existing project patterns once code exists.

## AI Extraction Rules

- Use structured outputs.
- Record model, prompt version, schema version, confidence, and raw output.
- Mark low-confidence or incomplete output as `needs_review`.
- Do not silently auto-approve high-risk transactions.
- Duplicate detection should flag, not delete.
- Preserve original input for reviewer comparison.

## GST Rules

- Production v1 prepares GST summaries and exports.
- Direct GST filing is a future capability unless explicitly built and verified.
- GST reports must show source transactions and unresolved issues.
- Invalid or missing GSTIN/tax fields should affect filing readiness.

## Completion Rules

- A feature is not complete until data, UI state, error state, authorization, and audit behavior are handled.
- A workflow is not complete until the unhappy paths are visible to the CA.
- A production feature is not complete until it is tested with realistic Indian SMB accounting samples.
