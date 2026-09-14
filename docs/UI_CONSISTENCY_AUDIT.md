# KhataOne UI consistency audit

Date: 2026-09-14. Source baseline: `6fad9e1`.

Diagnosis and standardization plan only. No application code, packages, libraries, backend behavior, permissions, routing, calculations, or layouts changed. The latest attached user request defines the target: one primary interface font, one functional-icon standard, and reuse of the current theme. Earlier implementation completion does not establish compliance with this new target.

## Verdicts

| Area | Verdict | Evidence and limits |
| --- | --- | --- |
| Typography | **FAIL** | Three deliberately configured interface families; public rendering confirms all three. Named dashboard text constants exist, but public/auth typography and filter labels still bypass a complete shared role scale. |
| Icons | **FAIL** | Lucide is the sole imported UI icon library found, but glyph dimensions range from 14 to 20px and topbar stroke differs. Same-destination icon mappings diverge. |
| Theme | **FAIL** | The palette is substantially shared. Input validation, badge recipes, surface aliases, shadows, focus and overlay behavior still have conflicting or duplicated definitions. This is not a recommendation for a new palette. |
| Complete rendered application coverage | **UNVERIFIED** | Public pages were tested locally. Authenticated dashboard, onboarding contents, role-specific states, native calendar contents and production rendering were not verified. |

The highest-impact integration points are `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`, and `src/components/design-system.tsx`, followed by their existing consumers. All 19 dashboard page modules already import the shared design system; replacing the dashboard architecture is unnecessary.

## Evidence method and boundaries

- Discovered 28 `page.tsx` route modules and 22 files in `src/components`. Inspected their component imports and presentation/state branches, root/nested layouts, CSS, Tailwind configuration, dependencies, assets and generated-output presentation. Source inspection is not a rendered-state pass.
- Browser: existing Playwright dependency, Chromium 153.0.8010.12, Windows, fresh unauthenticated context at `http://localhost:3001`. Desktop 1440x900, tablet 834x900, mobile 390x844. Supplemental login/signup/reset-password checks at 320x900. No packages installed.
- Waited for page loading and `document.fonts.ready`; inspected computed styles and Chromium `CSS.getPlatformFontsForNode`. Used existing transitive `fontkit` to inspect the actual generated WOFF2 features/glyph coverage. A browser-only text probe tested glyph fallback; it did not change source files.
- Blocked non-GET/HEAD browser requests as a guard. Final public matrix required zero blocked mutation attempts. Invalid form submissions stayed client-side; no accounts, leads, passwords, or accounting records were changed.
- The pre-existing server at port 3000 served unstyled HTML and returned HTTP 500 for two JS chunks. Times New Roman/Arial observed there was a local asset-serving failure, not evidence that the application intentionally uses those fonts. That run was discarded for design conclusions. The fresh instance rendered the intended CSS and fonts. Production asset health remains unverified.
- Screenshots were visually inspected for mobile signup validation and the expanded landing menu. Computed-style/overflow checks cover more pages than the screenshot review; no screenshot-only whole-app claim is made.
- Temporary scripts, raw observations and screenshots are under ignored `.codex-tmp/consistency-*`. The durable results are recorded below; temporary artifacts are not release evidence or a substitute for authenticated acceptance testing.

## Route coverage matrix

`B` = rendered public route and baseline font/icon/theme/overflow inspection at all three main viewports. `S/U` = source inspected, rendered contents UNVERIFIED. Dashboard entries include the shared sidebar, header and data/error/empty presentation paths where implemented. Dynamic IDs are route templates, not fabricated fixture IDs.

