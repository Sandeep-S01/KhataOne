# KhataOne Project Tracker

## Project Status

Status: Implementation started. Phase 0 and Phase 1 are complete; Phase 2 through Phase 13 foundations are in progress.

## Current Focus

- Plan and execute dashboard UI/UX audit improvements across the protected CA console, mirroring the public-site audit process while preserving dense operational workflows, RLS assumptions, and CA-controlled accounting decisions.
- Deploy and visually verify the September 8, 2026 live website UI/UX audit polish on desktop, tablet, and mobile, including social previews and Supabase password recovery redirects.
- Verify AI extraction fallback layer so simple WhatsApp text invoices can become Review Queue items without paid OpenAI credits.
- Verify automatic AI extraction job processing on live Supabase/Vercel after applying the new worker migration and adding `CRON_SECRET`.
- Verify Phase 2 against a live Supabase project.
- Apply Supabase migrations for lead requests, firms, and memberships.
- Verify Phase 4 client management against a live Supabase project.
- Continue Phase 3 dashboard shell with filters, modals, and real data wiring.
- Continue dashboard design-system migration across protected work areas, prioritizing shared primitives, dense tables, compact forms, and Lovable-aligned spacing while preserving existing Supabase flows.
- Verify Phase 5 WhatsApp webhook with Meta after environment variables and public URL are configured.
- Verify KO-PERF-04 Stage 2 fast-ack webhook cutover in staging and production: the webhook now verifies Meta signature, durably queues inbound events, and returns before worker-side matching/media/document/job/ack processing; signed production probe and protected worker processing passed, while scheduler cadence still needs continued monitoring because no new GitHub scheduled run appeared during the short post-cutover wait window.
- Verify Phase 6 AI extraction against real OpenAI and Supabase credentials.
- Verify Phase 7 review actions and ledger handoff against live Supabase data.
- Verify Phase 8 ledger filters and correction workflow against live Supabase data.
- Verify Phase 9 GST summary generation against live approved transactions.
- Verify Phase 10 reports and exports against live Supabase Storage and real approved transaction/GST summary data.
- Verify Phase 11 audit, operations, rate-limit, and production smoke checklist against live deployment settings.
- Verify Phase 12 health checks, smoke scripts, demo seed, deployment runbook, and RLS verification plan against a live Supabase project and deployed app.
- Keep Phase 13 platform extensions behind explicit provider, compliance, RLS, audit, and smoke-test gates.
- Local environment values from the old application credential file have been mapped into `.env.local`; OpenAI credentials remain missing unless supplied separately.

## Milestones

| Milestone | Status | Notes |
| --- | --- | --- |
| Documentation baseline | Complete | BRD, PRD, TRD, CRD, app flow, design, schema, implementation plan, tracker, rules, AGENTS.md, skills |
| Project setup | Complete | Next.js App Router, TypeScript, Tailwind, Supabase helpers, env template, CI |
| Landing page | Complete | Public page and demo/signup/waitlist CTA capture flow implemented |
| Auth and firm workspace | In progress | Login/signup, middleware, onboarding, firm tables, and RLS migration implemented; needs live Supabase verification |
| Dashboard shell | In progress | Lovable-aligned sidebar/topbar, protected overview, module routes, shared status/table primitives, and first core list-page migration implemented; filters/modals and remaining detail pages still need polish |
| Client management | In progress | Client table, RLS, list/detail/create/edit/archive flows, WhatsApp mapping fields, and audit logging implemented; needs live Supabase verification |
| WhatsApp ingestion | In progress | Webhook verification, signature validation, raw message storage, client matching, media download, document creation, processing jobs, and inbox view implemented; needs live Meta/Supabase verification |
| AI extraction | In progress | Structured output schema, OpenAI Responses processor, AI extraction table, draft transaction creation, job endpoint, and review queue data view implemented; text-first and needs live verification |
| Review queue | In progress | Transaction detail, edit, approve, reject, duplicate, clarification request, audit logging, and ledger handoff implemented; needs live Supabase verification |
| Ledger | In progress | Ledger handoff table, RLS, approval-generated entries, filters, entry detail, correction form, and correction audit logging implemented; needs live Supabase verification |
| GST summaries | In progress | GST period table, summary table, generation action, readiness flags, summary list/detail, source transaction view, and audit logging implemented; needs live Supabase verification |
| Reports and exports | In progress | Export table, private storage buckets, CSV transactions, GST summary CSV/PDF, export history, report hub, and guarded download route implemented; needs live Supabase verification |
| Audit, security, and operations | In progress | Real audit log viewer, processing job operations view, settings readiness screen, endpoint rate limits, structured operational error logging, and smoke checklist implemented; needs live verification |
| Production hardening | In progress | Verify script, local smoke runner, health endpoint, demo seed script, CI lint/build/typecheck, security headers, production runbook, RLS verification plan, and expanded smoke checklist implemented; needs live deployment verification |
| Long-term platform extensions | In progress | Future integration schema, GST provider boundary, Platform roadmap page, and platform extension roadmap document implemented; features remain gated and not production-live |

