# KhataOne UI/UX diagnosis — 2026-09-13

The console has a usable shared foundation and many earlier polish fixes already exist. Its most consequential gaps concern trustworthy review decisions, source evidence, complete filtering, date/data meaning, and two reproduced responsive failures. Copying the reference screenshot would not resolve these workflow problems.

This is an audit-only package:27 findings,8 Markdown reports and matching CSV, plus sanitized evidence/scripts. No application fixes, database changes, exports, approvals, job retries, WhatsApp messages, deployment or commits were performed. User supplied credentials authorized a later read-only hosted pass, superseding the earlier public-only instruction; credentials are not included.

## Run and evidence boundaries

- Local branch main; commit59b903fa696622dc81e5cfb4df9d37042c46fc7d. Initial dirty files: docs/Tracker.md; untracked docs/design-reviews/ and khataone_overview_refined.png. Baseline341 existing files hashed in evidence/baseline.json.
- Public browser: isolated local Next dev at127.0.0.1:3105, integration configuration blank in child environment, external/write requests blocked;56 route/viewport samples.
- Hosted browser: current documented https://khataone.vercel.app, read-only configured account, 97 main samples plus 10 follow-up samples and a separate 39-observation screenshot pass. All19 dashboard screen layouts were opened;38 masked screenshots cover narrow/desktop layouts. The legacy configured khata-one-azure domain returned404. Actual hosted commit/database migration state remains unverified. Follow-up role: owner.
- Anonymous public8 routes and all19 dashboard screen routes were source-inspected; onboarding source was inspected, but its create-workspace state was not entered with a new account. Exact screen inventory in SYSTEM_UI_MAP.md.
- Evidence labels: CODE_INSPECTED (checkout), BROWSER_VERIFIED (named environment), DOCUMENTED_REQUIREMENT, REFERENCE_OBSERVED, HYPOTHESIS (cause/inference), BLOCKED (missing safe state/input), NOT_APPLICABLE. One label never substitutes for another.

## Highest-impact findings

- **KO-UX-001 — Filters run after pagination and can conceal matching records**: Review search/document/risk and Inbox search filter only the fetched first 50 rows. An empty filtered page suppresses pagination even when the lookahead says later rows exist.
- **KO-UX-002 — Approval ignores unsaved field edits**: The edit form and decision forms are independent. Approve submits transaction_id, while edited uncontrolled fields remain only in the separate Save form.
- **KO-UX-003 — Original document is unavailable beside extracted fields**: The evidence rail renders source_text in a pre block or a storage-path fallback. No private image/PDF/audio preview or original-file link is rendered.
- **KO-UX-004 — Date defaults and date filters disagree with India calendar days**: Local midnight converted through toISOString yields previous-day month boundaries in Asia/Kolkata. Audit timestamps are filtered using UTC midnight although displayed in India time.
- **KO-UX-005 — Read failures can masquerade as zero workload or missing records**: Several count results use count ?? 0 without handling their errors; detail .single() errors are discarded before notFound. Secondary query failures can appear as empty histories.
- **KO-UX-021 — Password-update success can be overwritten by a client exception**: After awaiting updateUser, the handler calls event.currentTarget.reset(). React clears currentTarget after dispatch; the catch can replace a successful update with a setup error.
- **KO-UX-025 — GST detail pushes the whole mobile page wider than the viewport**: Hosted period detail measured a 998px document at a 320px viewport; the page-level overflow is outside the intentional table scroll region.
- **KO-UX-027 — GST source list is not the snapshot population used for its totals**: The saved summary is generated from approved transactions, but the detail page lists current transactions in the date/client range without an approved-status predicate or snapshot membership.

Hosted repro highlights: Review Queue1280px viewport produced1328px document width and51px search field; GST detail320px produced998px document width. Clarification textarea was unnamed. Collapsed tooltip stayed open after Escape. Dashboard skip navigation and mobile-menu Escape/focus return passed. Source date expressions reproduced previous-day September boundaries in India; this did not generate a GST summary.

## Artifact index