| Route | Main shared components / surface | Coverage |
| --- | --- | --- |
| `/` | LandingNavigation, BrandLogo, ActionLink, StatusChip, LeadCaptureForm; hero, sample records, cards, footer, FAQ | B; FAQ expanded at all widths; mobile menu opened at 390px |
| `/contact` | PublicPageShell, LeadCaptureForm; inputs, selects, textarea | B; native select invoked at all widths, popup internals unverified |
| `/privacy` | PublicPageShell, PublicInfoSection | B |
| `/terms` | PublicPageShell, PublicInfoSection | B |
| `/login` | AuthLayout, AuthForm, BrandLogo, ActionLink | B; invalid email/password, reveal password, submit validation, keyboard focus, primary hover |
| `/signup` | AuthLayout, AuthForm, BrandLogo, ActionLink | B; four invalid fields, reveal password, keyboard focus; blank validation also at 320px |
| `/forgot-password` | PasswordResetForm, Button, FieldError, FormMessage | B idle; reset-email delivery/pending/success unverified |
| `/reset-password` | UpdatePasswordForm, Button, local message/input recipes | B; password mismatch exercised; successful recovery-session update unverified |
| `/onboarding` | FirmOnboardingForm, SectionCard, SetupRequired | S/U; unauthenticated visit redirected to login at all three widths |
| `/dashboard` | PageHeader, StatTile, SectionCard, DataTable, StatusChip | S/U; unauthenticated visit redirected to login at all three widths |
| `/dashboard/inbox` | FilterBar, Input, Select, DataTable, StatusChip, QueryError, EmptyState | S/U |
| `/dashboard/review-queue` | FilterBar, DataTable, InlineAlert, StatusChip; native dates | S/U |
| `/dashboard/review-queue/[transactionId]` | TransactionReviewWorkspace/Form, DocumentEvidencePanel, DetailList; decisions and unsaved warning | S/U; draft/posted/viewer/error/evidence states unverified |
| `/dashboard/clients` | FilterBar, DataTable, StatusChip, FormMessage | S/U |
| `/dashboard/clients/new` | ClientForm, PermissionNotice | S/U |
| `/dashboard/clients/[clientId]` | DetailList, StatTile, DataTable, PendingSubmitButton | S/U; archive pending/outcome unverified |
| `/dashboard/clients/[clientId]/edit` | ClientForm, PermissionNotice | S/U |
| `/dashboard/ledger` | FilterBar, DataTable, StatTile, local filter badges | S/U |
| `/dashboard/ledger/[entryId]` | DetailList, DataTable, PermissionNotice | S/U |
| `/dashboard/ledger/[entryId]/edit` | LedgerEntryForm, DetailList, PermissionNotice | S/U |
| `/dashboard/gst-summary` | GstSummaryForm, DataTable, StatusChip | S/U |
| `/dashboard/gst-summary/[periodId]` | DetailList, StatTile, InfoNote, DataTable, StatusChip | S/U; provenance and unavailable-state rendering unverified |
| `/dashboard/reports` | StatTile, DataTable, StatusChip, TextLink | S/U |
| `/dashboard/exports` | ExportForm, DataTable, StatusChip, PermissionNotice | S/U; transaction/GST field variants and worker outcomes unverified |
| `/dashboard/audit-logs` | FilterBar, DataTable, StatusChip, StatusBadge | S/U |
| `/dashboard/operations` | FilterBar, StatTile, InlineAlert, PendingSubmitButton, metric text constants | S/U; role-specific controls and job outcomes unverified |
| `/dashboard/settings` | DetailList, IconPanel, DataTable, StatusChip | S/U |
| `/dashboard/platform` | IconPanel, DetailList, DataTable, StatusChip | S/U; planned features, not operational integrations |

All owner/admin/staff/viewer authenticated rendering remains UNVERIFIED. No live credentials were reused. API/action files are not UI routes; their business behavior was not audited or altered.

### Overlay and interaction coverage

