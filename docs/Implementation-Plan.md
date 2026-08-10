# KhataOne Implementation Plan

## Build Strategy

Build KhataOne in vertical slices. Start with the landing page and project foundation, then build the CA dashboard shell, then connect real data workflows from client setup to WhatsApp ingestion to AI extraction to review to GST summary and export.

## Phase 0: Project Foundation

- Initialize Next.js App Router project with TypeScript.
- Configure Tailwind CSS and design tokens.
- Add linting, formatting, typecheck, and build scripts.
- Configure Supabase client, server helpers, and environment variables.
- Create `docs/` as source-of-truth project guidance.
- Add `.env.example`.
- Add CI checks.

## Phase 1: Landing Page

- Build public landing page.
- Add CTA flow for demo/signup/waitlist.
- Include workflow section for WhatsApp, AI extraction, CA review, GST/report exports.
- Add security and auditability trust section.
- Ensure responsive desktop/mobile behavior.
- Verify accessibility and performance basics.

## Phase 2: Authentication And Firm Workspace

- Configure Supabase Auth.
- Create firm and firm user tables.
- Add protected dashboard layout.
- Implement signup/login/logout.
- Add firm onboarding screen.
- Add role-ready access model.

## Phase 3: Dashboard Shell

- Create sidebar navigation.
- Create topbar with firm context and user menu.
- Build Overview, Clients, Inbox, Review Queue, Ledger, GST Summary, Reports, Exports, Audit Logs, Settings routes.
- Add shared table, filter, status chip, button, modal, and form components.

## Phase 4: Client Management

- Build client list and detail pages.
- Add create/edit/archive client flows.
- Store GSTIN, WhatsApp number, filing frequency, state, and assigned staff.
- Add client status model.
- Add audit logs for client changes.

## Phase 5: WhatsApp Ingestion

- Add WhatsApp webhook verification endpoint.
- Add inbound webhook handler.
- Verify signatures.
- Store raw WhatsApp messages.
- Match sender phone to client.
- Download and store media.
- Create document records.
- Add processing job records.
- Send basic acknowledgment message.

## Phase 6: AI Extraction Pipeline

- Define extraction JSON schema.
- Build document text preparation for images, PDFs, audio, and text.
- Integrate OpenAI structured extraction.
- Store raw and normalized AI output.
- Add confidence scores and risk flags.
- Create draft transactions from extraction results.
- Route low-confidence items to review queue.

## Phase 7: Review Queue

- Build filterable review queue.
- Add document preview.
- Add extracted field editor.
- Add approve, reject, duplicate, and request clarification actions.
- Write audit logs for every review action.
- Move approved records into ledger.

## Phase 8: Ledger

- Build client ledger table.
- Add filters by client, date, status, category, and GST period.
- Add manual correction flow.
- Add ledger entry creation from approved transactions.
- Ensure amount formatting and GST fields are reliable.

## Phase 9: GST Summary

- Add GST period model.
- Generate GST summaries from approved transactions.
- Show filing readiness status.
- Surface missing documents, mismatches, low-confidence items, and invalid GST fields.
- Add summary refresh/regeneration action.
- Keep future direct GST integration behind a clear integration boundary.

## Phase 10: Reports And Exports

- Build export creation flow.
- Add CSV transaction export.
- Add PDF GST/accounting summary.
- Add export history.
- Store generated files.
- Log export actions.
- Prepare Tally-compatible export structure for future iteration.

## Phase 11: Audit, Security, And Operations

- Enforce RLS policies.
- Add role-based authorization checks.
- Add audit log viewer.
- Add processing job/error views.
- Add rate limiting for sensitive endpoints.
- Add Sentry or equivalent error tracking.
- Add production smoke test checklist.

## Phase 12: Production Hardening

- Test end-to-end client document flow.
- Test firm isolation.
- Test WhatsApp webhook retries.
- Test AI extraction failure paths.
- Test exports.
- Add backup and migration process.
- Finalize deployment pipeline.
- Run production readiness review.

## Phase 13: Long-Term Platform Extensions

- Direct GST integration through approved provider.
- GSTR comparison workflows.
- Bank statement reconciliation.
- WhatsApp reminders and clarification loops.
- Tally/Zoho/QuickBooks sync.
- Billing and subscriptions.
- Staff analytics.
- Multi-firm admin console.

## Recommended Build Order For AI Agents

1. Read `docs/rules.md`.
2. Read `docs/PRD.md`.
3. Read `docs/TRD.md`.
4. Read `docs/Backend-Schema.md`.
5. Build one phase at a time.
6. Update `docs/Tracker.md` after every meaningful change.
7. Do not skip auditability, firm isolation, or review states.
