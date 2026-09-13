# Decision-ready implementation inputs

This is not the implementation plan and applies no fixes. The diagnosis identifies27 canonical findings in FINDINGS.md/FINDINGS.csv. Keep their IDs when a separate planning phase assigns work.

## Priority inputs

| Scope | Findings | Implicated files / reuse | Decision and acceptance boundary |
| --- | --- | --- | --- |
| Core review correctness |001,002,003 | review-queue pages, TransactionReviewForm, review actions; existing controlled RPCs | Multi-page fixture search, unsaved edit interlock, private evidence before decision; preserve posted immutability/atomic handoff |
| Date and source meaning |004,005,014,027 | GstSummaryForm, ExportForm, format.ts, GST detail, query consumers | Agree date-only/IST boundaries, unknown-vs-zero and snapshot-source definition; no tax formula rewrite |
| Proven mobile failures |018,025,026 | review filter grid, GST PageBody/grid wrappers, dashboard sign-out | Fix containing width/minimum size; retain financial columns; verify measured1280/320 failures |
| Shared accessibility |010,011,012,013 | StatusChip, FieldError/Input, domain forms, DashboardNav, auth forms | Darker success text, label/error contract, tooltip dismissal,44px touch targets; screen-reader/zoom checks |
| Action transparency |006,007,008,016,021 | role capability presentation, plain action forms, ExportForm/history, return links, UpdatePasswordForm | Preserve server guards; accurate pending/error/success, refresh, safe return context; mock password success |
| Operational investigation |009,019,023 | PaginationControls, Audit, Operations, Exports/GST selectors | Bounded complete access, allowlisted metadata/error details; no raw payload display |
| Clarity/polish |015,017,020,022,024 | Clients empty/filter UI, shell identity, landing copy, Overview, shared tokens | Agree literal count definitions and density; no fake menus/trends/staff |

## UI-only versus dependent work

Bounded UI candidates: control hit areas, accessible clarification label, error ID wiring, tooltip Escape, responsive grid containment, success foreground token, truthful static identity/marketing copy and password event reference handling. These still need focused verification; they are not permission to change source in this audit.

Read/query/workflow-dependent candidates: full-result search/pagination, count/error semantics, permission-aware forms, dirty review decisions, private source preview, asynchronous export refresh, audit metadata navigation, snapshot provenance and date filters. Existing backend safeguards must be reviewed with the later changes. Any new RPC, schema field, selected firm state, source access route or worker behavior needs a documented technical/product decision.

## Open product choices

- Keep compact56px shell/256–68px sidebar/8px cards, or accept selected reference candidate values? Validate operational density before a global change.
- Is full mobile review/edit an intended v1 workflow, or primarily triage? Current routes expose full forms; do not silently remove actions.
- Preserve separate Save and Approve with a dirty-state interlock, or deliberately define a combined transaction? Default candidate preserves separate explicit save.
- Should post-approval navigation continue to Ledger, return to the filtered queue, or offer both? Preserve current handoff until decided.
- Does “exports this month” mean creation or completion month, and in which zone?
- Which date/source population explains a saved GST snapshot? How should current unresolved or subsequently approved records appear?
- Is a correction note mandatory? Are negative net amounts described as payable/credit? These are accounting/product decisions, not CSS choices.
- What sanitized metadata can audit/error drilldown expose, and to which existing roles?
- Does v1 need staff assignment, staff invites, real firm switching or a source document library? Their absence is not solved by copying reference decoration.

## Reference-only backlog, not UI defects

Global search/CtrlK, notifications, help center, profile menu, real firm picker, greeting/date ornament, metric trends, queue staff avatars, update timestamps, priority sorter and all-queues destination. Each requires a real data/action/access contract before UI. Never carry over sample13/1/0,+5/−2, notification3 or initials. Keep actual modules even where the screenshot omits them.

## Proposed acceptance fixture set

Use isolated non-production fixtures with two firms and owner/admin/staff/viewer/revoked users; no actual client records. Include51+ review/inbox rows with matches only beyond first page, long names/GSTINs/invoices, missing/zero values, low-confidence/risky drafts, posted records and corrected handoffs. Include image/PDF/audio/text originals and unavailable/private-denied media. Include generated GST snapshots plus later approvals, boundary dates and historical periods beyond picker limits; queued/completed/failed exports and jobs; structured safe audit metadata and intentionally failing read/mutation responses.

Acceptance should prove: displayed values match the selected source/status/date scope; zero is not unavailable; unsaved edits cannot be accidentally approved; posted records stay immutable; action/audit behavior remains atomic/idempotent where currently designed; private downloads remain protected; errors preserve useful input and offer recovery; true browser zoom and keyboard/screen-reader flow work; page width stays bounded at all seven widths while tables remain scrollable. Do not auto-approve, replay jobs, relax RLS or introduce direct filing.

## Retain as-is contracts

Approved stack, module IA, WhatsApp-first intake, draft AI output, original/raw evidence retention, reviewer-controlled approval, ledger handoff correction semantics, atomic controlled RPCs, firm_id/RLS, private storage/downloads, truthful GST preparation boundary, planned integrations, shared primitives, scoped pagination, request-cached firm context and independent read concurrency. Existing uncommitted Overview design work belongs to the user and was not overwritten.

## Verification gates for later work

Run appropriate existing source/action/format tests plus meaningful new fixture checks for the changed behavior; lint/typecheck/build. Repeat the exact measured overflow/keyboard failures, then broader affected consumer coverage. Do not substitute source-regex tests for browser or tenant tests. Do not promote this audit’s one-account read observations into mutation/security/capacity approval.