| Surface / state | Implementation evidence | Browser coverage |
| --- | --- | --- |
| Workspace search dialog | `dashboard-topbar-actions.tsx:225`; shared CommandOption and panel/input constants, inline fixed wrapper | UNVERIFIED; open/close, Ctrl/Cmd+K, selected target, Enter, Escape, focus cycle and narrow-height rendering require authenticated check |
| Activity dropdown | `dashboard-topbar-actions.tsx:175`; inline absolute menu; shared IconBadge | UNVERIFIED; click, outside dismissal, menu keyboard behavior and placement |
| Mobile dashboard drawer | `dashboard-mobile-menu.tsx:42`; native dialog/showModal, backdrop, focus return | UNVERIFIED; all three dashboard viewports and navigation dismissal |
| Collapsed nav tooltip portal | `dashboard-nav.tsx:185`; createPortal to document.body | UNVERIFIED; pointer/focus/Escape, stacking and body-inherited font |
| Sidebar state | `dashboard-sidebar.tsx:10`; localStorage collapse preference | Source inspected; persistence/reload unverified; this is not theme persistence |
| Landing dropdown / FAQ | `landing-navigation.tsx:107`, `src/app/page.tsx:252`; native details | Opened mobile menu at 390px and FAQ at all main widths; themed content and no page overflow observed |
| Select dropdowns | Shared native Select plus native options | Contact selects invoked; native popup font/radius/theme not DOM-verifiable |
| Date calendars | Native date Input in ledger, review queue, audit, GST, export and edit forms | UNVERIFIED behind authentication; no custom calendar library found |
| Confirmation modals / toast system | No app-owned confirmation-modal or toast implementation found in inspected source/dependencies | Not present; do not add these features for consistency alone. Existing inline FormMessage/FieldError are the feedback surfaces |
| Loading / disabled | Button, PendingSubmitButton, TableSkeleton, dashboard/loading.tsx | Source inspected; actual pending jobs, navigation skeleton and disabled permission states UNVERIFIED |
| Error / empty / success / warning | QueryError, EmptyState, FormMessage, InlineAlert, PermissionNotice, StatusChip | Public client validation and password mismatch exercised. Backend error/success, empty dashboard and decision-warning branches UNVERIFIED |
| Native validation / media / external document | Browser validation bubbles, audio controls, PDF object, signed images/text | Native select invoked; validation bubbles/media/PDF/evidence rendering UNVERIFIED. Original document content excluded from restyling |
| Hover / focus / active / selected | Shared and local Tailwind recipes | Public primary hover, keyboard focus, input focus and mobile selected nav inspected; dashboard equivalents UNVERIFIED |

No dark-mode provider, toggle, dark selectors or persisted theme preference was found. Light is the only implemented app theme. OS/browser-native surfaces may differ; do not add dark mode in this workstream.

## Current inventory

### Fonts and typography

| Source | Current configuration/use |
| --- | --- |
| `src/app/layout.tsx:2` | Sole next/font import: Sora, Manrope, JetBrains Mono. Each requests `latin`; Sora weights 500/600/700, Manrope 400/500/600/700, JetBrains Mono 400/500/600. All variables applied on body at line 67. |
| `tailwind.config.ts:47` | sans = Manrope + sans/system fallbacks; display = Sora + sans/system fallbacks; mono = JetBrains Mono + monospace fallbacks. |
| `src/app/globals.css:90` | h1-h4 use Sora, weight 600, zero tracking. Body inherits Manrope; body feature settings are cv02/cv03 (line 83). |
| `src/app/globals.css:108` | .num switches to JetBrains Mono and tabular numerals. `font-mono` also appears directly in counts, pagination, settings and landing footer. |
| `design-system.tsx:8`, `:429`, `:930` | Some named text constants exist; metric, metadata, titles, descriptions, table text and small labels are already shared. These are the migration entry points. |
| `document-evidence-panel.tsx:95` | Raw source text is in pre, subject to Tailwind/browser monospace defaults. Separate the app-owned wrapper from external source contents; never rewrite document text. |
| `src/app/opengraph-image.tsx:24` | Generated social image declares Arial; actual renderer font not verified. Twitter re-exports it. It is a generated image, not an interface fallback. |
| `src/lib/exports/generator.ts:321` / `:353` | PDF sizes 18/10/12/9; Helvetica/Helvetica-Bold explicitly selected for rows. Output-document scope, not a reason to change backend export generation here. |

No additional app-local font assets, CSS font imports, font icon files, or second next/font loader were found. Google font assets are emitted into Next's generated static media; configured fallback names do not themselves download fonts. The fresh landing page requested three distinct preloaded font resources, not proven duplicate downloads. Obsolescence depends on migration: Sora remains used by the excluded BrandLogo wordmark until that brand decision changes; do not delete its import prematurely. JetBrains Mono can become removable after every app-owned mono consumer is migrated. No measured performance benefit is claimed.

Current size vocabulary in TSX/CSS: 10px, 11px (also 0.6875rem), 12px, 14px, 15px, 16px, 17px, 18px, 20px, 24px, 26px (also 1.625rem), 30px, 36px, 48px and 54.4px (3.4rem). Generated social-image sizes are separately 22/24/34/66px. Contextual size differences are legitimate; scattered role definitions are the problem.

