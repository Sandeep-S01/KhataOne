# Dashboard UI/UX Audit Implementation Plan

## Goal

Apply the same disciplined UI/UX improvement process used for the September 8, 2026 public website audit to the protected KhataOne CA dashboard.

The dashboard pass must improve operational clarity, review speed, accessibility, responsive behavior, and trust in financial workflows without changing the product truth: WhatsApp is the SMB input layer, AI output is draft-only, CAs approve accounting decisions, GST v1 prepares summaries/exports and does not file directly.

## Scope

Dashboard surfaces:

- Dashboard shell and workspace navigation.
- Overview.
- Clients list, create, edit, and detail pages.
- WhatsApp Inbox.
- Review Queue list and transaction review detail.
- Ledger list, detail, and correction flow.
- GST Summary list and period detail.
- Reports and Exports.
- Audit Logs.
- Operations.
- Settings.
- Platform roadmap/gated integrations.
- Onboarding handoff into the dashboard where it affects first-use UX.

Out of scope for this UI/UX pass:

- New database tables unless a UX issue cannot be solved without persisted state.
- Direct GST filing.
- Tally, bank, billing, or analytics integrations beyond existing gated roadmap screens.
- Replacing Supabase Auth, RLS, storage, server actions, or existing workflow semantics.
- Public landing/auth pages, except where dashboard entry/exit links intersect.

## Product Guardrails

- Keep the dashboard dense, professional, and scan-first.
- Prioritize tables, filters, split panes, status chips, right-aligned amounts, and monospace financial values.
- Do not add decorative SaaS dashboards, oversized vanity cards, generic charts, or marketing copy inside operational screens.
- Every sensitive action must remain traceable and must not obscure audit behavior.
- Destructive or high-risk actions need clear labels, visible context, and safe confirmation patterns where appropriate.
- Keep setup/configuration gaps visible without exposing secrets or internal implementation noise.

## Current Implementation Baseline

Existing strengths:

- Shared dashboard primitives exist in `src/components/design-system.tsx`.
- Dashboard nav is grouped and icon-backed in `src/components/dashboard-nav.tsx`.
- Protected layout shows firm context and sign-out in `src/app/(dashboard)/dashboard/layout.tsx`.
- Core routes use `PageHeader`, `PageBody`, `SectionCard`, `DataTable`, `FilterBar`, `StatusChip`, `EmptyState`, and `SetupRequired`.
- Overview already uses firm-scoped live counts and a review queue snapshot.
- Review, ledger, GST, exports, audit, operations, and settings pages already preserve server actions and Supabase query boundaries.

Known improvement areas from inspection:

- Mobile dashboard navigation uses `<details>` and likely needs auto-close behavior similar to the public navigation fix.
- The dashboard shell needs an explicit skip-to-content path and stronger landmark/focus flow.
- Some pages still need visual hierarchy tightening around filters, table density, and action placement.
- Review Queue detail should move closer to the target split-pane workflow: source evidence, extraction fields, risk flags, and decision actions should remain visible with minimal scrolling.
- Filter forms need consistent submit/clear placement, responsive wrapping, and visible active-filter summaries.
- High-risk actions such as reject, duplicate, correction, export generation, and run-job actions need consistent pending/error/success feedback.
- Tables need a final pass for sticky headers, mobile overflow behavior, empty/loading states, row click affordances, and numeric alignment.
- Operational copy should remove any remaining implementation-phase wording and focus on CA tasks.

## Implementation Progress

