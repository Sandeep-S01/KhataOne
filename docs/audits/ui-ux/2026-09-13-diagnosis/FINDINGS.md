# KhataOne UI/UX findings

Date: 2026-09-13. Diagnosis only; no fixes applied. Severity ranks user impact, not security exploitability. High = incorrect/misleading accounting workflow or core task failure; Medium = substantial friction/accessibility/recovery gap; Low = clarity or polish. “Candidate fix” is implementation input, not authorization to change business rules.

## KO-UX-001 — Filters run after pagination and can conceal matching records

**area**: Review Queue; Inbox

**severity**: High

**impact**: Review search/document/risk and Inbox search filter only the fetched first 50 rows. An empty filtered page suppresses pagination even when the lookahead says later rows exist.

**observed**: Review search/document/risk and Inbox search filter only the fetched first 50 rows. An empty filtered page suppresses pagination even when the lookahead says later rows exist.

**intended**: Search and pagination must describe the same complete firm-scoped result set.

**evidence**: CODE_INSPECTED; isolated synthetic illustration in local-diagnostics.json

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/review-queue/page.tsx:202; src/app/(dashboard)/dashboard/inbox/page.tsx:141

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Client-side array predicates are downstream of the server range and lookahead.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Move all supported predicates before pagination; preserve stable ordering, escaping, tenant scope and URL parameters. Do not remove the row bound.

**consumers**: Review Queue; Inbox

**effort**: L

**dependencies**: Query/RPC design review and multi-page fixture coverage; clients search already runs in SQL.

**acceptance**: With 51+ synthetic records and a sole match beyond row 50, search finds it; risk/document/status combinations paginate without omissions.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Crosses query/workflow/provenance contracts and requires representative regression fixtures.

**routes**: /dashboard/inbox; /dashboard/review-queue

**component**: src/app/(dashboard)/dashboard/review-queue/page.tsx; src/app/(dashboard)/dashboard/inbox/page.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-002 — Approval ignores unsaved field edits

**area**: Review detail

**severity**: High

**impact**: The edit form and decision forms are independent. Approve submits transaction_id, while edited uncontrolled fields remain only in the separate Save form.

**observed**: The edit form and decision forms are independent. Approve submits transaction_id, while edited uncontrolled fields remain only in the separate Save form.

**intended**: The reviewer must know which persisted values will be approved and handed to Ledger.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx:10; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx:193; src/components/transaction-review-form.tsx:3

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: No shared dirty/pending state ties the field editor to decisions.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Expose unsaved changes and require a successful explicit save before decisions; retain atomic approval RPC and posted immutability. Do not silently combine save and approve without product approval.

**consumers**: Review detail

**effort**: L

**dependencies**: Review form state ownership; approval/retry/ledger/audit regression fixtures.

**acceptance**: Edit an amount without saving: approval is disabled or clearly intercepted; save failure retains values; after save, approval uses precisely the displayed persisted values.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Crosses query/workflow/provenance contracts and requires representative regression fixtures.

**routes**: /dashboard/review-queue/[transactionId]

**component**: src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx; src/components/transaction-review-form.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-003 — Original document is unavailable beside extracted fields

**area**: Review detail; source provenance

**severity**: High

**impact**: The evidence rail renders source_text in a pre block or a storage-path fallback. No private image/PDF/audio preview or original-file link is rendered.

**observed**: The evidence rail renders source_text in a pre block or a storage-path fallback. No private image/PDF/audio preview or original-file link is rendered.

**intended**: CA reviewers must compare the retained source with AI draft fields before deciding.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx:90; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx:180

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Existing document metadata is read but no private-media presentation contract is wired.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Add an authorized, short-lived original preview/download path with MIME-specific fallback; keep text, normalized output, raw output and source files intact.

**consumers**: Review detail; source provenance

**effort**: L

**dependencies**: Private document delivery contract and source-media fixtures; not a cosmetic-only change.

**acceptance**: Authorized image/PDF/text/audio fixtures have usable evidence or a precise unavailable state; foreign-firm files remain denied and signed URLs never enter logs.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Crosses query/workflow/provenance contracts and requires representative regression fixtures.

**routes**: /dashboard/review-queue/[transactionId]

**component**: src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-004 — Date defaults and date filters disagree with India calendar days

**area**: GST generation; Exports; Audit Logs

**severity**: High

**impact**: Local midnight converted through toISOString yields previous-day month boundaries in Asia/Kolkata. Audit timestamps are filtered using UTC midnight although displayed in India time.

**observed**: Local midnight converted through toISOString yields previous-day month boundaries in Asia/Kolkata. Audit timestamps are filtered using UTC midnight although displayed in India time.

**intended**: Date-only reporting periods must remain calendar dates; displayed and filtered timestamp days must use one documented zone.

**evidence**: CODE_INSPECTED; isolated Chromium expression verified in UTC and Asia/Kolkata

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/components/gst-summary-form.tsx:30; src/components/export-form.tsx:50; src/app/(dashboard)/dashboard/audit-logs/page.tsx:99

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Calendar-only strings and timezone-bearing instants use the same UTC conversion pattern.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Centralize date-only period construction; translate India day boundaries explicitly for timestamp queries. Keep accounting aggregation rules unchanged.

**consumers**: GST generation; Exports; Audit Logs

**effort**: M

