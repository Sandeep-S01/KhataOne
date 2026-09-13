# Component and design-system audit

Evidence: current checkout source, anonymous local browser samples, hosted read-only measurements and redacted Overview screenshots. Reference candidates are proposals; dimensions below are CSS/source values, not pixel measurements from the generated reference.

## Component inventory and actual consumers

| Component file | Boundary/state | Direct importing consumers |
| --- | --- | --- |
| src/components/auth-form.tsx | Client: useState, useActionState | src/app/(auth)/login/page.tsx; src/app/(auth)/signup/page.tsx |
| src/components/brand-logo.tsx | Server-compatible presentational | src/app/(auth)/forgot-password/page.tsx; src/app/(auth)/login/page.tsx; src/app/(auth)/reset-password/page.tsx; src/app/(auth)/signup/page.tsx; src/app/onboarding/page.tsx; src/app/page.tsx; src/components/dashboard-mobile-menu.tsx; src/components/dashboard-sidebar.tsx; src/components/landing-navigation.tsx; src/components/public-page-shell.tsx |
| src/components/client-form.tsx | Client: useActionState | src/app/(dashboard)/dashboard/clients/new/page.tsx; src/app/(dashboard)/dashboard/clients/[clientId]/edit/page.tsx |
| src/components/dashboard-mobile-menu.tsx | Client: useState | src/app/(dashboard)/dashboard/layout.tsx |
| src/components/dashboard-nav.tsx | Client: useState, usePathname | src/components/dashboard-mobile-menu.tsx; src/components/dashboard-sidebar.tsx |
| src/components/dashboard-sidebar.tsx | Client: useSyncExternalStore, useEffect | src/app/(dashboard)/dashboard/layout.tsx |
| src/components/design-system.tsx | Server-compatible presentational | src/app/(dashboard)/dashboard/audit-logs/page.tsx; src/app/(dashboard)/dashboard/clients/new/page.tsx; src/app/(dashboard)/dashboard/clients/page.tsx; src/app/(dashboard)/dashboard/clients/[clientId]/edit/page.tsx; src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx; src/app/(dashboard)/dashboard/exports/page.tsx; src/app/(dashboard)/dashboard/gst-summary/page.tsx; src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx; src/app/(dashboard)/dashboard/inbox/page.tsx; src/app/(dashboard)/dashboard/layout.tsx; src/app/(dashboard)/dashboard/ledger/page.tsx; src/app/(dashboard)/dashboard/ledger/[entryId]/edit/page.tsx; src/app/(dashboard)/dashboard/ledger/[entryId]/page.tsx; src/app/(dashboard)/dashboard/loading.tsx; src/app/(dashboard)/dashboard/operations/page.tsx; src/app/(dashboard)/dashboard/page.tsx; src/app/(dashboard)/dashboard/platform/page.tsx; src/app/(dashboard)/dashboard/reports/page.tsx; src/app/(dashboard)/dashboard/review-queue/page.tsx; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx; src/app/(dashboard)/dashboard/settings/page.tsx; src/app/(dashboard)/error.tsx; src/app/onboarding/page.tsx; src/app/page.tsx; src/components/auth-form.tsx; src/components/client-form.tsx; src/components/export-form.tsx; src/components/firm-onboarding-form.tsx; src/components/gst-summary-form.tsx; src/components/lead-capture-form.tsx; src/components/ledger-entry-form.tsx; src/components/password-reset-form.tsx; src/components/transaction-review-form.tsx; src/components/update-password-form.tsx |
| src/components/export-form.tsx | Client: useActionState | src/app/(dashboard)/dashboard/exports/page.tsx |
| src/components/firm-onboarding-form.tsx | Client: useActionState | src/app/onboarding/page.tsx |
| src/components/gst-summary-form.tsx | Client: useActionState | src/app/(dashboard)/dashboard/gst-summary/page.tsx |
| src/components/landing-navigation.tsx | Client: useState, useEffect | src/app/page.tsx |
| src/components/lead-capture-form.tsx | Client: useActionState | src/app/contact/page.tsx; src/app/page.tsx |
| src/components/ledger-entry-form.tsx | Client: useActionState | src/app/(dashboard)/dashboard/ledger/[entryId]/edit/page.tsx |
| src/components/password-reset-form.tsx | Client: useActionState | src/app/(auth)/forgot-password/page.tsx |
| src/components/public-page-shell.tsx | Server-compatible presentational | src/app/contact/page.tsx; src/app/privacy/page.tsx; src/app/terms/page.tsx |
| src/components/status-chip.tsx | Server-compatible presentational | src/app/(dashboard)/dashboard/audit-logs/page.tsx; src/app/(dashboard)/dashboard/clients/page.tsx; src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx; src/app/(dashboard)/dashboard/exports/page.tsx; src/app/(dashboard)/dashboard/gst-summary/page.tsx; src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx; src/app/(dashboard)/dashboard/inbox/page.tsx; src/app/(dashboard)/dashboard/operations/page.tsx; src/app/(dashboard)/dashboard/page.tsx; src/app/(dashboard)/dashboard/platform/page.tsx; src/app/(dashboard)/dashboard/reports/page.tsx; src/app/(dashboard)/dashboard/review-queue/page.tsx; src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx; src/app/(dashboard)/dashboard/settings/page.tsx; src/app/page.tsx |
| src/components/transaction-review-form.tsx | Client: useActionState | src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx |
| src/components/update-password-form.tsx | Client: useState | src/app/(auth)/reset-password/page.tsx |