Current weights are inherited 400 and explicit 500/600/700. No explicit app italic utility or configured italic face was found. Line heights include normal, 1, 1.05, 1.25, 1.625 and fixed 16/20/24/28/32px plus Tailwind size defaults. Tracking includes normal/0, wide (0.025em) and wider (0.05em); uppercase and capitalization also affect visual density. The existing Design document asks for normal tracking, so wide filter/section labels are a source conflict.

### Font and glyph observations

| Probe | Observed result |
| --- | --- |
| Public h1 | Sora custom font, computed 600; login/signup/reset titles 24/32px; public info title 30/36px; landing mobile title 36/37.8px |
| Public body / form controls | Manrope; auth fields 14px at 1440/834 and 16px at 390. Chromium reports its internal family as `Manrope ExtraLight`; this internal variable-font name is not evidence that CSS requested weight 200. |
| Landing sample numeric text | JetBrains Mono custom font. Distinct from both headings and body. |
| Fresh public matrix | No failed font requests, page JavaScript errors or horizontal document overflow in 24 public route/viewport visits. Six additional protected-route visits showed login redirects, not protected contents. |
| Manrope numeric features | Generated Latin WOFF2 contains tnum and pnum. Font shaping with tnum gives all ten digits advance 1240 font units; pnum produces different advances. Browser per-digit widths at 16px were approximately 9.92px (rounding variation up to 0.016px). |
| Latin, rupee, punctuation | Separate correctly encoded browser probes rendered Latin, ₹, en/em dash, curly quotes and ellipsis with Manrope. Its rupee glyph is in a non-preloaded generated subset, loaded on demand. |
| Indic glyphs | Manrope files inspected do not contain the tested Devanagari/Tamil glyphs. Hindi/Marathi probe used Nirmala UI plus Segoe UI for some characters; Tamil used Nirmala UI. These are necessary OS glyph fallbacks, not failed Manrope downloads. |

Root language is `en`; no complete supported-language list/localization system was found. Indic probes are diagnostic samples for user-provided names/documents, not certification of multilingual UI support. Other scripts, devices, complex shaping and full currency coverage remain UNVERIFIED. One primary font cannot mean forbidding necessary glyph fallback when the selected family lacks characters.

### Icons

`lucide-react` is the only direct UI icon dependency/import source found. No hand-authored inline svg, functional SVG assets, second icon library, icon font, or emoji controls were found in app-owned TSX. Lucide itself renders SVG and therefore is not a second icon source. BrandLogo uses the PNG mark; favicon/apple/app icons and uploaded evidence are separate image assets.

The imported icon vocabulary includes ArrowRight/ArrowLeft, Eye/EyeOff, LoaderCircle, Bell, Search, Menu/X, PanelLeft/PanelLeftClose, LayoutDashboard, Users, Inbox, ListChecks, Receipt, ShieldCheck, FileText, FileDown, ScrollText, Wrench, Settings, LifeBuoy, PanelsTopLeft, Download, RefreshCw, RotateCw, CheckCircle2, CircleAlert, AlertTriangle, ClipboardList, Info, LockKeyhole, Blocks, CircleDollarSign, Landmark, Send, BadgeCheck, BookOpenCheck, Check, ChevronRight, FileSpreadsheet, MessageSquareText, ScanLine and Sparkles.

Current visible glyph sizes: 14px (InlineAlert, export metadata, landing CTA), 16px (nav/buttons/password controls), 18px (IconPanel), 20px (topbar/search/mobile menu/EmptyState/marketing illustrations). Lucide default stroke is used except explicit topbar 1.8. Container sizes are separate: 32/36/40/44px examples exist. Most functional controls have names and focus styles; decorative aria-hidden is explicit in some consumers but omitted in others. Lucide's own rendered defaults must be checked before treating omission alone as an accessibility failure.

### Theme authority

`globals.css:5` is the existing palette authority; Tailwind maps it into utility aliases; design-system.tsx supplies component recipes. No theme provider overrides it.

| Role | Current value |
| --- | --- |
| Page / surface / muted surface | #f7f5ef / #ffffff / #f1eee6 |
| Primary text / muted text | #1f2a24 / #5f6b63 |
| Brand / brand hover / saffron | #146b43 / #0d4b31 / #d98a1f |
| Border / input border / ring | #d8d2c4 / #d8d2c4 / #146b43 |
| Success / success text | #168a4a / #0f6f3d |
| Warning / warning text | #8a5b11 / #704608 |
| Info / info text | #2563a8 / #1d4f86 |
| Danger / danger text | #b42318 / #7a1b12 |