## Open Decisions

- Final launch CTA: demo booking, waitlist, direct signup, or all three.
- GST integration provider strategy.
- Billing model and pricing.
- Whether production v1 needs staff invite flow or owner-only workspace first.
- Whether Tally export is required in production v1 or v1.1.
- Whether PDF processing uses built-in extraction only or a dedicated OCR pipeline.

## Risks

- AI extraction accuracy must be validated with Indian invoices and receipts.
- GST workflows must remain CA-reviewed.
- WhatsApp sender matching must handle shared phones and business owners with multiple GSTINs.
- RLS and firm isolation must be tested early.
- Export formats must be checked by practicing CAs.

## Next Tasks

- Manual testing by product owner: authenticated desktop/tablet/mobile visual verification for `docs/Dashboard-UI-UX-Audit-Implementation-Plan.md` using seeded or live dashboard data.
- Deploy the live website UI/UX audit polish and validate metadata previews for Open Graph, Twitter/X, LinkedIn, and WhatsApp sharing.
- Verify Supabase password reset email links redirect to `/reset-password` and successfully update passwords in production.
- Visually verify the landing, login, signup, forgot-password, reset-password, privacy, terms, and contact pages at desktop, tablet, and mobile widths.
- Deploy and visually verify the new conversion-focused landing page redesign against the production URL on desktop, tablet, and mobile widths.
- Deploy and verify the safe WhatsApp greeting/help menu responder from `docs/WhatsApp-Help-Menu-Plan.md` with matched and unmatched sender tests.
- Apply `supabase/migrations/20260812090000_normalize_transactions_nullable_fields.sql` in Supabase if Operations "Run now" reports any not-null violation on draft transaction fields such as `date`, `amount`, or `category`.
- Apply `supabase/migrations/20260812103000_normalize_transaction_lifecycle_constraints.sql` in Supabase if approving a transaction reports `transactions_status_check`.
- Deploy AI extraction fallback layer and set `AI_EXTRACTION_PROVIDER_ORDER=rule_based_text` in Vercel for no-credit testing.
- Apply `supabase/migrations/20260811110000_add_ai_extraction_job_worker.sql` in Supabase.
- Add `CRON_SECRET` to Vercel environment variables and redeploy so Vercel Cron can call `/api/jobs/ai-extraction/run-queued`. Hobby deployments use daily cron; use the Operations "Run now" action or an external scheduler for immediate testing.
- Send a matched WhatsApp text invoice and confirm it automatically appears in Review Queue without manually calling `/api/jobs/ai-extraction`.
- Configure Supabase environment variables locally.
- Apply Supabase migrations.
- Verify signup, login, firm onboarding, protected dashboard, and signout against Supabase.
- Verify client create, edit, archive, RLS isolation, and audit logs against Supabase.
- Add shared dashboard filter/modal primitives.
- Continue migrating dashboard detail pages, operational forms, and secondary modules to shared primitives.
- Configure WhatsApp environment variables and public webhook URL.
- Verify Meta webhook challenge and signed POST delivery.
- Verify media download/upload to private Supabase storage.
- Verify matched and unmatched sender behavior.
- KO-PERF-04 Stage 2 fast-ack webhook cutover is implemented and production-probed: signed webhook acceptance, durable queue insert, duplicate handling, invalid-signature rejection, and protected worker processing passed. Continue monitoring the five-minute GitHub scheduler cadence with real inbound events.
- Configure `OPENAI_API_KEY`, `OPENAI_EXTRACTION_MODEL`, and optional `JOB_RUNNER_SECRET`.
- Verify AI extraction with text-note documents.
- Add OCR/PDF/audio text extraction before relying on media-only documents.
- Verify Phase 7 approve, edit, reject, duplicate, clarification, audit, and ledger handoff flows against Supabase.
- Verify Phase 8 ledger filters, entry detail, correction flow, and correction audit logs against Supabase.
- Verify Phase 9 GST period generation, readiness status, tax buckets, source transactions, and audit logs against Supabase.
- Verify Phase 10 CSV/PDF generation, private storage upload/download, and export audit logs against Supabase.
- Verify Phase 11 audit log filtering, operations job visibility, endpoint rate limiting, and settings readiness with live credentials.
- Connect structured operational logs to Sentry or chosen monitoring provider.
- Run `npm run verify` and `SMOKE_BASE_URL=<deployment-url> npm run smoke:local` in deployment pipeline.
- Run `npm run seed:demo` after live Supabase migrations and at least one Auth user exist.
- Complete `docs/RLS-Verification-Plan.md` with two live test firms.
- Review `docs/Platform-Extensions-Roadmap.md` before implementing GST filing, GSTR comparison, bank reconciliation, reminders, sync, billing, analytics, or admin console features.
- Replace the planned GST provider boundary only after verifying an approved provider contract/docs and adding production smoke checks.
- Validate export formats with a practicing CA before marking production-ready.
- Add first end-to-end demo path with seeded data.