| Date | Step | Status | Notes |
| --- | --- | --- | --- |
| 2026-09-08 | Phase 1: Dashboard shell, navigation, and access | Done locally | Added protected dashboard metadata, skip-to-content link, stable content focus target, mobile nav auto-close behavior, active link `aria-current`, and mobile-safe sign-out labeling without changing auth/RLS flow. |
| 2026-09-08 | Phase 2: Shared operational components, first pass | Done locally | Made dashboard textareas vertically resizable, added keyboard/screen-reader affordances to shared scrollable data tables, and made shared table headers sticky for dense operational scanning. |
| 2026-09-08 | Phase 3: Overview and work prioritization | Done locally | Reworked overview signals around urgent CA work: pending review, intake attention, GST blockers, export job attention, direct queue links, and a review snapshot with action affordances. |
| 2026-09-08 | Phase 4: Clients and WhatsApp Inbox UX, first pass | Done locally | Added compact client and inbox filters, status summaries, filtered empty states, table accessibility labels, and clearer WhatsApp triage labels while preserving existing client/intake data flows. |
| 2026-09-08 | Phase 5: Review Queue primary workflow, first pass | Done locally | Added review queue filters for search/status/risk, expanded the scan table with date, risk, confidence, amount, age, and action columns, and tightened the detail route with a sticky review rail for summary, source evidence, and decision actions. |
| 2026-09-08 | Phase 6: Ledger UX, first pass | Done locally | Added visible active filter summaries, clearer filtered empty states, table accessibility labels, and a correction screen before-state panel so handoff edits retain audit context. |
| 2026-09-08 | Phase 7: GST Summary, Reports, and Exports, first pass | Done locally | Split GST readiness issues into mismatch/missing-document columns, added table accessibility labels, reinforced summary/export scope without direct filing claims, and labeled Tally-ready exports as reserved. |
| 2026-09-08 | Phase 8: Audit, Operations, Settings, and Platform boundaries, first pass | Done locally | Expanded audit filters with actor/date fields, added table accessibility labels, shortened operation error display, preserved role-gated run actions, and kept platform integration boundaries explicit. |
| 2026-09-08 | Phase 9: Responsive, accessibility, and performance verification | Partially done locally | `npm.cmd run verify` passed and local smoke checks passed against `http://localhost:3000`, including unauthenticated `307` redirects for dashboard routes. Authenticated desktop/tablet/mobile visual verification still needs seeded/live credentials. |
| 2026-09-09 | Development-only follow-up: client detail and review filters | Done locally | Added richer client detail operations panels for pending review, approved records, recent documents, GST readiness, and audit history; expanded Review Queue filters with client, document type, and transaction date range. |
| 2026-09-12 | Semantic accuracy refinement | Done locally | Distinguished configuration presence from verified provider health, clarified page-scoped ledger totals, replaced missing profile/client data labels, and added contextual empty timing states without changing queries or workflow behavior. |
| 2026-09-12 | Workflow clarity refinement | Done locally | Export forms now show only fields relevant to the selected type and say `Queue export`; failed-job summaries link to the existing filtered Operations view; GST inputs identify the custom period and rely on one filing-boundary notice. Server validation, status history, and individual retry actions remain unchanged. |
| 2026-09-12 | Shared component correction refinement | Done locally | Corrected pagination captions and count grammar, centralized India-local date display, added descriptive labels to repeated row actions, reduced empty-state height, normalized missing-value and no-data labels, enlarged mobile controls while retaining compact desktop density, and aligned shared cards to the documented 8px radius. |
| 2026-09-12 | Navigation and shell refinement | Done locally | Retained the 56px top bar and existing sidebar widths, shortened the approval reminder, kept the collapse control in the sidebar header, added focus-visible portaled labels for collapsed navigation, separated Platform into a final Planned group after Settings, and moved mobile navigation to a native modal dialog with Escape, outside-click, focus trapping, and trigger-focus return. Authenticated viewport verification remains pending. |
| 2026-09-12 | Page-level refinement | Done locally | Shortened top-level operational descriptions, removed the redundant Overview eyebrow, made zero-count attention/readiness metrics neutral, replaced generic worklist actions with destination-specific labels, identified Client status chips as current-page counts, retained localized Ledger dates and handoff terminology, and limited neutral Planned roadmap items to three columns. |
| 2026-09-12 | Authenticated responsive and accessibility verification | Harness ready; credentials blocked | Added a fail-closed, read-only Playwright harness covering all six required viewports, page overflow, accessible control names, 44px mobile controls, skip-link focus, collapsed-nav tooltips, mobile Escape/outside-click/focus return, private screenshots, and a 200% zoom stress check. Chromium and the unauthenticated login shell passed all viewport widths; `LIVE_DASHBOARD_EMAIL` and `LIVE_DASHBOARD_PASSWORD` are not configured, so protected-route evidence is still pending. |

## Phase 1: Dashboard Shell, Navigation, And Access

Priority: Critical

### Work

- Add skip-to-dashboard-content link and set a stable `main`/content id.
- Convert mobile workspace navigation into a small client component that closes after route selection.
- Verify active sidebar state on nested routes and typed routes.
- Improve topbar information hierarchy: firm name, role, draft-review reminder, and sign-out should remain readable at tablet/mobile widths.
- Add or confirm page-level metadata for protected dashboard sections where useful.
- Ensure protected routes still redirect unauthenticated users and do not expose private data while loading.