**dependencies**: Agree timestamp filter zone; reuse format.ts display semantics. Do not alter tax calculations.

**acceptance**: September 2026 defaults are 01 Sep–30 Sep in UTC and India clients; audit events at 00:01 and 23:59 IST fall in the selected day.

**verification**: local-diagnostics.json: India gives 2026-08-31 / 2026-09-29; UTC gives 2026-09-01 / 2026-09-30. Form submission not exercised.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/audit-logs; /dashboard/exports; /dashboard/gst-summary

**component**: src/components/gst-summary-form.tsx; src/components/export-form.tsx; src/app/(dashboard)/dashboard/audit-logs/page.tsx

**evidence_ref**: evidence/local-diagnostics.json

## KO-UX-005 — Read failures can masquerade as zero workload or missing records

**area**: Overview; Reports; Operations; detail screens

**severity**: High

**impact**: Several count results use count ?? 0 without handling their errors; detail .single() errors are discarded before notFound. Secondary query failures can appear as empty histories.

**observed**: Several count results use count ?? 0 without handling their errors; detail .single() errors are discarded before notFound. Secondary query failures can appear as empty histories.

**intended**: Unavailable, absent and zero are distinct states in an accounting console.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/page.tsx:150; src/app/(dashboard)/dashboard/reports/page.tsx:38; src/app/(dashboard)/dashboard/operations/page.tsx:355; src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx:90

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Supabase resolved error objects are collapsed into normal empty/default values.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Handle each read result explicitly; render unavailable states with safe retry and preserve successful sibling panels. Reserve 404 for confirmed absence/access result.

**consumers**: Overview; Reports; Operations; detail screens

**effort**: L

**dependencies**: Read-only failure fixtures or mocked server responses; preserve fail-closed access semantics.

**acceptance**: Injected count, picker, detail and history errors never show healthy zero or a false empty onboarding state; retry restores content without exposing database messages.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Crosses query/workflow/provenance contracts and requires representative regression fixtures.

**routes**: /dashboard/clients/[clientId]; /dashboard/operations; /dashboard; /dashboard/reports

**component**: src/app/(dashboard)/dashboard/page.tsx; src/app/(dashboard)/dashboard/reports/page.tsx; src/app/(dashboard)/dashboard/operations/page.tsx; src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-006 — Viewer sees mutation affordances that server rejects

**area**: Clients; Review; Ledger correction; GST; Exports

**severity**: Medium

**impact**: Several pages render create/edit/decision/generation forms without evaluating firm.role. Actions independently restrict mutations to owner/admin/staff.

**observed**: Several pages render create/edit/decision/generation forms without evaluating firm.role. Actions independently restrict mutations to owner/admin/staff.

**intended**: Read-only users should understand their access before spending time editing or submitting.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/clients/new/page.tsx:1; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx:10; src/app/actions/clients.ts:103; src/app/actions/review.ts:180

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Permission checks exist at the server boundary but are not consistently passed to presentation.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Use one role capability contract for visibility/read-only treatment, while retaining independent action and database checks.

**consumers**: Clients; Review; Ledger correction; GST; Exports

**effort**: M

**dependencies**: Disposable owner/admin/staff/viewer membership fixtures. Current live account alone cannot certify role matrix.

**acceptance**: Viewer fixtures see readable records and an explicit role explanation; direct denied submissions still fail server-side; authorized roles retain controls.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/clients/new; /dashboard/clients/[clientId]; /dashboard/review-queue/[transactionId]

**component**: src/app/(dashboard)/dashboard/clients/new/page.tsx; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx; src/app/actions/clients.ts; src/app/actions/review.ts

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-007 — Decision, archive and job actions lack reliable pending/outcome feedback

**area**: Review decisions; client archive; Operations

**severity**: Medium

**impact**: Plain server-action forms have no pending state. archiveClientAction ignores the RPC error and redirects normally; manual job actions discard worker outcomes and return to the list.

**observed**: Plain server-action forms have no pending state. archiveClientAction ignores the RPC error and redirects normally; manual job actions discard worker outcomes and return to the list.

**intended**: A user must see whether an action is processing, succeeded, failed or was denied.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/actions/clients.ts:244; src/app/actions/operations.ts:50; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx:193

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Mutation results and action status are not represented in the rendered form state.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Add scoped pending controls and safe result feedback; retain form input on error, show confirmation context for archive/reject, and preserve idempotent RPC behavior.

**consumers**: Review decisions; client archive; Operations

**effort**: L

**dependencies**: Synthetic fixtures and sandboxed WhatsApp/worker side effects; no live action testing.

**acceptance**: Double clicks cannot start conflicting UI actions; RPC/worker failure yields a visible safe error, no false success; successful action has a clear result.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Crosses query/workflow/provenance contracts and requires representative regression fixtures.

**routes**: /dashboard/clients/[clientId]; /dashboard/operations; /dashboard/review-queue/[transactionId]

**component**: src/app/actions/clients.ts; src/app/actions/operations.ts; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-008 — Queued export completion does not refresh the open screen

**area**: Exports

**severity**: Medium

**impact**: Export enqueue correctly returns queued status, but the mounted page has no polling, realtime subscription or explicit refresh control to reveal worker completion.

**observed**: Export enqueue correctly returns queued status, but the mounted page has no polling, realtime subscription or explicit refresh control to reveal worker completion.