`ink` resolves to #27323a while `khata-ink` resolves to foreground #1f2a24 (`tailwind.config.ts:21`, `:37`): similar names, different meaning. Hex and RGB token pairs are independently maintained. `--card`, `--popover`, `--input`, `--ring` exist but many recipes use bg-white, border-khata-border and khata-green directly. These match today's palette, but bypass semantic surface/control roles.

Radius mappings include 4/6/8/12/16/20/24px, with .k-card fixed at 8px. Header/sidebar outer corners are intentionally square; profile pill and brand treatment have explicit prior direction. Shadows xs/sm/md/lg map to elevation tokens, but `shadow-xl` retains Tailwind's default recipe. CSS gradients, selection, scrollbar and ledger-grid contain repeated raw color channels. Component spacing uses existing Tailwind steps but field gaps vary (mt-1/1.5/2). Focus generally uses a 2px ring/outline, with offsets 2 or 4 and local ring/outline combinations. These should become named role choices, not indiscriminately flattened.

## Findings and shared fixes

Effort estimates are engineering time including focused checks, not commitments or measured outcomes. P1 = resolve before declaring consistency; P2 = standardization/maintenance drift; P3 = low-impact cleanup or verification prerequisite.

| ID / priority / evidence | Affected route/component/state and source | Observed vs expected | Recommended smallest shared fix | Effort / verification |
| --- | --- | --- | --- | --- |
| T01 P1, source + browser | All interface routes; layout.tsx:2, globals.css:90/108, tailwind.config.ts:47, design-system.tsx:535/936 | Three intentional families vs requested one primary family. Counts and pagination prose also inherit mono. | Retain Manrope as primary because it is already body/sans; migrate heading, num, table/metadata roles and explicit mono consumers to it. Keep numeric tabular figures and alignment. Preserve BrandLogo's excluded wordmark. | 1-2 days; computed/actual font matrix after loading, numeric column and long-ID regression |
| T02 P1, source + glyph probe | Root font configuration and all user-entered names/identifiers; layout.tsx:8/14/20 | Latin subsets do not guarantee all Indian-script glyphs. Removing all fallbacks would break real text. | Document explicit glyph fallback exception and supported-script matrix; retain existing system fallback until verified. Do not add a new primary font. | 0.5-1 day; rupee/punctuation/Indic fixtures on Windows, Android and iOS; no tofu/missing characters |
| T03 P2, source | Clients page.tsx:207/221, inbox page.tsx:247/261, review-queue page.tsx:399; design-system.tsx:8/304; public page.tsx:284/288 | Local 12px tracked filter labels differ from shared 11px untracked field labels and 10px wide sidebar labels. Public/auth sizes are not named roles. | Define one role scale in existing design tokens; expose named typography recipes. Migrate labels first, then public/auth headings and copy without changing their layout dimensions. Explicitly document weights, tracking and case decisions. | 1 day; inventory every remaining text override and role snapshot |
| I01 P1, source + public browser | Topbar actions.tsx:156/172 vs nav.tsx:177, design-system.tsx:710/740/829; landing-navigation.tsx:103 | 14/16/18/20px glyphs and 1.8/default stroke; same topbar Search changes stroke inside dialog. | Add a shared functional Icon adapter using Lucide, 16px glyph, strokeWidth 2, currentColor and shrink-0. Migrate all functional consumers; keep button hit areas independent. Avoid universal SVG selectors. | 1 day; visible computed glyph size/stroke across nav, buttons, tables and overlays |
| I02 P2, source | dashboard-topbar-actions.tsx:54 vs dashboard-nav.tsx:38; operations page import vs dashboard/error.tsx:3 | Operations destination uses Settings in activity and Wrench in nav. RefreshCw/RotateCw both represent retry-like actions. | Reuse a presentation-only action/destination icon map. Use Wrench for Operations and a documented retry glyph; keep distinct actions distinct, such as download vs export section. | 0.25 day; route/action mapping review, accessible names unchanged |
| A01 P1, source; rendered risk unverified | dashboard-topbar-actions.tsx:95/225/237, dashboard/layout.tsx:45 | Search declares aria-modal but has no focus trap, background inertness, scroll lock or trigger-focus restoration. It is nested in a backdrop-filter header, so fixed overlay containment needs verification. | Reuse the native dialog/showModal approach already in DashboardMobileMenu at a shared Dialog boundary, consuming existing panel tokens; explicit focus restore and contained vertical scroll. Preserve routing/query behavior. | 1 day; Tab/Shift+Tab contained, Escape/outside close, trigger focus return, full viewport coverage and short-height keyboard test |
| A02 P1, source | dashboard-topbar-actions.tsx:179/197; design-system.tsx:13; dashboard/layout.tsx:69 | Activity declares menu/menuitem without menu focus/arrow handling. Topbar targets are 36px and search close is 32px, vs shared mobile 44px controls. Selected search target has visual text but no pressed/checked state. | Adopt appropriate shared disclosure/menu semantics and focus policy; use shared IconButton targets (44px touch, current compact desktop size); expose selection accessibly. Preserve glyph size at 16px. | 0.5-1 day; keyboard menu/disclosure operation, selection announcement, 390px target measurement |
| H01 P1, source + public validation | auth-form.tsx:28/31; password-reset-form.tsx:17; update-password-form.tsx:94/141; design-system.tsx:258/330/350 | Auth inputs duplicate shared control styling; only AuthForm has invalid border/focus selectors. Shared Input accepts aria-invalid but lacks matching visual recipe; feedback varies between local spans, FieldError and message panels. | Extend existing Input/FieldError/FormMessage with named appearance variants and shared invalid/focus tokens; migrate auth/recovery consumers without changing validation logic, timing, labels or message IDs. | 1 day; invalid/valid/focused/disabled/pending states on auth and accounting forms |
| H02 P2, source | status-chip.tsx:3/24; design-system.tsx:18/95/111; ledger/page.tsx:230; transaction-review-workspace.tsx:182 | StatusChip is 12px medium/6px radius; StatusBadge 11px regular/pill with different semantic border alpha. Local ledger badges and warning panel add other recipes. | One shared semantic tone map and Badge recipe with explicitly named status/metadata variants. Reuse alert tone tokens; retain every status label and semantic distinction. | 0.5 day; side-by-side success/warning/error/neutral/disabled cases; no color-only meaning |
| H03 P2, source | globals.css:6-67/86/159/176; tailwind.config.ts:21/37/52/61; design-system.tsx:15 | Dual hex/RGB definitions, two ink aliases, direct white surface classes, hardcoded gradient channels and unthemed shadow-xl weaken canonical theme control. | Keep existing palette authoritative; derive aliases from a single representation where compatible. Map surface/popover/foreground/elevation recipes centrally; retain current visual values and documented shell/avatar exceptions. | 0.5-1 day; computed color/border/radius/shadow checks including body portals |
| H04 P1, source + browser measurement | Contact current-workflow textarea and shared controls; design-system.tsx:258/284 | Computed placeholder rgba(95,107,99,0.65) over rgb(247,245,239) produces approximately 2.60:1 contrast after alpha compositing. This is below the proposed 4.5:1 normal-text acceptance threshold. | Define a shared placeholder text token using the existing palette with adequate contrast; apply to Input/Textarea and migrated auth/command variants. Preserve persistent field labels. | 0.25 day; measure rendered placeholder contrast on each actual surface and check all input variants |
| V01 P1 closure gate, unverified | All protected routes, native date pickers, roles and asynchronous outcome states | Static imports and prior completion notes do not prove rendered consistency. No authorized isolated state/fixture IDs used here. | Execute the acceptance matrix after implementation with disposable fixtures; label missing states unverified. Do not manufacture screenshots or seed production records. | 1-2 days after fixtures exist; evidence per route/role/viewport/state |
| C01 P3, source | design-system.tsx:18 (`statusBadgeClassName`); original font imports and symbol recipes | Unused exported badge constant found; font imports are currently used, not yet obsolete. No unnecessary second icon package found. | Remove truly unused UI recipes only after repository-wide reference check; remove JetBrains Mono after migration, retain Sora while brand wordmark requires it. No speculative dependency replacement. | 0.25 day; reference scan, build and network request inventory |