| File | Contents |
| --- | --- |
| [SYSTEM_UI_MAP.md](SYSTEM_UI_MAP.md) |28 screen routes, shell/state/data/action contracts, route handlers, current stack |
| [COMPONENT_DESIGN_SYSTEM_AUDIT.md](COMPONENT_DESIGN_SYSTEM_AUDIT.md) |18 component files, direct consumers, tokens, shell assessments, reference feature truth |
| [UI_UX_FLOW_AUDIT.md](UI_UX_FLOW_AUDIT.md) |Separate visual and task flows, state coverage, recovery and status meaning |
| [RESPONSIVE_ACCESSIBILITY_AUDIT.md](RESPONSIVE_ACCESSIBILITY_AUDIT.md) |Viewport matrix, measured failures, keyboard/contrast evidence and limits |
| [PERFORMANCE_UX_BASELINE.md](PERFORMANCE_UX_BASELINE.md) |Current observations versus historical latency; readiness definition and uncertainty |
| [FINDINGS.md](FINDINGS.md) |Canonical detailed findings and candidate acceptance tests |
| [FINDINGS.csv](FINDINGS.csv) |Matching machine-readable rows and IDs |
| [IMPLEMENTATION_INPUTS.md](IMPLEMENTATION_INPUTS.md) |Impacted files, decisions, reuse and regression inputs; not an implementation plan |
| evidence/ |Version/Git baselines, checks/build, source inventory, browser JSON, public and redacted Overview images, standalone diagnostics |

## Inputs and document coverage

Reviewed operating/product requirements: AGENTS.md, docs/rules.md, BRD.md, CRD.md (Creative Requirements Document), PRD.md, TRD.md, Backend-Schema.md, App-Flow.md, Implementation-Plan.md, Design.md, UI-UX-Design-Brief.md, Tracker.md and Environment-Mapping.md. Reviewed audit/release context: Dashboard-UI-UX-Audit-Implementation-Plan.md, Live-Website-UI-UX-Audit-Implementation-Plan.md, security-hardening-plan.md, Production-Runbook.md, RLS-Verification-Plan.md, Performance-Architecture-Brief.md, performance/PERFORMANCE_DIAGNOSIS.md, performance/PERFORMANCE_DEPLOYMENT_RUNBOOK.md and performance/dashboard-latency-results.md. Current-focus entries take precedence over old chronological status notes; read-only UI inspection is not migration/deployment verification. Large historical logs were read in chunks; attached raw timing/SQL/production-hardening artifacts were not all independently re-audited.

Reviewed existing user Overview concepts in docs/design-reviews/overview. Supplied diagnosis document at D:/Per_Docs/KhataOne_UI_UX_Diagnosis_Codex_Prompt.md was treated as task instructions only after the user's proceed clarification. Inline screenshot visually accessible at1835×857; original binary filename/file identity unavailable, so exact pixel comparison is BLOCKED. The root PNG is a different reference and existing user work. No generated reference element was assumed to be live data or approved scope.

Used product-design and ui-ux-pro-max skill guidance. Project-specific khataone skills named by AGENTS were not located in the available skill paths; no claim is made that they were applied. Installed Next docs were consulted for current layout/page boundaries; no framework API implementation was changed.

## Verification and limitations

Lint and TypeScript passed;7 inspected dashboard regression scripts passed. Isolated production build passed (integration values disabled). Evidence/checks.json and build.json record outcomes. Most existing dashboard checks assert source patterns; they do not prove authenticated mutations. Public invalid signup/password toggle/menu behavior and hosted normal navigation/keyboard checks were exercised. The first form-follow-up sign-in timed out without an invalid-credentials message; a later fresh-browser attempt completed normally. This is not proof that intermittent sign-in/navigation stalls are resolved. Final source-scope proof is in evidence/final-verification.json: all341 baseline file hashes unchanged, no unexpected addition outside the audit directory, application-source change count0.

Not tested: business writes, real password changes, lead/email submissions, private files/downloads, paid providers, jobs/webhooks, two-firm/viewer/revoked membership scenarios, production query plans, failure injection, long/multi-page synthetic datasets, native devices, screen readers, true browser zoom, capacity and p95. CSS zoom stress is labeled accordingly. Hosted deployment parity is an unverified assumption and must be confirmed before translating hosted observations into a release claim.

Tracker was read but not edited: the user-authorized diagnosis restricts changes to this audit directory and takes precedence over the general Tracker-update workflow. This package is the audit status record. No application-wide pass or production-readiness claim is made.