The table is generated from TypeScript import declarations, not a guessed design-system catalog. Detailed imports and direct data reads are in evidence/source-inventory.json. Transitive consumers include every route inside the protected layout. A client component does not imply that accounting data is client-authoritative.

## Primitives and reuse

Button and ActionLink share variant/size constants; TextLink supports extra link props for contextual names, while ActionLink exposes a narrower interface. Input/Select/Textarea share control styles; operational forms use these, but AuthForm and password forms duplicate compact input/toggle classes. FieldError accepts IDs without requiring consumer association; Field/Label abstractions are not sufficient evidence that every rendered input is associated. FormMessage uses a polite live region; caller must select success/danger deliberately.

PageHeader, PageBody, SectionCard, StatTile, FilterBar, DataTable, PaginationControls, RecordCount, EmptyState, QueryError, SetupRequired, DetailList, InlineAlert and table class exports provide the operational foundation. Reuse these before inventing a card/table/form system. StatusChip is its own shared file; status-to-tone functions are repeated at route level because lifecycle meanings vary. Centralize stable vocabulary without incorrectly treating ready, approved, configured and completed as synonyms.

DataTable creates a named, keyboard-focusable horizontal scroll region. Its explicit minWidth preserves accounting columns. That contract fails when a containing grid item expands the page (KO-UX-025); the fix belongs in containment, not column deletion. Sticky table headers are source-defined, but full scroll behavior is not certified by the bounding-box check. Pagination captions accurately say Page N and loaded records rather than pretending to know the total; preserve that correction.

## Tokens and dimensions

| Category | Current implementation | Reference/requirement comparison |
| --- | --- | --- |
| Surface | #F7F5EF background; #FFF surface; #F1EEE6 muted; cards white→#FBFAF6 | Matches CRD starting palette; restrained gradient already exists |
| Text | #1F2A24 primary; #5F6B63 muted; #27323A secondary ink token | Distinguish ink and foreground aliases when adjusting tokens |
| Brand | #146B43; dark #0D4B31; saffron #D98A1F | Preserve brand identity; not arbitrary per-module rainbow styling |
| Semantic | success #168A4A; warning #8A5B11; danger #B42318; info #2563A8 | Warning intentionally differs from CRD #B7791F; do not undo contrast improvement |
| Border/ring | #D8D2C4 border; brand ring2px, offset2px | Border against white is subtle; full control-state contrast remains unverified |
| Font | Manrope400–700 body; Sora500–700 headings; JetBrains Mono400–600 numeric | next/font variables in root layout; local browser fonts reported loaded |
| Page heading | 20px mobile,24px md; description14px/24px | Candidate28px/36px is not current or mandatory |
| Panel heading/meta | title14px; description12px; nav group10px; tile label11px | Reference is visually larger; density decision required before global enlargement |
| Numeric | tile26px; mono/tabular values and right-aligned financial cells | Preserve amounts, GSTINs, invoices, identifiers; do not round away financial detail |
| Radius | token6px controls; card8px; utilities12/16/20/24px available | Candidate8px controls/12px panels conflicts with currently documented8px cards |
| Spacing | PageBody16px mobile/24px md; section gap16px; card body16px; header16×12px | Candidate major gap24/panel20 should be reviewed in dense tasks |
| Desktop control | sm32px,md36px,lg40px; Input/Select36px | Candidate40px everywhere would reduce density; justify per context |
| Touch control | shared44px; auth fields36px/toggle28px; sign-out32×44px | Confirmed exceptions: KO-UX-013 and026 |
| Shell | header56px; sidebar256px expanded/68px collapsed; desktop appears at1024px | Candidate64px/240–72px is a proposal, not a defect by itself |
| Navigation | 36px desktop/44px mobile;16px icons; grouped labels10px | Reference rows/icons are larger; local hierarchy is more compact |
| Shadows/motion | 1px/2px low-opacity shadow; hover translateY(-1px),180ms; sidebar200ms | Reduced-motion CSS exists; static tiles should not imply clickability |
| Breakpoints | Tailwind640/768/1024/1280/1536; review rail at1280 | Container width matters when sidebar consumes256px |