Source paths shortened in the table resolve under `src/components/`, `src/app/`, or `src/app/(dashboard)/dashboard/` as indicated by their component/route. Line numbers refer to the audited baseline, before remediation.

## Proposed canonical standard

These are explicit proposed decisions, not assertions of current implementation. They replace the older three-family/per-context-icon recommendations for this workstream. Record the final adopted choices in Design.md, UI-UX-Design-Brief.md and rules.md when implementation begins.

### Typography roles

Primary: existing Manrope. Normal style and zero letter-spacing by default. Preserve the logo wordmark separately. Proposed weight variations beyond size: 400 body/helper text, 500 navigation/controls/table emphasis, 600 headings/selected emphasis, 700 only named eyebrow/strong emphasis where justified. No italics, weight 800, or wide tracking proposed. Uppercase only named eyebrow/field-label roles; do not uppercase user content except current identifier behavior.

| Shared role | Size / line height proposal | Application |
| --- | --- | --- |
| Micro / metadata | 10/14 and 11/16px | Existing compact secondary badges/section labels only; not essential instructions |
| Caption / field label | 12/16px | Help, status, filter/table headings; eliminate ad hoc tracked variants |
| Body / control / section title | 14/20px; prose variant 14/24px | Navigation, buttons, tables, card headings; role determines weight |
| Touch input | 16/24px | Preserve mobile form text sizing |
| Command / public lead | 15/24px; hero lead 17/28px | Named existing contextual steps, not per-page custom utilities |
| Metric / compact heading | 18/24 and 20/28px | Existing operational metrics and compact headings |
| Auth / dashboard title | 24/32px; dashboard 20/28 mobile, 26/32 desktop | Preserve current page hierarchy |
| Public title | 30/36px | Public info and section headings |
| Hero title | 36px, 48px, 54.4px at existing breakpoints; line-height 1.05 | Preserve existing landing hierarchy and wrapping intent |

