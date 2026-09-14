# UI Consistency Implementation Plan

Updated: 2026-09-14.
Basis: [UI consistency audit](UI_CONSISTENCY_AUDIT.md).
Status: **Implementation in progress. Shared typography/icon, fields/feedback, shell overlay and Phase 6 consumer-cleanup slices are locally verified. Phase 7 public rendered browser verification passed; authenticated dashboard browser evidence is explicitly blocked until an isolated local test user/storage state is available.**

## Objective and scope

Standardize typography, functional icons, theme usage and interaction states through KhataOne's existing shared design system. Preserve the brand, professional CA workflows, page structure and responsive layout.

This document replaces the earlier version of this plan. Existing shared primitives remain useful foundations, but their previous implementation does not close the new audit. Earlier three-interface-font and context-dependent functional-icon-size recommendations are superseded for this workstream.

Cover all 28 routes discovered in the audit: public pages, authentication, onboarding, dashboard lists/details, create/edit forms, navigation, tables, cards, footers and every implemented overlay/state. Rediscover routes before implementation to account for subsequent changes.

Backend code, Supabase queries/schema/RLS, server actions, permissions, financial calculations, auth behavior and search destinations are outside the change scope. No new libraries, palette, dark mode, toast system or confirmation workflow is required.

## Target standards

| Area | Implementation direction | Preserve / exception |
| --- | --- | --- |
| Primary typography | Existing Manrope for app-owned headings, body, controls, navigation, tables and metadata | Current brand wordmark; external documents and generated outputs are separate surfaces |
| Numeric typography | Manrope with tabular numerals for numeric roles | Right alignment, Indian formatting, precision and identifier copy/paste behavior |
| Type scale | Named shared roles based on the audit's scale; explicit size, line-height, weight, tracking and casing | Current hierarchy and 16px mobile inputs; review readability of small secondary labels |
| Weight/style | 400 body, 500 controls/emphasis, 600 headings, restricted named 700 emphasis; normal style and zero tracking by default | Necessary glyph fallback for unsupported scripts; no unsupported multilingual claims |
| Functional icons | Existing Lucide outline, shared 16px glyph and strokeWidth 2; consistent action mapping | Brand assets, external illustrations and browser-native controls; decorative exceptions documented |
| Control targets | Shared accessible icon controls; 44px mobile/touch targets | Compact desktop rhythm; glyph size is independent of hit area |
| Theme | Existing globals.css palette, Tailwind mappings and shared component recipes | Green/paper/saffron palette and semantic status distinctions |
| Layout | Retain sidebar widths, header height, square outer shell and existing breakpoints | Record current profile/brand/overlay radius exceptions |

The audit holds the detailed typography scale and evidence. This plan defines sequencing and completion gates rather than duplicating the inventory.

## Implementation approach

Before each phase, inspect the current implementation and trace the complete affected flow: route/layout, component consumers, styles, state transitions, keyboard behavior and existing tests. Confirm the smallest correct integration point; do not assume the audit baseline is unchanged.

Extend existing primitives rather than creating parallel systems. Keep interactive client boundaries narrow when extracting dialog/disclosure behavior. Migrate consumers in reviewable groups with meaningful regression checks. Avoid universal SVG selectors, blanket overrides, extensive !important rules and duplicated page-specific fixes.

## Phases and completion gates

