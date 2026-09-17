# KhataOne Design System

## Design Direction

KhataOne should feel like a modern digital khata for CA firms: compact, precise, trustworthy, and built for repeated professional use. The dashboard is an operations console, not a decorative SaaS page. The landing page can be more expressive, but it should still show real product workflow and trust.

## Brand Personality

- Professional.
- Reliable.
- Indian business-aware.
- Efficient.
- Calm under deadline pressure.
- AI-enabled but CA-controlled.

## Visual Principles

- Prioritize scan speed over decoration.
- Use dense tables and compact controls for operational screens.
- Keep financial numbers aligned and readable.
- Show statuses clearly.
- Make document provenance and auditability visible.
- Avoid generic abstract dashboards where real workflow evidence is needed.

## Layout Principles

### Landing Page

- First viewport should clearly say KhataOne and explain the WhatsApp-to-CA workflow.
- Use a realistic product visual or interface composition.
- CTA hierarchy should be clear.
- Keep sections focused: problem, workflow, CA console, WhatsApp client flow, GST readiness, security, CTA.

### Dashboard

- Persistent left sidebar attached to the left edge with a rectangular desktop panel and compact icon-only collapsed state.
- Rectangular top-attached dashboard header aligned to the 64px sidebar logo area, with firm context, search access, activity alert icon, profile context, and logout action.
- Main content optimized for tables, filters, split panes, and review workflows.
- Avoid nested cards.
- Use cards only for repeated items, compact stat tiles, and modals.
- Use full-width working surfaces for queue, ledger, GST, and reports.

## Color System

Recommended palette:

- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Surface muted: `#F1F5F9`
- Text primary: `#0F172A`
- Text secondary: `#64748B`
- Border: `#E2E8F0`
- Brand green: `#0A5C36`
- Brand green dark: `#05361F`
- Accent saffron: `#D97706`
- Accent ink: `#0F172A`
- Success: `#168A4A`
- Warning: `#D97706`
- Danger: `#DC2626`
- Info: `#2563A8`

Use green as the brand anchor, amber as a controlled attention accent, and slate neutrals for dashboard surfaces. Avoid making the product overwhelmingly green or beige.

## Typography

- Implemented app typography: Manrope is the primary interface family for headings, body copy, controls, tables, and numeric/accounting values.
- Numeric/accounting values use the shared `num` role for tabular figures, alignment, and scan consistency without introducing a separate monospace family.
- Dashboard headings should be compact and functional.
- Landing page headings may be larger but should remain direct.
- Letter spacing should remain normal.

## Implemented Design Tokens

- Global CSS tokens live in `src/app/globals.css` and are mapped into Tailwind in `tailwind.config.ts`.
- Existing `khata-*` Tailwind color aliases remain supported and now resolve to the shared token system.
- Shared app utilities include `k-card`, `k-card-hover`, `k-elevated`, `k-hero`, `k-brand-gradient`, `k-eyebrow`, `k-row`, and `num`.
- Functional UI icons use lucide-react at a shared 16px glyph size with stroke width 2. Touch targets remain larger than the glyph where required.
- Shared UI primitives for dashboard migration live in `src/components/design-system.tsx`.

## Component Guidelines

Performance interaction update (2026-09-16): the shared filter bar uses client
navigation for URL-based GET filters, with pending/disabled feedback and controls
synchronized to committed URL defaults on Clear, presets and history navigation.
Function-action forms retain their existing mutation behavior. Shared action,
text, preset and sidebar links, plus header search, display a themed top-edge
pending indicator without shifting layout; reduced motion is respected. Loading
feedback must never imply a financial write has succeeded before confirmation.

Secondary loading update (2026-09-16): keep sidebar links and filter presets
interactive while optional counts stream into their badges. Loading counts use
an ellipsis with an accessible label; unavailable preset counts use `n/a`, never
zero. The overview summary/worklist and review snapshot load independently with
existing shared tiles, section cards and table skeletons. Authentication still
precedes protected content, and a delayed badge must not remount a navigation
control or reset an edited filter.

Detail loading update (2026-09-16): show the verified primary record while secondary
history and document sections load through shared `DeferredSection` skeletons.
Review shows extracted text during private preview loading through shared evidence
components. Decision actions appear after the signing request settles, retaining
their unsaved-edit checks. Keep delayed sections contained on mobile and render
query failures explicitly rather than suggesting an empty audit history.