Consolidation is about role ownership, not making all text the same size. Audit 10/11px readability before broadening their use. Numeric fields retain Manrope plus `font-variant-numeric: tabular-nums`, existing India-local formatting, decimal precision and right alignment. Preserve meaningful identifier text and copy/paste behavior.

### Icons and controls

- Canonical functional icon: existing Lucide outline, 16x16 CSS px, strokeWidth 2, currentColor, shrink-0. Use the same glyph size across functional navigation, tables, cards, menus, buttons and overlays.
- Keep desktop control targets at least their existing compact dimensions; mobile/touch icon controls use 44x44px. Visible glyph standardization must not reduce click/touch areas.
- Decorative icons accompanying a full label should be hidden from assistive technology through the shared adapter. Icon-only buttons need an accessible action name; focus and disabled appearance belong to shared control recipes.
- Explicit exceptions: unchanged brand marks/favicons; uploaded document images/illustrations; browser-native calendar/select/media icons whose internals are not fully controllable. Existing landing feature illustrations may retain 20px only when classified as decorative illustrations. No route-specific functional size exception is proposed. Empty-state and IconPanel glyphs use the functional standard unless separately justified as illustrations.
- Keep explicit motion for loading icons and existing reduced-motion behavior. Do not implement blanket svg sizing or add a second library.

### Theme and overlays

Keep the current green/paper/saffron/semantic palette. Make globals.css the canonical values, Tailwind the compatibility mapping, and design-system.tsx the reusable recipes. Propose named surface, muted surface, popover, text, muted text, border, focus, semantic status, radius and elevation roles.

Preserve square shell corners and current sidebar widths/header height. Keep existing approved profile-pill/brand corner treatments as named exceptions. Record the existing overlay 12px radius explicitly rather than applying the old blanket 8px brief or changing layouts silently. Standardize repeated control/card radii at the existing 6/8px steps. Centralize recipes and compare screenshots before changing any resulting visible value.

Shared Dialog, disclosure/popover, IconButton, Input, Badge and message recipes should inherit fonts and tokens even in body portals/top-layer dialogs. Keep native controls; their platform UI is a documented boundary, not grounds for installing a calendar library. Do not create a toast system or add confirmation workflows simply because the audit requested their inventory.

## Impact-ordered remediation checklist