**intended**: Queued, processing, failed and downloadable states should remain discoverable without guesswork.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/exports/page.tsx:67; src/components/export-form.tsx:4; src/app/actions/exports.ts:112

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Background state changes happen outside the request that rendered history.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Provide an explicit refresh and consider bounded status polling only while work is active; surface existing Operations recovery destinations.

**consumers**: Exports

**effort**: M

**dependencies**: Enqueue/worker state fixtures; preserve private guarded download and role restrictions.

**acceptance**: A synthetic job transitioning queued→completed appears as downloadable without a full manual browser reload; failed state offers a safe next step; polling stops when idle.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/exports

**component**: src/app/(dashboard)/dashboard/exports/page.tsx; src/components/export-form.tsx; src/app/actions/exports.ts

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-009 — Fixed history limits hide older records without pagination

**area**: GST Summary; Reports; Exports; Audit Logs; Operations

**severity**: Medium

**impact**: GST list stops at 60, Reports at 50 periods, Exports at 80 history/period options, Audit and Operations at 100 rows; these surfaces lack next-page access.

**observed**: GST list stops at 60, Reports at 50 periods, Exports at 80 history/period options, Audit and Operations at 100 rows; these surfaces lack next-page access.

**intended**: Users must know scope and be able to retrieve relevant historical records.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/gst-summary/page.tsx:81; src/app/(dashboard)/dashboard/reports/page.tsx:78; src/app/(dashboard)/dashboard/exports/page.tsx:99; src/app/(dashboard)/dashboard/audit-logs/page.tsx:84; src/app/(dashboard)/dashboard/operations/page.tsx:241

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Response bounds were added without complete result navigation; chooser bounds can prevent selecting old periods.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Add stable scoped pagination and explicit recent/loaded counts; use searchable period selectors when needed, preserving query limits.

**consumers**: GST Summary; Reports; Exports; Audit Logs; Operations

**effort**: L

**dependencies**: Dataset-size evidence and stable cursor/order decision; no invented global totals.

**acceptance**: Boundary+1 fixtures expose the older record and keep filter state; selectors reach old eligible GST periods; no unbounded query is introduced.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Crosses query/workflow/provenance contracts and requires representative regression fixtures.

**routes**: /dashboard/audit-logs; /dashboard/exports; /dashboard/gst-summary; /dashboard/operations; /dashboard/reports

**component**: src/app/(dashboard)/dashboard/gst-summary/page.tsx; src/app/(dashboard)/dashboard/reports/page.tsx; src/app/(dashboard)/dashboard/exports/page.tsx; src/app/(dashboard)/dashboard/audit-logs/page.tsx; src/app/(dashboard)/dashboard/operations/page.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-010 — Success chip text falls below normal-text contrast target

**area**: Shared StatusChip; success messages

**severity**: Medium

**impact**: Success #168a4a on its 10% white blend computes to 3.88:1 at 12px text. Warning was already darkened and measures 5.10:1 under the same model.

**observed**: Success #168a4a on its 10% white blend computes to 3.88:1 at 12px text. Warning was already darkened and measures 5.10:1 under the same model.

**intended**: Small semantic text should meet 4.5:1 on its actual surface and retain a text label.

**evidence**: CODE_INSPECTED; deterministic contrast arithmetic

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/components/status-chip.tsx:5; src/app/globals.css:33

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: The same bright success color supplies both foreground and translucent background.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Introduce a darker semantic foreground token and retain restrained success background; measure actual nested surfaces and focus states.

**consumers**: StatusChip across dashboard and public illustrative UI; success message styles

**effort**: S

**dependencies**: Preserve existing firm/role checks and server action contracts; no production fixtures may be mutated.

**acceptance**: Every small chip/success message foreground-background pair meets 4.5:1; status remains understandable without color.

**verification**: local-diagnostics.json contains formula inputs/results; not a whole-application WCAG certification.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /dashboard/audit-logs; /dashboard/clients; /dashboard/clients/[clientId]; /dashboard/exports; /dashboard/gst-summary; /dashboard/gst-summary/[periodId]; /dashboard/inbox; /dashboard/operations; /dashboard; /dashboard/platform; /dashboard/reports; /dashboard/review-queue; /dashboard/review-queue/[transactionId]; /dashboard/settings; /

**component**: src/components/status-chip.tsx; src/app/globals.css

**evidence_ref**: evidence/local-diagnostics.json

## KO-UX-011 — Operational errors are not consistently associated with fields

**area**: Client, review, ledger, GST and export forms

**severity**: Medium

**impact**: Shared FieldError supports an ID, but operational form consumers generally omit aria-invalid and aria-describedby. Clarification textarea has placeholder text without an accessible label.

**observed**: Shared FieldError supports an ID, but operational form consumers generally omit aria-invalid and aria-describedby. Clarification textarea has placeholder text without an accessible label.

**intended**: Errors and purpose should be announced at the affected control, as AuthForm already does.

**evidence**: CODE_INSPECTED; BROWSER_VERIFIED

**environment**: Hosted khataone.vercel.app; Chromium153; existing account; detailed viewport evidence in authenticated-browser.json

**source**: src/components/design-system.tsx:184; src/components/client-form.tsx:12; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx:246

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Error text is rendered visually without a consistent field ID/name/error contract.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Associate label, help and error IDs; set aria-invalid after validation; focus the first invalid field or an error summary; label clarification explicitly.