- Buttons: clear hierarchy with primary, secondary, ghost, and danger variants.
- Icon buttons: use lucide icons with tooltips.
- Tables: sticky header, compact rows, clear selection state, right-aligned amounts.
- Filters: visible, quick to adjust, and built from shared filter primitives. Filter inputs, selects, date fields, Apply buttons, and Clear actions should share the same control height within a filter panel.
- Status chips: compact, high contrast, consistent labels.
- Forms: grouped by accounting meaning, not arbitrary layout.
- Modals: use only for focused decisions or quick edits.
- Toasts: confirm actions and show failures clearly.
- Empty states: explain next action briefly.

## Key Status Labels

- Received.
- Extracting.
- Needs Review.
- Low Confidence.
- Duplicate Risk.
- Clarification Needed.
- Approved.
- Rejected.
- Exported.
- Filing Ready.
- Missing Documents.

## Accessibility

- Maintain WCAG-friendly contrast.
- Use semantic landmarks.
- Ensure keyboard access for tables, modals, forms, and menus.
- Provide focus states.
- Avoid text inside controls clipping at mobile sizes.
- Do not rely on color alone for status.

## Design Anti-Patterns To Avoid

- Generic SaaS hero with abstract gradient shapes.
- Oversized dashboard cards for work queues.
- Decorative UI that reduces scan speed.
- Long instructional text inside the app.
- Low-contrast financial tables.
- Hidden filters.
- Unclear AI confidence states.
- Approve actions without traceability.

## Sidebar layout update

The dashboard sidebar follows the approved reference direction while staying aligned to the product shell: a white rectangular 240px panel attached to the left edge on desktop, a 64px icon-only collapsed rail, a warm firm-context card near the top, grouped operational navigation, and bottom utility links. KhataOne-specific labels, route order, dense accounting workflow surfaces, keyboard focus behavior, and mobile dialog navigation remain preserved.

## Dashboard header layout update

The dashboard header is a square-edged, top-attached 56px shell surface aligned to the sidebar logo area, with no outer dashboard gutters or rounded main-content shell. It keeps firm context on the left and places search access, activity alerts, profile context, and sign-out controls on the right with lucide-react icons. Header controls use a lightweight layout rhythm inspired by the reference: icon-first search and activity controls, a compact rounded profile pill, a subtle divider, and the existing sign-out action. Styling remains within KhataOne tokens, muted surfaces, compact spacing, and accessible focus states while avoiding backend changes.

Search and activity controls are implemented as interactive header controls: search opens a keyboard-friendly dialog that routes into existing searchable dashboard pages, while activity opens a compact menu of existing operational destinations. The activity menu uses the same themed shell surface language, supports Escape focus return and Arrow/Home/End item movement, and keeps destination icons aligned with the sidebar. These controls do not introduce new backend claims or unimplemented data sources.

The search dialog uses a light overlay and compact command-panel structure with a focused input row, close icon, selected target state, and concise footer action.

The overview dashboard follows the reference three-tier hierarchy: metric KPI cards first, then a compact priority worklist, then a dense review queue snapshot table. KPI cards use a 4-column desktop grid, left urgency bars, large tabular counts, compact status tags, and direct text links into existing destinations. Worklist rows use a count pill, task description, and right-aligned action. Tables use 11px uppercase headers, 44px row containment, right-aligned numeric values, and contained horizontal scrolling.

Review Queue, Inbox, Clients, Ledger, Operations, and Audit Logs use the shared filter-panel pattern: search inputs, selects, date fields, Apply/Filter buttons, Clear/Reset actions, and table/list headers come from dashboard design-system primitives. Dashboard filter panels use shared inline filter fields with screen-reader labels, compact control sizing, same-row actions that wrap before overflow, and grouped From/To date-range controls where a page filters by date. The page header may use the right-side action slot for existing destinations, but must not expose bulk actions or direct exports unless the underlying workflow exists. Main and detail table cards use the shared table toolbar so the title, count, optional description, and future view controls align consistently across dashboard pages.

Review Queue is the pilot page for the richer reference-style worklist pattern: a compact top status/date preset row, a full-width search row with smaller operational typography, and an inline lower filter row with visually hidden labels, compact selects, one grouped From/To date range, and same-row Apply/Clear actions that wrap before overflow. Table toolbar affordances must expose only truthful current-state labels until real selection or column-preference behavior exists. Status pills may show live firm-scoped counts, but unimplemented bulk approval, direct CSV export from the queue, or configurable columns must not be presented as working actions.