## Change Log

| Date | Change |
| --- | --- |
| 2026-09-09 | Implemented dashboard performance pass 3 by narrowing middleware matching to dashboard/onboarding/auth routes only, removing unnecessary Supabase auth refresh work from public pages and API endpoints while keeping protected route checks in place. |
| 2026-09-09 | Implemented dashboard performance pass 2 with shared pagination controls and bounded page-size queries for Clients, WhatsApp Inbox, Review Queue, and Ledger so route changes fetch only the visible page plus one lookahead record while preserving active filters. Local verify passed. |
| 2026-09-09 | Implemented first dashboard performance pass: request-cached firm context, removed duplicate page-level Supabase clients across dashboard routes, parallelized independent reads on hot pages, pushed status filters into Clients/Inbox/Review Queue queries, added dashboard loading skeleton, and added composite Supabase indexes for tenant-scoped dashboard queries. Local verify and smoke checks passed. |
| 2026-09-09 | Completed pre-push cleanup for the latest UI changes: fixed sidebar storage state handling for hydration-safe collapse persistence, removed stale imports/comments, normalized Tailwind utilities, pinned Turbopack to the repo root, and verified with `npm.cmd run verify`, `git diff --check`, and local smoke checks against `http://localhost:3000`. |
| 2026-09-09 | Implemented collapsible DashboardSidebar with full (w-64) and icon-only (w-[68px]) modes, top-right PanelLeftClose/PanelLeft collapse toggle button, Ctrl+B / Cmd+B keyboard shortcut, workspace avatar switcher card, custom sleek scrollbar (.k-scrollbar), and tooltip cues for collapsed icon navigation. Build passed cleanly. |
| 2026-09-09 | Redesigned landing page footer: upgraded to a 12-column structured layout with 3 categorized navigation groups (Product, Workspace, Trust & Legal), trust/compliance tags (India GST Ready, CA Controlled), full-width copyright bottom bar, and verified links. Build passed cleanly. |
| 2026-09-09 | Implemented redesigned professional header: upgraded to a 3-column CSS Grid (`grid-cols-[1fr_auto_1fr]`) for true mathematical navigation centering, standard 64px (`h-16`) vertical height, segmented capsule navigation pill with active/hover states, action boundary divider, kinetic primary CTA (`ArrowRight`), and polished mobile drawer. Build verification passed cleanly. |
| 2026-09-09 | Standardized UI components across public pages and auth forms: refactored `src/app/page.tsx`, `LeadCaptureForm`, and `AuthForm` to use unified primitives from `src/components/design-system.tsx` (`ActionLink`, `Input`, `Select`, `Textarea`, `Button`, `FormMessage`) and `StatusChip` with brand tone support. `npm run build` passed cleanly. |
| 2026-09-09 | Completed a development-only dashboard UI/UX follow-up with richer client detail operations panels for recent documents, review workload, approved records, GST readiness, and audit history, plus expanded Review Queue filters for client, document type, status, risk, search, and transaction date range; local lint/typecheck/build verification passed. |
| 2026-09-08 | Completed local dashboard audit Phase 9 verification pass: `npm.cmd run verify` passed and `SMOKE_BASE_URL=http://localhost:3000 npm.cmd run smoke:local` passed with expected unauthenticated dashboard redirects; authenticated desktop/tablet/mobile visual verification remains pending seeded/live credentials. |
| 2026-09-08 | Implemented dashboard audit Phase 8 first pass with expanded audit filters for action/entity/actor/date, accessibility labels for admin tables, truncated operations error display, role-gated run actions preserved, and explicit platform integration boundaries; local lint/typecheck/build verification passed. |
| 2026-09-08 | Implemented dashboard audit Phase 7 first pass with clearer GST readiness tables, separate mismatch and missing-document counts, explicit non-filing guidance in GST/export forms, private export/audit expectations, reserved Tally-ready labeling, table accessibility labels, and local lint/typecheck/build verification. |
| 2026-09-08 | Implemented dashboard audit Phase 6 first pass with visible active ledger filters, clearer filtered empty states, ledger table accessibility labels, and a correction page before-state panel showing current handoff values beside the audited correction form; local lint/typecheck/build verification passed. |
| 2026-09-08 | Implemented dashboard audit Phase 5 first pass with review queue search/status/risk filters, a denser review table including transaction date, risk flags, confidence, amount, age, and direct review actions, plus a sticky review-detail rail for summary, source evidence, and audited decision actions; local lint/typecheck/build verification passed. |
| 2026-09-08 | Implemented dashboard audit Phase 4 first pass with compact filters and filtered empty states for Clients and WhatsApp Inbox, status summaries for client setup, clearer inbox triage labels for unmatched/failed/queued/ready states, table accessibility labels, and local lint/typecheck/build verification. |
| 2026-09-08 | Implemented dashboard audit Phase 3 by turning the overview into a priority worklist for pending reviews, WhatsApp intake attention, GST blockers, and export job attention, with direct route links and an action-oriented latest-review snapshot; local lint/typecheck/build verification passed. |
| 2026-09-08 | Implemented the first dashboard UI/UX audit slice with protected dashboard metadata, skip-to-content navigation, mobile workspace nav auto-close, active link `aria-current`, mobile-safe sign-out labeling, resizable shared textareas, keyboard-reachable table scroll regions, sticky shared table headers, and local lint/typecheck/build verification. |
| 2026-09-08 | Added dashboard UI/UX audit implementation plan covering shell/navigation, shared operational primitives, overview prioritization, clients/inbox triage, review workflow, ledger, GST/reports/exports, audit/operations/settings, platform boundaries, responsive checks, and verification matrix. |
| 2026-09-08 | Implemented live website UI/UX audit fixes across metadata, generated social images, sitemap/robots, landing trust copy, CTA consistency, auth recovery, password visibility, demo form accessibility, mobile navigation, scroll-spy nav, structured data, and public legal/contact pages; local lint, typecheck, build, and HTTP route checks passed. |
| 2026-09-08 | Added live website UI/UX audit implementation plan covering public metadata, trust copy, auth recovery, demo form accessibility, navigation behavior, responsive polish, structured data, and verification order. |
| 2026-08-10 | Created initial planning and architecture document set for KhataOne. |
| 2026-08-10 | Added root `AGENTS.md` and KhataOne-specific Codex skills for product, design, backend, WhatsApp, AI extraction, GST, and implementation tracking. |
| 2026-08-10 | Completed Phase 0 project foundation and started Phase 1 landing page implementation. |
| 2026-08-10 | Completed Phase 1 landing page CTA capture flow with Supabase-backed lead request migration. |
| 2026-08-10 | Added Phase 2 auth/workspace foundation and Phase 3 dashboard shell routes. |
| 2026-08-10 | Added Phase 4 client management foundation with schema, RLS, create/edit/archive actions, client pages, and audit logs. |
| 2026-08-10 | Added Phase 5 WhatsApp ingestion foundation with webhook route, signature verification, raw message storage, media handling, document queueing, and inbox data view. |
| 2026-08-10 | Added Phase 6 AI extraction foundation with structured outputs, schema validation, AI extraction records, draft transaction creation, job endpoint, and review queue data view. |
| 2026-08-10 | Added Phase 7 review workflow foundation with transaction editing, approve/reject/duplicate/clarification actions, audit logs, ledger handoff migration, and real ledger view. |
| 2026-08-10 | Added Phase 8 ledger workflow foundation with filters, totals, entry detail, correction form, and ledger correction audit logging. |
| 2026-08-10 | Added Phase 9 GST summary foundation with periods, summary generation, readiness flags, source transaction view, and audit logging. |
| 2026-08-10 | Added Phase 10 reports and exports foundation with export history schema, private storage buckets, transactions CSV, GST summary CSV/PDF generation, guarded downloads, and report hub. |
| 2026-08-10 | Added Phase 11 audit, security, and operations foundation with audit log filters, operations job health view, settings readiness, endpoint rate limits, structured error logging, and production smoke checklist. |
| 2026-08-10 | Added Phase 12 production hardening foundation with health endpoint, smoke runner, demo seed script, security headers, CI lint coverage, production runbook, RLS verification plan, and expanded release checklist. |
| 2026-08-10 | Added Phase 13 long-term platform extension foundation with future integration schema, blocked GST provider boundary, Platform dashboard page, and roadmap gates. |
| 2026-08-10 | Mapped legacy application environment credentials into the current KhataOne env contract and documented the mapping without exposing secret values. |
| 2026-08-11 | Added automatic AI extraction worker implementation plan as the next production workflow improvement after WhatsApp ingestion. |
| 2026-08-11 | Implemented automatic AI extraction job worker with safe job claiming, idempotent extraction, protected Vercel Cron route, Operations manual run action, health/settings/env docs, and local lint/typecheck/build verification. |
| 2026-08-11 | Adjusted Vercel Cron schedule to daily so Hobby-plan deployments can succeed. |
| 2026-08-11 | Added AI extraction fallback layer plan focused on a no-cost deterministic text parser before any additional paid provider integration. |
| 2026-08-11 | Implemented AI extraction provider layer with OpenAI provider, no-cost rule-based text fallback, provider-order env config, fallback health/settings visibility, and Review Queue extraction-source labels. |
| 2026-08-11 | Added migration to relax legacy `transactions.date` not-null constraint so uncertain fallback extractions can enter Review Queue with null canonical `transaction_date`. |
| 2026-08-11 | Added broader legacy transactions compatibility migration for old `date` and `amount` columns. |
| 2026-08-12 | Added transaction schema normalization migration to stop repeated Operations failures from legacy not-null constraints on draft AI extraction fields such as `category`. |
| 2026-08-12 | Hardened transaction approval so ledger handoff creation surfaces errors, uses verified server-side mutation flow, records the ledger entry id in audit metadata, and rolls approval back if handoff creation fails. |
| 2026-08-12 | Added transaction lifecycle constraint normalization so live legacy databases allow the current `approved`, `rejected`, `duplicate`, and `exported` transaction states. |
| 2026-08-12 | Added project-level CRD for landing page and CA dashboard creation, including positioning, screen requirements, copy, status language, data mapping, and acceptance criteria. |
| 2026-08-13 | Added safe WhatsApp help menu implementation plan for KhataOne-branded greeting/help responses with website URL, matched/unmatched sender copy, and no unbuilt command promises. |
| 2026-08-13 | Implemented the safe WhatsApp greeting/help menu responder so simple help commands are stored, marked ignored, answered with KhataOne-branded guidance, and kept out of document/job extraction. |
| 2026-08-13 | Added landing page design improvement plan based on design audit priorities: safer claims, clearer hero, WhatsApp visual, trust section, workflow polish, and responsive checks. |
| 2026-08-13 | Implemented landing page design improvements with safer claims, sharper hero messaging, a WhatsApp intake visual, realistic review queue details, numbered workflow, trust/control section, and demo-step context. |
| 2026-08-14 | Added standalone `khataone-ui-prototype` frontend-only interactive UI prototype with mock data, local state, route coverage, role simulations, review/ledger/GST/export/audit/operations flows, and local typecheck/build verification. |
| 2026-08-15 | Redesigned the public landing page into the reference-inspired B2B SaaS layout with logo badge header, grid hero, review console preview, proof strip, platform grid, dark workflow band, demo form polish, explicit responsive viewport metadata, and local lint/typecheck/build verification. |
| 2026-08-15 | Applied landing-page-only production polish with compact SaaS navigation, WhatsApp/GST-specific hero copy, stronger workflow order, human-control review mockup, business-value section, final dark CTA, responsive hero safeguards, and local lint/typecheck/build verification. |
| 2026-08-15 | Implemented KO-PERF-04 Stage 1 infrastructure with durable WhatsApp webhook event schema, claim function, idempotent ingestion worker, protected worker route, conservative acknowledgment state handling, and local lint/typecheck/build verification while leaving the live webhook on synchronous processing. |
| 2026-08-16 | Added Vercel Cron wiring for the KO-PERF-04 WhatsApp ingestion worker at the current Hobby-compatible daily cadence and added a five-minute GitHub Actions external scheduler; Stage 2 remains gated on configuring the repository secret and verifying automatic invocation. |
| 2026-08-16 | Verified the GitHub Actions WhatsApp ingestion scheduler is firing on schedule, but runs fail at `Verify scheduler secret`; Stage 2 remains blocked until the repository `CRON_SECRET` secret is configured and a scheduled run processes a controlled queue probe. |
| 2026-08-16 | Verified the GitHub Actions WhatsApp ingestion scheduler now succeeds with `CRON_SECRET` and processed the controlled queue probe automatically; KO-PERF-04 Stage 1 runtime gate is ready for the separate Stage 2 cutover decision. |
| 2026-08-16 | Implemented KO-PERF-04 Stage 2 webhook cutover so signed WhatsApp POST requests enqueue durable inbound events and return before heavy ingestion work; worker/scheduler continue processing asynchronously. |
| 2026-08-16 | Verified Stage 2 on production with a signed synthetic webhook: initial response created only a queued durable event, duplicate replay was idempotent, invalid signature returned 401, and the protected worker processed the event asynchronously as unmatched; continue monitoring scheduler cadence because no new scheduled run appeared during the short verification window. |
| 2026-09-05 | Started application-wide design-system migration with Sora/Manrope/JetBrains Mono fonts, opacity-safe Tailwind token mapping, shared UI utilities/primitives, refreshed landing/auth/demo form styling, and first dashboard shell/component token pass. |
| 2026-09-05 | Rebuilt the public landing page into a calmer professional SaaS layout inspired by the Lovable direction while preserving the real demo request flow and deferring logo redesign. |
| 2026-09-05 | Tightened the Lovable-inspired landing implementation with safer mobile review-card layout, cleaner typography spacing, lead form polish, removal of prototype/date/fake metric copy, and local lint/typecheck/build plus Playwright viewport verification. |
| 2026-09-05 | Replaced the landing-page header/footer PNG badge with a crisp compact KhataOne lockup matching the green icon-tile reference and generated transparent logo variants from the source image. |
| 2026-09-05 | Compared the landing page against the Lovable GitHub implementation and widened the desktop frame, scaled hero typography, enlarged product-preview/card rhythm, improved form spacing, and verified desktop/tablet/mobile screenshots. |
| 2026-09-05 | Corrected the landing page over-scaling from the previous polish pass by restoring Lovable-source container widths, hero type scale, card density, button sizing, and compact form controls while keeping the cleaner logo lockup. |
| 2026-09-05 | Restored Lovable-matched hero proof numbers and made the quote card orange left rule explicit so it renders reliably with the shared card utility. |
| 2026-09-05 | Extracted the KhataOne K mark from the source logo and placed it inside the landing-page logo tile, replacing the temporary clipboard icon while preserving compact header sizing. |
| 2026-09-05 | Removed the dark backing from the visible landing logo mark, created a no-black light-header K mark variant, and wired matching favicon/app icon assets through Next metadata. |
| 2026-09-05 | Extended the Lovable-inspired public design language to login and signup with the shared KhataOne logo/header/footer, compact auth forms, responsive two-column desktop composition, and local lint/typecheck/build plus viewport screenshot verification. |
| 2026-09-05 | Reworked login and signup into the standalone Lovable-style split-screen auth layout with no header/footer, no prototype/demo-user content, real auth actions preserved, and final lint/typecheck/build plus viewport screenshot verification. |
| 2026-09-05 | Compared the auth pages directly against the Lovable GitHub `login.tsx` source and corrected the oversized auth UI by restoring the prototype's compact `max-w-sm`, `text-2xl`, `text-sm`, `h-9` form controls, hidden mobile side panel, and source-matched split-screen proportions. |
| 2026-09-06 | Started dashboard-area design-system migration with a Lovable-aligned protected shell, grouped icon sidebar, shared button/input/card/stat/table primitives, compact overview, and migrated Clients, Inbox, Review Queue, Ledger, and generic module list surfaces without changing backend flows. |
| 2026-09-06 | Continued dashboard UI migration across review detail, client detail/edit/new, ledger detail/edit, GST summary list/detail, exports, reports, operations, audit logs, settings, and shared operational forms using reusable primitives while preserving existing Supabase queries and server actions. |
| 2026-09-06 | Polished the firm onboarding workspace setup UI with the shared KhataOne logo, compact split setup layout, shared form controls, and design-system card treatment while keeping the existing create-firm server action unchanged. |
| 2026-09-06 | Added shared dashboard action-link and filter-bar primitives, migrated repeated dashboard action/filter surfaces to them, and verified public auth rendering plus protected-route redirects without bypassing authentication. |
| 2026-09-06 | Centralized remaining dashboard text-action links and form validation/message treatments into shared design-system primitives, then reran lint, typecheck, and production build successfully. |
| 2026-09-06 | Replaced dashboard overview scaffolding with firm-scoped live counts, a real review queue snapshot, and active firm context in the protected shell while preserving existing auth, RLS, and Supabase query boundaries. |
| 2026-09-06 | Replaced repeated dashboard and onboarding configuration fallback markup with a shared setup-required design-system surface and removed user-visible implementation-phase wording from protected app screens. |
| 2026-09-06 | Consolidated dashboard page gutters, record counters, and query-error presentation into shared design-system primitives across overview, clients, inbox, review queue, ledger, GST, exports, reports, operations, audit logs, settings, and platform pages. |
| 2026-09-06 | Normalized dashboard detail and edit page content gutters with the shared page body primitive across client, review, ledger, and GST detail workflows while preserving existing route guards and data access. |
| 2026-09-06 | Tightened dashboard header action alignment and centralized operational form footer alignment with a shared form-actions primitive across client, review, and ledger edit forms. |
| 2026-09-06 | Centralized dashboard, onboarding, and demo-request field-label typography into a shared design-system field-label primitive while preserving existing form actions, validation, and Supabase-backed flows. |
| 2026-09-06 | Added a shared inline alert primitive for compact dashboard risk/error signals and applied it to review queue risk flags and operations job failures without changing underlying data or actions. |
| 2026-09-06 | Centralized dashboard table numeric and action cell alignment into shared design-system table classes across overview, queue, ledger, GST, reports, exports, inbox, audit, settings, platform, and detail history tables. |
| 2026-09-06 | Polished shared dashboard empty and setup-required states with consistent icon treatment, action spacing, and setup messaging layout from the design-system layer. |
| 2026-09-06 | Tightened shared dashboard detail-list and key-value metadata primitives with consistent label typography, mobile-safe stacking, and desktop label/value alignment for client, ledger, GST, settings, review, and platform panels. |
| 2026-09-06 | Added a shared icon-panel primitive and migrated settings assurance cards, platform roadmap cards, and the legacy module page wrapper to shared dashboard presentation patterns. |
| 2026-09-06 | Centralized dashboard table numeric and action header alignment into shared design-system table header classes across operational list, overview, detail, history, and legacy module tables. |
| 2026-09-06 | Centralized common dashboard table row typography into shared primary, secondary, and monospace text classes across client, inbox, review, ledger, GST, reports, exports, audit, operations, platform, and legacy module rows. |