- [ ] **0. Reconcile standards.** Mark the older plan's three-font and multiple functional-icon-size rules superseded for this workstream. Record Manrope, numeric/glyph exceptions, weights/tracking, icon standard and retained layout/brand exceptions. No backend decisions.
- [ ] **1. Consolidate typography at the root and shared recipes.** Implement the named role scale, migrate .num/table metadata and heading consumers, then remove remaining per-page role duplication. Preserve all data formatting and layout bounds.
- [ ] **2. Consolidate Icon and IconButton.** Normalize Lucide glyph dimensions/stroke and action mapping, retain accessible names and touch targets, then migrate shell and content consumers.
- [ ] **3. Normalize existing overlay behavior and styling.** Extract the smallest shared native-dialog/disclosure primitives from existing patterns; repair search focus/containment and activity semantics. Do not change destinations or search logic.
- [ ] **4. Consolidate forms and feedback.** Migrate auth/recovery inputs and local validation presentation to shared variants. Unify badge/alert tone recipes; retain success/warning/error distinctions and current validation behavior.
- [ ] **5. Finish theme aliases and consumer cleanup.** Replace repeated surface/elevation channels through existing tokens, resolve ink naming, document deliberate radii/spacing variants and remove proven unused recipes/imports only.
- [ ] **6. Verify the entire rendered matrix.** Public routes first, then all authenticated routes and roles using isolated fixtures, every implemented overlay/state, browser-native boundaries and all required widths. A source-contract pass is insufficient for closure.

Steps 1-5 can be reviewable small changes in the existing design system and consumers. Estimates overlap and should not be added as a fixed schedule. No additional feature implementation, dependency installation or production mutation is part of this plan.

## Regression acceptance criteria

- App-owned interface text resolves to Manrope after fonts load across every route, form, table, navigation, body portal and modal. Only documented brand/output-document/native-control/glyph exceptions remain. No unexpected system fallback from failed assets.
- Every text role consumes a named shared scale; remaining weight, line-height, tracking, casing and size variations are documented. Existing layout dimensions and responsive breakpoints are preserved; font-width changes introduce no overlapping/truncated essential labels.
- Rupee, Indian number grouping, punctuation, long GSTIN/invoice/job IDs and supported-script samples render and copy correctly. Tabular digits have equal advances; amount columns remain right-aligned. Language coverage is recorded by device rather than assumed.
- Every functional Lucide glyph uses 16px/2 stroke; exceptions are explicit. Controls retain usable targets, accessible names, decorative handling, keyboard-visible focus, and nonmisleading disabled appearance.
- Search, activity, mobile drawer, collapsed-nav tooltip and landing menu are opened and checked. All use themed surfaces/text/borders/shadows; search traps focus, makes the background inert, scrolls on short screens and restores focus. Menus/disclosures and search selection use correct accessible semantics.
- Hover/focus/active/selected/disabled/loading/validation/success/warning/error states are exercised. Inline errors remain readable and announced; warnings never adopt success appearance; unavailable data never looks like a successful zero count.
- Normal-size text, including placeholders and secondary instructions, meets at least 4.5:1 contrast on its rendered background; verify alpha-composited colors rather than just palette swatches. Measure focus/control contrast separately and retain accessible disabled semantics.
- Every discovered route is checked at 1440x900, 834x900 and 390x844, plus narrow 320px and 200% zoom stress. Dashboard tables may scroll within their named regions; the document must not overflow. Test mobile landscape/virtual keyboard for overlays and long names/values. Firefox/WebKit and real mobile native surfaces are separate verification rows, currently unverified.
- Owner/admin/staff/viewer affordances, read-only and posted records, empty/filter-empty/error states, export variants, pending controls, evidence previews and safe action outcomes are covered with isolated fixtures. Existing auth/search/navigation/financial behavior stays unchanged.
- Run relevant UI behavior tests, lint, typecheck and build after code remediation; verify font/icon/theme checks against computed styles, not only source strings. Compare public and authenticated screenshots with the baseline and record every unavailable case as UNVERIFIED.

Documentation verification: route inventory reconciled with the 28 discovered page modules; browser results checked against the coverage matrix; `git diff --check` passed. The temporary audit server was stopped and its generated Next type-reference change restored. Only this report and Tracker.md are changed. Lint/typecheck/build were not rerun for this documentation-only pass; they remain required after remediation code is implemented.

This audit stops at diagnosis and planning. Current evidence supports the findings above, not an application-wide consistency certificate.