**consumers**: ClientForm, TransactionReviewForm, LedgerEntryForm, GstSummaryForm, ExportForm; review clarification

**effort**: M

**dependencies**: Shared field contract; screen-reader validation with synthetic errors.

**acceptance**: Keyboard/screen-reader tests identify each invalid field and error; clarification has a persistent label; pending feedback remains live and nonduplicative.

**verification**: Unnamed clarification TEXTAREA observed on detail at320/1280/1440; field-error submission behavior remains blocked.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/audit-logs; /dashboard/clients/new; /dashboard/clients; /dashboard/clients/[clientId]/edit; /dashboard/clients/[clientId]; /dashboard/exports; /dashboard/gst-summary; /dashboard/gst-summary/[periodId]; /dashboard/inbox; /dashboard/ledger; /dashboard/ledger/[entryId]/edit; /dashboard/ledger/[entryId]; /dashboard/operations; /dashboard; /dashboard/platform; /dashboard/reports; /dashboard/review-queue; /dashboard/review-queue/[transactionId]; /dashboard/settings; /onboarding; /

**component**: src/components/design-system.tsx; src/components/client-form.tsx; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx

**evidence_ref**: evidence/authenticated-browser.json

## KO-UX-012 — Collapsed navigation tooltip cannot be dismissed with Escape

**area**: Dashboard navigation

**severity**: Medium

**impact**: Tooltip visibility follows hover/focus only; Escape has no dismissal handler.

**observed**: Tooltip visibility follows hover/focus only; Escape has no dismissal handler.

**intended**: Additional hover/focus content should be dismissible without moving focus when it obscures content.

**evidence**: CODE_INSPECTED; BROWSER_VERIFIED

**environment**: Hosted khataone.vercel.app; Chromium153; existing account; detailed viewport evidence in authenticated-browser.json

**source**: src/components/dashboard-nav.tsx:163

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Tooltip has no explicit dismissal state.

**confidence**: High for source; hosted interaction outcome in authenticated-browser.json

**candidateFix**: Add Escape dismissal for the current focused/hovered tooltip and reset appropriately on re-entry; preserve keyboard accessible link names.

**consumers**: Dashboard navigation

**effort**: S

**dependencies**: Preserve existing firm/role checks and server action contracts; no production fixtures may be mutated.

**acceptance**: Collapsed link focus shows its label; Escape hides it without moving focus; it can be shown again; pointer entry into tooltip is evaluated for hoverability.