### Done Criteria

- Keyboard users can skip directly to dashboard content.
- Mobile menu closes after a nav item is selected.
- Active route is unambiguous on every dashboard route.
- Header/topbar text does not clip or overlap at 390px, 834px, and desktop widths.
- No auth or RLS behavior changes regress.

## Phase 2: Shared Operational Components

Priority: Critical

### Work

- Finalize shared primitives for:
  - page header actions
  - filter bars
  - active filter chips
  - dense data tables
  - table toolbar/counts
  - status/risk chips
  - inline alerts
  - form messages
  - empty/loading/error states
  - action confirmation panels
- Make `Textarea` default to `resize-y` unless a specific workflow requires fixed height.
- Ensure `FieldError`, `FormMessage`, and form controls support `aria-describedby`, `aria-live`, disabled, pending, and invalid states consistently.
- Add tooltips or accessible labels for icon-only controls if any are introduced.

### Done Criteria

- Repeated dashboard patterns use shared primitives instead of one-off classes.
- Form and action feedback is accessible and visually consistent.
- Tables and filters keep stable dimensions and do not shift unexpectedly.

## Phase 3: Overview And Work Prioritization

Priority: High

### Work

- Make the overview answer `What needs attention first?`.
- Group signals by operational urgency:
  - pending review
  - failed ingestion/extraction
  - unmatched WhatsApp senders
  - GST periods blocked by unresolved items
  - exports waiting/failed
- Keep stat tiles compact and action-oriented.
- Add a priority worklist that links directly to the correct queue/detail pages.
- Avoid vanity metrics and decorative charts.

### Done Criteria

- A CA owner or staff user can identify next work within five seconds.
- Every overview count links to an actionable route or clearly explains the next action.
- The page remains dense but not visually crowded.

## Phase 4: Clients And WhatsApp Inbox UX

Priority: High

### Work

- Improve client list filters and status visibility for onboarding, active, pending documents, review needed, filing ready, and archived.
- Confirm GSTIN, WhatsApp phone, assigned user, filing frequency, and status use monospace/aligned formatting where appropriate.
- Improve client detail page as a compact operational summary:
  - profile
  - WhatsApp mapping
  - recent documents
  - review workload
  - GST readiness
  - audit history
- Improve Inbox triage for unmatched sender, media failed, queued, ignored/help-menu, and matched states.
- Surface clear next actions without inventing unimplemented WhatsApp command workflows.

### Done Criteria

- Staff can distinguish client setup problems from document-processing problems.
- Unmatched and failed WhatsApp intake states are visible and actionable.
- Client profile/detail pages avoid generic cards and focus on accounting operations.

## Phase 5: Review Queue Primary Workflow

Priority: Critical

### Work

- Redesign review queue list for high-speed scanning:
  - client
  - document/source
  - transaction type
  - party
  - invoice number
  - date
  - amount
  - confidence
  - risk flags
  - status
  - age/received time
- Add filters for client, status, confidence/risk, document type, GST period/date range, and search.
- Move review detail toward a resilient split-pane layout:
  - left or top: source document/text/evidence
  - center: extracted fields with field-level confidence/risk
  - right or bottom: decision actions and audit summary
- Keep approve/reject/duplicate/request-clarification actions visible but clearly separated by risk.
- Add pending/error/success feedback for all review actions.
- Preserve audit logging and ledger handoff behavior exactly.

### Done Criteria

- A reviewer can inspect evidence, correct fields, and act without losing context.
- Risk is visible near the affected field, not buried in a generic list.
- No high-risk action can be confused with approval.
- Approval still creates ledger handoff and audit entries as currently designed.

## Phase 6: Ledger UX

Priority: High

### Work

- Make ledger tables more ledger-like:
  - sticky header
  - right-aligned debit/credit/amounts
  - compact row height
  - invoice/source context
  - clear client and account columns
- Improve filter ergonomics for client, date, account, status/source, and search.
- Add visible active-filter summary and result count.
- Improve ledger detail to show transaction provenance, correction history, and source extraction trail.
- Improve correction flow with before/after context and clear audit note requirement.

### Done Criteria

- Ledger values can be scanned and compared quickly.
- Corrections are clearly corrections to handoff entries, not silent source rewrites.
- Audit history remains easy to inspect.

## Phase 7: GST Summary, Reports, And Exports

Priority: High

### Work

- Make GST summary pages show readiness first:
  - period
  - client
  - status
  - sales/purchase taxable values
  - output/input tax
  - net payable
  - mismatch count
  - missing document count