| Phase | Work and integration points | Audit IDs | Exit gate |
| --- | --- | --- | --- |
| 1. Align standards and baseline | Reconcile Design.md, UI-UX-Design-Brief.md, rules.md and relevant AGENTS.md typography guidance with the latest direction. Confirm routes, existing primitives, baseline screenshots and exceptions. | T01, T02, T03, I01, H03 | One recorded standard; no conflicting active monospace/icon instructions; missing verification clearly recorded |
| 2. Shared typography foundation | Update root font usage, globals.css, tailwind.config.ts and design-system.tsx text recipes. Migrate headings, .num, table metadata, counts and labels to named Manrope roles. Keep brand typography separate. | T01, T02, T03 | Representative consumers use shared roles; numeric alignment, glyph fallback and layout bounds verified |
| 3. Shared icons and controls | Add or extend a Lucide Icon adapter and icon-button primitives. Normalize size/stroke, names, decorative handling, focus, disabled treatment and targets. Reuse a presentation-only action/destination icon map. | I01, I02, A02 | Functional icons match the standard; targets, destinations and accessible names preserved |
| 4. Shared theme, fields and feedback | Centralize semantic surfaces, focus, elevation and placeholder styles. Extend Input/Select/Textarea, FieldError and FormMessage; migrate auth/recovery duplication. Share badge/alert tone definitions with explicit variants. | H01, H02, H03, H04 | Consistent invalid/focused/disabled/pending feedback; normal-size text and placeholders meet 4.5:1 contrast on actual surfaces |
| 5. Existing overlays and shell interactions | Reuse the mobile menu's native-dialog pattern for a shared dialog boundary. Integrate search; normalize activity disclosure/menu semantics, selection announcement, tooltip portal styling and focus return. | A01, A02, H03 | Search contains focus, makes background inert and handles short screens; dismissal restores focus; activity and portals are keyboard-usable and themed |
| 6. Complete migration and cleanup | Apply shared foundations to remaining routes and states. Remove proven unused style recipes and obsolete font consumers/imports after reference checks. | T03, I01, H01, H02, H03, C01 | Every route accounted for; no unexplained local overrides; required assets/output fonts preserved |
| 7. Regression verification and handoff | Run relevant tests, lint/typecheck/build and full browser matrix with route/state/role evidence. Separate code completion from hosted/manual verification. | V01 and all findings | Each finding has evidence or explicit gaps; no whole-app pass from source checks alone |

Phases 2-5 build foundations and migrate representative consumers. Phase 6 completes coverage rather than repeating those refactors. Address contrast and accessibility defects within their owning phases before final visual sign-off. Check isolated fixture availability in Phase 1 without blocking independent source work.

## Consumer migration order

1. **Shared foundations and persistent shell:** text/theme tokens, buttons/fields, sidebar, topbar, search, activity, mobile drawer and collapsed-nav tooltips.
2. **Public and account flows:** landing, contact, privacy, terms, login, signup, forgot/reset password and onboarding; include navigation, footer, FAQ and validation states.
3. **Operational lists:** overview, inbox, review queue, clients, ledger, GST summary, reports, exports, audit logs, operations, settings and platform.
4. **Details and forms:** client create/detail/edit, review workspace, ledger detail/edit, GST period detail, export/GST forms and evidence wrappers.
5. **Cross-cutting states:** loading, empty, filtered-empty, error, read-only, selected, disabled, pending and success/warning feedback.

Use compatible exports or temporary adapters where they reduce migration risk; remove them once references are migrated. Keep the brand image asset separate from app typography. Do not claim performance improvements without measurement.

## Verification strategy

| Layer | Required checks |
| --- | --- |
| Source/integration | All routes and consumers inventoried; imports resolve; no backend/action/schema changes; explicit exceptions |
| Typography/glyphs | Computed and actual fonts after loading; rupee, punctuation, long identifiers, supported-script samples and tabular alignment; no failed-font fallback |
| Icons/accessibility | 16px/2 stroke functional glyphs; mobile targets; accessible names, decorative handling, focus, disabled appearance and selection announcements |
| Theme/states | Composited contrast, semantic statuses, fields/validation, portals, hover/focus/active/selected/pending/error/success |
| Responsive | 1440x900, 834x900, 390x844; 320px and 200% zoom stress; short landscape/virtual-keyboard overlays; contained table scrolling |
| Behavior | Navigation/search/filter routing, password visibility, validation timing, sidebar persistence, dialog dismissal/focus return and permission affordances |
| Browser coverage | Chromium plus Firefox/WebKit where available; record native date/select/media limitations and real-device gaps |

Reuse existing verification tools and add focused behavioral tests when shared interaction logic changes. Run applicable checks after each code phase; final local validation includes:

```text
npm run test:dashboard-shared-components
npm run test:dashboard-navigation-shell
npm run test:deliberate-density
npm run test:dashboard-responsive-harness
npm run test:accessibility-contracts
npm run test:responsive-containment
npm run typecheck
npm run lint
npm run build
git diff --check
```

Inspect tests before updating them: some may encode superseded font/icon rules. Update those contracts without weakening unrelated guards. Include relevant auth, role, action-outcome and review-workspace checks when affected. Command success does not establish visual or hosted correctness.

Authenticated verification requires an authorized isolated workspace and fixture IDs for detail routes and owner/admin/staff/viewer states. Exercise account or financial mutations only with disposable fixtures. Without fixtures, continue independent implementation/public verification and mark authenticated checks **UNVERIFIED**. Manual production review can supply visual evidence; it does not prove untested roles or workflow states.

## Tracking and delivery

Deliver small phase-based changes explaining what changed, why and how it was verified. Update Tracker.md after meaningful work and maintain finding-level closure evidence against the audit IDs. Preserve the original audit as the diagnosis baseline.

| Phase | Current status |
| --- | --- |
| 1. Standards and baseline alignment | Locally implemented. Rules, design brief and agent guidance now match the one-primary-font/numeric-role decision. |
| 2. Typography | Partially implemented and locally verified. Root font loading uses Manrope only and shared numeric roles preserve tabular figures; remaining route-level copy/style drift belongs to Phase 6. |
| 3. Icons and controls | Partially implemented and locally verified. Shared functional icon constants are in place and representative shell/public consumers migrated; remaining page-level action icons belong to Phase 6. |
| 4. Theme, fields and feedback | Partially implemented and locally verified. Placeholder contrast, shared command surface, shared invalid control states, auth/recovery control recipes, shared feedback tones, query-error alert presentation, review dirty-state warning and shared status badge tones are tightened; broader alert cleanup remains open for Phase 6. |
| 5. Overlays | Locally implemented for the shared shell. Topbar search focus return, Tab containment, background scroll lock and selected-target state are fixed; activity menu now has labeled menu semantics, Escape focus return, Arrow/Home/End item movement, themed surface styling and the Operations icon aligned with the sidebar. Authenticated browser evidence remains open. |
| 6. Consumer migration and cleanup | Source cleanup for known small shared-component drift is locally verified. Export helper icons, retry/refresh actions, landing CTA arrows, auth visibility/back/check icons, public home-logo links, document-evidence external links/fallback panels, auth side-panel surfaces, numeric class names, landing demo panel title, status chips, ledger active-filter badges and review dirty-state warnings now reuse shared recipes. Broader rendered route/state coverage remains open for Phase 7. |
| 7. Verification and handoff | Started with local and live rendered browser evidence. Public landing/auth routes passed the Chromium matrix at 390px and 1440px with zero failures and zero console errors against both the local candidate and `https://khataone.vercel.app`; 105 authenticated dashboard route/viewport checks remain recorded as blocked because no isolated auth storage state/test user is available in this workspace. Evidence: `docs/audits/ui-ux/2026-09-13-diagnosis/evidence/isolated-verification/browser-matrix.json` and `docs/audits/ui-ux/2026-09-13-diagnosis/evidence/live-public-readiness/browser-matrix.json`. |

Track **implementation complete**, **locally verified** and **hosted/manually verified** separately. Code changes can finish while external verification remains open; do not report that phase as fully verified.

Keep each phase focused on shared presentation and its consumers so it is reviewable and reversible. If a regression appears, revert the affected phase change and investigate its shared integration point rather than adding isolated page overrides. Publishing/deployment is a separate execution step, not part of creating this plan.

## Final acceptance

All app-owned text uses the agreed primary family and role scale; functional icons follow one standard; shared theme/state recipes cover every discovered consumer. Keyboard accessibility, numeric readability, glyph support and responsive layouts pass the audit's regression criteria. All 13 audit IDs have a resolution and verification record, including explicit exceptions and any remaining inaccessible areas. Unverified cases prevent an unconditional whole-application consistency claim.

This document remains the implementation and verification tracker for the UI consistency workstream as shared slices move from planned to locally verified.