**verification**: Tooltip visible after focus and remains visible after Escape. Skip link, mobile Escape and focus return passed.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /dashboard/*

**component**: src/components/dashboard-nav.tsx

**evidence_ref**: evidence/authenticated-browser.json

## KO-UX-013 — Auth controls miss the project mobile touch baseline

**area**: Login; Signup; password recovery

**severity**: Medium

**impact**: Auth and reset fields remain 36px high; password visibility buttons are 28×28px. Public browser measurements confirm those sizes on narrow screens.

**observed**: Auth and reset fields remain 36px high; password visibility buttons are 28×28px. Public browser measurements confirm those sizes on narrow screens.

**intended**: The candidate/project touch baseline is 44px while desktop can remain compact.

**evidence**: CODE_INSPECTED; BROWSER_VERIFIED public local

**environment**: Local isolated Next development build; anonymous; Chromium 153; 320/390px

**source**: src/components/auth-form.tsx:216; src/components/update-password-form.tsx:82; src/components/password-reset-form.tsx:18

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Auth uses local compact styles rather than shared mobile-responsive control sizes.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Align mobile field/button hit areas with the shared 44px baseline; keep visible focus and password semantics.

**consumers**: Login; Signup; password recovery

**effort**: S

**dependencies**: Preserve existing firm/role checks and server action contracts; no production fixtures may be mutated.

**acceptance**: At 320/390px every primary form control and password toggle has a 44px target, without overflow or label collision.

**verification**: public-browser.json and signup-invalid-320.png; 44px is a project target, not a blanket WCAG 2.2 AA minimum.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /forgot-password; /login; /reset-password; /signup

**component**: src/components/auth-form.tsx; src/components/update-password-form.tsx; src/components/password-reset-form.tsx

**evidence_ref**: evidence/public-browser.json; evidence/signup-invalid-320.png

## KO-UX-014 — Absent summary/confidence values can look like measured zero

**area**: GST detail; extraction confidence

**severity**: Medium

**impact**: GST detail formats null totals as ₹0 and missing issue counts as zero. Review confidence displays can similarly map absence to 0%.

**observed**: GST detail formats null totals as ₹0 and missing issue counts as zero. Review confidence displays can similarly map absence to 0%.

**intended**: Missing/unavailable financial evidence must remain distinguishable from a real zero or measured confidence.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx:51; src/app/(dashboard)/dashboard/page.tsx:323

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Formatting fallbacks erase data availability semantics.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Use explicit missing/unavailable labels and avoid green readiness derived from absent summary fields; keep legitimate numeric zeros.

**consumers**: GST detail; extraction confidence

**effort**: M

**dependencies**: Distinguish schema-nullable values from valid zero; accounting/readiness contract review.

**acceptance**: Missing summary, missing extraction and valid zero fixtures have visibly different states; no arithmetic is changed.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/gst-summary/[periodId]; /dashboard

**component**: src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx; src/app/(dashboard)/dashboard/page.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-015 — Client filtered empty state and status chooser are incomplete

**area**: Clients

**severity**: Medium

**impact**: A zero SQL search result enters “No clients yet”; the alternate page-slice empty condition is effectively unreachable. The status filter omits onboarding, although the create form supports it.

**observed**: A zero SQL search result enters “No clients yet”; the alternate page-slice empty condition is effectively unreachable. The status filter omits onboarding, although the create form supports it.

**intended**: An empty filtered result should help users clear filters, and supported statuses should be findable.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/clients/page.tsx:226; src/app/(dashboard)/dashboard/clients/page.tsx:55; src/components/client-form.tsx:166

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: The empty branch checks only returned data length and filter options drift from the domain form.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Distinguish no records from no matches using active filters; align allowed status choices and provide Clear filters.

**consumers**: Clients

**effort**: S

**dependencies**: Preserve existing firm/role checks and server action contracts; no production fixtures may be mutated.

**acceptance**: A known populated fixture searched with a nonmatch says no matches; onboarding records can be selected; genuine first-use state still offers setup.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /dashboard/clients/new; /dashboard/clients; /dashboard/clients/[clientId]/edit

**component**: src/app/(dashboard)/dashboard/clients/page.tsx; src/app/(dashboard)/dashboard/clients/page.tsx; src/components/client-form.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-016 — Detail and action returns lose queue context

**area**: Clients; Review; Ledger; Operations

**severity**: Medium

**impact**: Detail/back links and action redirects generally return to bare module paths, losing the originating page, filters and search.

**observed**: Detail/back links and action redirects generally return to bare module paths, losing the originating page, filters and search.

**intended**: Reviewers should return to their selected work slice after inspecting or acting on a record.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx:124; src/app/actions/review.ts:266; src/app/actions/operations.ts:47

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Originating URL state is not carried into detail/action navigation.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Preserve an allowlisted internal return context or restore list state; keep the explicit post-approval Ledger handoff destination unless product decides otherwise.

**consumers**: Clients; Review; Ledger; Operations

**effort**: M

**dependencies**: Small navigation policy decision for approval redirect and queue continuation.

**acceptance**: Opening/back from page 3 restores filters/page; action outcomes preserve useful context; external or unauthorized return URLs are rejected.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/operations; /dashboard/review-queue/[transactionId]

**component**: src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx; src/app/actions/review.ts; src/app/actions/operations.ts

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-017 — Firm identity block resembles a switcher without switching behavior

**area**: Dashboard shell

**severity**: Low

**impact**: Sidebar firm block has hover treatment and a chevron but is a static div; topbar repeats firm context. getFirmContext selects one active membership with limit(1).

**observed**: Sidebar firm block has hover treatment and a chevron but is a static div; topbar repeats firm context. getFirmContext selects one active membership with limit(1).

**intended**: Static identity should read as identity; a real switcher needs explicit selection and authorization semantics.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/components/dashboard-sidebar.tsx:117; src/lib/firms.ts:54

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Reference-style affordances are present before a workspace-selection feature exists.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Remove misleading switch affordance and clarify static identity; put true multi-firm selection in the product decision list.

**consumers**: Dashboard shell

**effort**: S

**dependencies**: Do not introduce selected-firm storage or multi-tenant switching as polish.

**acceptance**: The current workspace is legible in both sidebar states and mobile; no nonfunctional menu affordance remains.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /dashboard/audit-logs; /dashboard/clients; /dashboard/clients/[clientId]/edit; /dashboard/clients/[clientId]; /dashboard/exports; /dashboard/gst-summary; /dashboard/gst-summary/[periodId]; /dashboard/inbox; /dashboard/ledger; /dashboard/ledger/[entryId]/edit; /dashboard/ledger/[entryId]; /dashboard/operations; /dashboard; /dashboard/platform; /dashboard/reports; /dashboard/review-queue; /dashboard/review-queue/[transactionId]; /dashboard/settings

**component**: src/components/dashboard-sidebar.tsx; src/lib/firms.ts

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-018 — Fixed Review Queue columns are fragile around desktop breakpoints

**area**: Review Queue filters

**severity**: Medium

**impact**: The xl grid has seven tracks for eight children, with 810px of fixed tracks plus auto date and gaps before the flexible search field. Available content is reduced by a 256px sidebar.

**observed**: The xl grid has seven tracks for eight children, with 810px of fixed tracks plus auto date and gaps before the flexible search field. Available content is reduced by a 256px sidebar.

**intended**: Filters should retain usable input widths, logical order and reachable Apply/Clear controls.

**evidence**: CODE_INSPECTED; hosted measurements in authenticated-browser.json; BROWSER_VERIFIED

**environment**: Hosted khataone.vercel.app; Chromium153; existing account; detailed viewport evidence in authenticated-browser.json

**source**: src/app/(dashboard)/dashboard/review-queue/page.tsx:247

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Viewport breakpoints are used where available content width varies with the sidebar; fixed columns consume the input budget.

**confidence**: High for grid structure; exact rendered impact depends on hosted build and viewport

**candidateFix**: Use bounded flexible tracks or an intentional two-row toolbar; keep visual/tab order aligned and preserve filter behavior.

**consumers**: Review Queue filters

**effort**: S

**dependencies**: Preserve existing firm/role checks and server action contracts; no production fixtures may be mutated.

**acceptance**: At 1024/1280/1440 and both sidebar states, search/date fields remain usable with long labels and enlarged text; no page overflow.

**verification**: Review1280 scrollWidth1328; q input51px. Review1440 q71px;1920 q551px. Current deployed commit unverified.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /dashboard/review-queue

**component**: src/app/(dashboard)/dashboard/review-queue/page.tsx

**evidence_ref**: evidence/authenticated-browser.json

## KO-UX-019 — Audit screen omits the recorded before/after investigation path

**area**: Audit Logs; detail audit panels

**severity**: Medium

**impact**: The audit list displays actor/action/entity identifiers and time but not a navigable entity or expandable before/after metadata. Detail panels expose only short recent activity.

**observed**: The audit list displays actor/action/entity identifiers and time but not a navigable entity or expandable before/after metadata. Detail panels expose only short recent activity.

**intended**: A CA should trace a sensitive change to the source record and recorded change details.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/audit-logs/page.tsx:81; src/app/(dashboard)/dashboard/ledger/[entryId]/page.tsx:75

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Audited data exists in contracts but the investigation UI stops at index rows.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Expose safe structured metadata and allowlisted entity links, with redaction and independent authorization; combine with history pagination.

**consumers**: Audit Logs; detail audit panels

**effort**: M

**dependencies**: Metadata allowlist/redaction policy; no raw JSON dumps; coordinate KO-UX-009.

**acceptance**: A synthetic correction is traceable from Ledger to its audit and before/after values, while secret/internal metadata and foreign records remain inaccessible.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/audit-logs; /dashboard/ledger/[entryId]

**component**: src/app/(dashboard)/dashboard/audit-logs/page.tsx; src/app/(dashboard)/dashboard/ledger/[entryId]/page.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-020 — Landing claim exceeds review evidence currently presented

**area**: Landing feature copy

**severity**: Medium

**impact**: Public copy claims source context and confidence for every extracted field, while the current review UI exposes a record-level confidence and source-text rail.

**observed**: Public copy claims source context and confidence for every extracted field, while the current review UI exposes a record-level confidence and source-text rail.

**intended**: Marketing should describe implemented, verifiable review capabilities.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/page.tsx:63

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Proposed field-level evidence capability is described as existing behavior.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Narrow the claim to current record-level review support; label illustrative product samples; keep field-level evidence in the product decision list.

**consumers**: Landing feature copy

**effort**: S

**dependencies**: Product copy approval; do not invent metrics or direct GST filing capabilities.

**acceptance**: Every public workflow claim maps to an implemented route and observable behavior; synthetic sample records cannot be mistaken for live outcomes.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /

**component**: src/app/page.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-021 — Password-update success can be overwritten by a client exception

**area**: Reset password

**severity**: High

**impact**: After awaiting updateUser, the handler calls event.currentTarget.reset(). React clears currentTarget after dispatch; the catch can replace a successful update with a setup error.

**observed**: After awaiting updateUser, the handler calls event.currentTarget.reset(). React clears currentTarget after dispatch; the catch can replace a successful update with a setup error.

**intended**: Successful password changes must show an accurate result and a safe sign-in path.

**evidence**: CODE_INSPECTED; installed React DOM dispatcher clears event.currentTarget

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/components/update-password-form.tsx:53

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: The async continuation retains the event rather than the form element reference.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Capture the form element before awaiting; preserve real success and classify session/provider errors accurately.

**consumers**: Reset password

**effort**: S

**dependencies**: Isolated recovery-session/provider mock; real password mutation excluded.

**acceptance**: Mock a successful updateUser promise: the form resets and success persists; expired recovery sessions show an actionable error; never change a real password for verification.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /reset-password

**component**: src/components/update-password-form.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-022 — Overview prioritization does not consistently connect counts to exact work

**area**: Overview

**severity**: Medium

**impact**: Tiles are noninteractive despite hover treatment; worklist destinations are broad module routes. Intake label omits received records that the count includes; exports-this-month uses created_at rather than completed_at.

**observed**: Tiles are noninteractive despite hover treatment; worklist destinations are broad module routes. Intake label omits received records that the count includes; exports-this-month uses created_at rather than completed_at.

**intended**: Actionable counts need clear definitions and a route to the same underlying work slice.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/page.tsx:11; src/app/(dashboard)/dashboard/page.tsx:117; src/components/design-system.tsx:495

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Count definitions, descriptions and destination filters are maintained separately.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Define each count centrally and link supported filters; clarify created-versus-completed month semantics before changing queries. Make only truly interactive surfaces look clickable.

**consumers**: Overview

**effort**: M

**dependencies**: Product decision on monthly export metric; existing status-filter capabilities; preserve four worklist queues.

**acceptance**: Each signal documents status/date scope; destination returns the corresponding eligible records, and empty counts are neutral; no reference-image numbers are hardcoded.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/audit-logs; /dashboard/clients/new; /dashboard/clients; /dashboard/clients/[clientId]/edit; /dashboard/clients/[clientId]; /dashboard/exports; /dashboard/gst-summary; /dashboard/gst-summary/[periodId]; /dashboard/inbox; /dashboard/ledger; /dashboard/ledger/[entryId]/edit; /dashboard/ledger/[entryId]; /dashboard/operations; /dashboard; /dashboard/platform; /dashboard/reports; /dashboard/review-queue; /dashboard/review-queue/[transactionId]; /dashboard/settings; /onboarding; /

**component**: src/app/(dashboard)/dashboard/page.tsx; src/app/(dashboard)/dashboard/page.tsx; src/components/design-system.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-023 — Operational error truncation removes the recovery information

**area**: Operations; shared InlineAlert

**severity**: Medium

**impact**: safeErrorMessage slices the first 140 characters and InlineAlert truncates its text. Neither offers a complete safe detail view.

**observed**: safeErrorMessage slices the first 140 characters and InlineAlert truncates its text. Neither offers a complete safe detail view.

**intended**: An operator should understand the cause and next action without exposing raw provider payloads.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/operations/page.tsx:72; src/components/design-system.tsx:661

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Visual shortening substitutes for structured error classification and controlled disclosure.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Show a concise classified error plus an accessible safe detail/recovery route; retain private diagnostics server-side.

**consumers**: Operations; shared InlineAlert

**effort**: M

**dependencies**: Error taxonomy and safe-detail allowlist; no retry-policy changes.

**acceptance**: Long synthetic provider errors remain understandable on mobile and keyboard; tokens/URLs/payloads stay redacted; no failed backlog is automatically replayed.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/audit-logs; /dashboard/clients/new; /dashboard/clients; /dashboard/clients/[clientId]/edit; /dashboard/clients/[clientId]; /dashboard/exports; /dashboard/gst-summary; /dashboard/gst-summary/[periodId]; /dashboard/inbox; /dashboard/ledger; /dashboard/ledger/[entryId]/edit; /dashboard/ledger/[entryId]; /dashboard/operations; /dashboard; /dashboard/platform; /dashboard/reports; /dashboard/review-queue; /dashboard/review-queue/[transactionId]; /dashboard/settings; /onboarding; /

**component**: src/app/(dashboard)/dashboard/operations/page.tsx; src/components/design-system.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-024 — Hierarchy tokens diverge across public, auth and operational surfaces

**area**: Shared design system; shell; Overview

**severity**: Low

**impact**: Dashboard uses 56px header, 256/68px sidebar, 20/24px h1 and 14px panel headings, 6px controls and 8px cards. Reference candidates propose 64px/240–72px, 28px h1 and 12px panels. Auth also bypasses shared control sizes.

**observed**: Dashboard uses 56px header, 256/68px sidebar, 20/24px h1 and 14px panel headings, 6px controls and 8px cards. Reference candidates propose 64px/240–72px, 28px h1 and 12px panels. Auth also bypasses shared control sizes.

**intended**: Retain the calm professional direction while choosing a deliberate compact hierarchy, rather than copying image dimensions blindly.

**evidence**: CODE_INSPECTED; REFERENCE_OBSERVED; DOCUMENTED_REQUIREMENT

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/components/design-system.tsx:271; src/components/design-system.tsx:326; src/app/globals.css:46; src/app/(dashboard)/dashboard/layout.tsx:42

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Several historical design passes coexist; reference targets are proposals rather than an approved token update.

**confidence**: High for source dimensions; visual preference requires user decision

**candidateFix**: Approve a small density/token matrix for shell, operational panels and auth. Reuse primitives and keep numeric mono alignment; prefer content fit over fixed heights.

**consumers**: Shared design system; shell; Overview

**effort**: M

**dependencies**: Approve candidate density values; existing overview concepts remain unapproved.

**acceptance**: Document accepted deviations and compare actual responsive renders before changing shared tokens; all consumers retain readable labels and action priority.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Shared or multi-route UI change requiring coordinated states and regression checks.

**routes**: /dashboard/audit-logs; /dashboard/clients/new; /dashboard/clients; /dashboard/clients/[clientId]/edit; /dashboard/clients/[clientId]; /dashboard/exports; /dashboard/gst-summary; /dashboard/gst-summary/[periodId]; /dashboard/inbox; /dashboard/ledger; /dashboard/ledger/[entryId]/edit; /dashboard/ledger/[entryId]; /dashboard/operations; /dashboard; /dashboard/platform; /dashboard/reports; /dashboard/review-queue; /dashboard/review-queue/[transactionId]; /dashboard/settings; /onboarding; /

**component**: src/components/design-system.tsx; src/components/design-system.tsx; src/app/globals.css; src/app/(dashboard)/dashboard/layout.tsx

**evidence_ref**: evidence/source-inventory.json; cited source

## KO-UX-025 — GST detail pushes the whole mobile page wider than the viewport

**area**: GST period detail

**severity**: High

**impact**: Hosted period detail measured a 998px document at a 320px viewport; the page-level overflow is outside the intentional table scroll region.

**observed**: Hosted period detail measured a 998px document at a 320px viewport; the page-level overflow is outside the intentional table scroll region.

**intended**: Financial columns must remain reachable inside a bounded scroll region, without widening the page.

**evidence**: BROWSER_VERIFIED; CODE_INSPECTED; HYPOTHESIS cause

**environment**: Hosted khataone.vercel.app; Chromium 153; 320×900; signed-in existing account; expanded sidebar preference (hidden at mobile)

**source**: src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx:183; src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx:191; src/components/design-system.tsx:311

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Likely automatic minimum sizing of grid children around the 980px source table; source structure matches the measured failure, but exact CSS attribution remains an inference.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Constrain grid tracks/items and nested table wrappers with appropriate min-width:0/max-width; preserve horizontal table access and numeric columns.

**consumers**: GST period detail

**effort**: S

**dependencies**: Confirm minimum-size chain in local synthetic populated period; do not remove essential financial columns.

**acceptance**: Populated GST source/audit tables at 320/390/768 have document scrollWidth no larger than viewport+1; keyboard table scrolling reaches all columns.

**verification**: authenticated-browser.json: GST detail width 320, scrollWidth 998; no business mutations.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /dashboard/audit-logs; /dashboard/clients/new; /dashboard/clients; /dashboard/clients/[clientId]/edit; /dashboard/clients/[clientId]; /dashboard/exports; /dashboard/gst-summary; /dashboard/gst-summary/[periodId]; /dashboard/inbox; /dashboard/ledger; /dashboard/ledger/[entryId]/edit; /dashboard/ledger/[entryId]; /dashboard/operations; /dashboard; /dashboard/platform; /dashboard/reports; /dashboard/review-queue; /dashboard/review-queue/[transactionId]; /dashboard/settings; /onboarding; /

**component**: src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx; src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx; src/components/design-system.tsx

**evidence_ref**: evidence/authenticated-browser.json

## KO-UX-026 — Mobile sign-out target is tall enough but too narrow for the chosen baseline

**area**: Dashboard shell

**severity**: Medium

**impact**: Hosted dashboard sign-out measures 32×44px at mobile widths. The hidden text leaves icon16 plus horizontal padding16.

**observed**: Hosted dashboard sign-out measures 32×44px at mobile widths. The hidden text leaves icon16 plus horizontal padding16.

**intended**: The project mobile target is at least 44px in both dimensions.

**evidence**: BROWSER_VERIFIED; CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/layout.tsx:57

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: Shared height enlargement does not guarantee an icon-only minimum width.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Give icon-only shell buttons an explicit mobile minimum width while retaining their accessible names and compact desktop treatment.

**consumers**: Dashboard shell

**effort**: S

**dependencies**: Shared icon-button sizing; 44px is a project target, not a blanket AA failure.

**acceptance**: Sign-out measures at least44×44 at320/390; menu and header fit long workspace names and enlarged text.

**verification**: authenticated-browser.json small controls across every narrow dashboard sample; sign-out was not activated.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Local component/style or state correction with bounded consumers.

**routes**: /dashboard/*

**component**: src/app/(dashboard)/dashboard/layout.tsx

**evidence_ref**: evidence/authenticated-browser.json

## KO-UX-027 — GST source list is not the snapshot population used for its totals

**area**: GST period detail; summary provenance

**severity**: High

**impact**: The saved summary is generated from approved transactions, but the detail page lists current transactions in the date/client range without an approved-status predicate or snapshot membership.

**observed**: The saved summary is generated from approved transactions, but the detail page lists current transactions in the date/client range without an approved-status predicate or snapshot membership.

**intended**: Displayed totals need an explicit explanation of which source population and generation time they represent.

**evidence**: CODE_INSPECTED

**environment**: Local checkout main @ 59b903f; hosted mutation behavior not exercised

**source**: src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx:93; src/app/actions/gst.ts:53

**reproduction**: Inspect the cited route/component under the described condition; reproduce with authorized synthetic fixtures before implementation acceptance.

**cause**: A persisted generation snapshot is presented alongside a live all-status query under a source heading.

**confidence**: High for source behavior; runtime state not induced

**candidateFix**: Distinguish generation snapshot evidence, current approved sources and unresolved blockers; label generation time and scope. Do not silently change totals or accounting rules.

**consumers**: GST period detail; summary provenance

**effort**: L

**dependencies**: Product/accounting decision about snapshot provenance; inspect current metadata before proposing persistence; no schema or financial rewrite in polish.

**acceptance**: An unresolved draft and a post-generation approval are clearly distinguished from the saved snapshot inputs; users can trace each source/blocker without assuming list totals reconcile automatically.

**verification**: Source verified; end-to-end mutation/failure-state verification BLOCKED without disposable fixtures.

**requirement**: docs/PRD.md (CA-reviewed, traceable operations); docs/Design.md and docs/UI-UX-Design-Brief.md (dense, accessible operational UI); supplied diagnosis sections 6–10; specific intended behavior stated above

**effortRationale**: Crosses query/workflow/provenance contracts and requires representative regression fixtures.

**routes**: /dashboard/gst-summary/[periodId]

**component**: src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx; src/app/actions/gst.ts

**evidence_ref**: evidence/source-inventory.json; cited source


## Impact/effort review order

1. Reproduce and address core meaning/workflow blockers001–005,021,025,027 with the indicated fixtures and contracts.
2. Contained fixes:010–013,015,017–018,020,025–026; shared consumers and measured failures first. Small effort does not reduce accessibility severity.
3. Coordinate structural work006–009,014,016,019,022–023 with query/state/provenance decisions.
4. Decide density/token proposal024 only after operational behavior and measurable reflow are stable.

Retain existing request-scoped firm context, role/RLS guards, private storage, raw/source evidence, posted immutability, atomic handoff/audit, approved-source GST preparation, bounded queries, real module inventory, mobile dialog/skip focus and accurate page-scoped captions. No reference-only search, badges, trends, avatars or filing claims enter this checklist.