- Keep direct filing language out of the UI.
- Improve blocked/ready/exported status chips with strong contrast and non-color labels.
- Surface source transactions and unresolved issues near summary totals.
- Improve export creation flow with clear format choices, period/client scope, private-download expectations, pending state, and audit visibility.
- Keep Tally-ready export labeled as future/reserved unless implemented.

### Done Criteria

- CAs understand why a period is ready or blocked.
- Export actions make source scope and file type clear before generation.
- No UI implies direct GST filing.

## Phase 8: Audit, Operations, Settings, And Platform Boundaries

Priority: Medium

### Work

- Improve audit log filtering by actor, action, entity type, client, and date.
- Make audit records easier to scan with action tone, entity link, timestamp, and before/after metadata access.
- Improve Operations queue health visibility:
  - failed jobs
  - queued jobs
  - processing jobs
  - retry/run actions
  - last error
- Add safe pending/error/success feedback to manual run actions.
- Keep Settings focused on firm profile, members, environment readiness, and integration readiness.
- Keep Platform page explicit that direct GST, sync, banking, billing, and analytics are roadmap/gated features.

### Done Criteria

- Admin users can diagnose workflow failures without reading logs first.
- Operational errors are visible but do not expose secrets.
- Roadmap screens remain honest and gated.

## Phase 9: Responsive, Accessibility, And Performance Pass

Priority: Critical

### Work

- Verify dashboard at:
  - desktop `1440x900`
  - tablet `834x1112`
  - mobile `390x844`
- Check:
  - no horizontal page overflow beyond intentional table scroll regions
  - no overlapping topbar/sidebar/table/form text
  - touch targets at least 44px where practical on mobile controls
  - visible focus states
  - screen-reader labels for nav, tables, forms, filters, and action groups
  - status meaning not conveyed by color alone
  - reduced-motion behavior remains respected
- Keep client-side JavaScript limited to necessary interaction: nav menu behavior, pending states, lightweight filters/modals if introduced.
- Avoid expensive dashboard rendering regressions; retain server-side data fetching and pagination/limits.

### Done Criteria

- `npm.cmd run lint` passes.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes.
- Protected-route redirect smoke checks pass without Supabase credentials.
- Authenticated visual verification passes with seeded/live data when credentials are available.

## Recommended Build Order

1. Shell/navigation/accessibility foundation.
2. Shared operational component cleanup.
3. Overview work-prioritization improvements.
4. Review Queue list/detail split workflow.
5. Clients and Inbox triage.
6. Ledger detail/correction polish.
7. GST Summary, Reports, and Exports readiness/export polish.
8. Audit, Operations, Settings, and Platform boundary polish.
9. Responsive/accessibility/performance verification.

## Verification Matrix

For each dashboard route, verify:

- Authenticated data state.
- No-Supabase setup-required state.
- Empty state.
- Error state.
- Filtered/search state where available.
- Pending state for server actions.
- Success/failure feedback for actions.
- Keyboard tab order and focus visibility.
- Mobile/tablet layout behavior.
- Firm isolation and authorization assumptions remain unchanged.

Routes to verify:

- `/dashboard`
- `/dashboard/clients`
- `/dashboard/clients/new`
- `/dashboard/clients/[clientId]`
- `/dashboard/clients/[clientId]/edit`
- `/dashboard/inbox`
- `/dashboard/review-queue`
- `/dashboard/review-queue/[transactionId]`
- `/dashboard/ledger`
- `/dashboard/ledger/[entryId]`
- `/dashboard/ledger/[entryId]/edit`
- `/dashboard/gst-summary`
- `/dashboard/gst-summary/[periodId]`
- `/dashboard/reports`
- `/dashboard/exports`
- `/dashboard/audit-logs`
- `/dashboard/operations`
- `/dashboard/settings`
- `/dashboard/platform`

## Open Decisions Before Implementation

- Should dashboard mobile support include full review/edit actions, or should mobile prioritize triage/read-only workflows for v1?
- Should Review Queue become a true in-page split pane, or remain list/detail routes with a tighter detail layout?
- Which dashboard routes need pagination before visual polish on larger real datasets?
- Which roles can run Operations jobs, generate exports, correct ledger entries, and view audit logs?
- Should Billing be added to the sidebar now as a disabled/gated item, or remain out until the billing model is decided?
- What seeded dataset should be used for visual regression checks across CA workflows?