Contrast arithmetic on 10% semantic tint over white: success3.88:1 (below4.5 for small text), warning5.10, danger5.57, info5.31, brand5.64. This checks those pairs only, not all backgrounds, placeholders, focus rings or disabled states.

## Independent shell and Overview assessment

| Section | Current observation | Candidate refinement / preserve |
| --- | --- | --- |
| Logo | 32px mark and compact14px wordmark; no screenshot tagline | Preserve actual asset and accessible home link; don't enlarge brand at expense of workspace |
| Sidebar | Grouped navigation, explicit Planned group, persisted collapse; firm context duplicated in topbar | Keep module inventory/active state; resolve false firm-chevron affordance and tooltip dismissal |
| Global header | Firm name, approval reminder, mobile menu, sign-out; no search/profile/notifications | Preserve calm identity/approval reminder; size touch controls; no dummy reference controls |
| Page heading | Task title, short description and available actions | One clear title/action hierarchy; avoid stacking redundant eyebrows |
| Metrics | Four live count tiles, restrained accents, neutral zero signals | Clarify scopes, errors and direct action; don't add synthetic trends |
| Priority worklist | Four real queue categories including export jobs; responsive stacked rows | Keep all four; align count/title/action and avoid fixed metadata columns without data |
| Review snapshot | Latest8 records; real detail links; mono/right aligned financial values | Keep snapshot/queue distinction and source access; don't hardcode reference totals |
| Mobile Overview | Stacks metrics before worklist; screenshot shows significant scrolling to tasks | Consider compact summary layout after token decision; retain counts and reachability |

## Reference-image feature truth matrix

The inline user image was visually accessible at 1835×857, but the attachment binary/original filename is unavailable to filesystem tools. Therefore precise file identity and pixel-diff comparison are BLOCKED. The separate root khataone_overview_refined.png is 1376×768 and is a different collapsed-sidebar concept, not an interchangeable copy. Existing docs/design-reviews/overview proposals (1419×1108 and1513×1040) are unapproved user work and were preserved.

| Reference element | Current component/data/authorization | Classification | Recommendation |
| --- | --- | --- | --- |
| Brand/navigation | BrandLogo, DashboardNav, existing routes | EXISTING_SUPPORTED | Preserve IA including Platform and exports queue omitted by image |
| Firm name / role | DashboardSidebar/layout; verified active membership | EXISTING_NEEDS_REFINEMENT | Clear static identity; no simulated switcher |
| Firm dropdown | No selected-firm state or switch action | REFERENCE_ONLY | Product/tenant-selection decision |
| Global search + CtrlK | No search service or command palette | REFERENCE_ONLY | Scope/permission/data-source decision; no inert input |
| Help entry points | Public contact exists; no dashboard help center | REFERENCE_ONLY | Choose real destination/support contract before UI |
| Notification badge | No notification model/panel | REFERENCE_ONLY | Do not copy3 or add fake alert count |
| Profile/avatar menu | Sign-out exists; no profile menu | REFERENCE_ONLY | Keep actual sign-out; account management separately scoped |
| Date/greeting/weather icon | No corresponding operational component | REFERENCE_ONLY | Optional preference; not a task defect |
| Review/Clients actions | Actual guarded module links | EXISTING_SUPPORTED | Retain clear primary/secondary actions |
| Pending13 / intake1 | Exact firm counts exist; screenshot values are examples | EXISTING_NEEDS_REFINEMENT | Never hardcode13/1; reconcile error/count definitions |
| GST ready0 | Real ready-period count | EXISTING_SUPPORTED | Preserve neutral zero and actual period scope |
| Exports0/month | Completed status with created_at month cutoff | EXISTING_NEEDS_REFINEMENT | Decide completion-month semantics |
| +5 / −2 trends | No prior-period comparison query | REFERENCE_ONLY | Define interval/baseline before considering |
| Work queues | Review, intake, GST blockers, export jobs | EXISTING_NEEDS_REFINEMENT | Preserve fourth category; scope destinations |
| Assigned staff avatars | No work-queue assignment read/UI; client assigned_user_id documented | REFERENCE_ONLY | Define assignment semantics/visibility; no invented initials |
| Updated2/4/6hours | No per-queue update aggregation | REFERENCE_ONLY | Define event semantics before exposing timestamps |
| Priority sort / all queues | No worklist sorter or separate all-queues route | REFERENCE_ONLY | Existing order is static; no nonfunctional select |
| Colored card/icon treatment | Shared semantic tokens exist; screenshot accents are decorative | EXISTING_NEEDS_REFINEMENT | Improve hierarchy/accessibility without duplicating arbitrary colors |

What is already corrected: modal dashboard mobile navigation, keyboard skip link, active aria-current, India date display, page-scoped Ledger totals, client page counts, relevant export fields, neutral planned integrations, and request-cached firm context. Old audit recommendations for these are not new missing features.
