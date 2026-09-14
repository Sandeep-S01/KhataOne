# UI Consistency Implementation Plan

Date: 2026-09-14
Scope: Typography, theme color, icon treatment, and shared-component usage consistency across KhataOne UI.

## Goal

Make the application feel like one polished product by removing visual differences caused by one-off typography, color, icon, and control styles. The work should strengthen the existing KhataOne design system instead of redesigning the product from scratch.

This plan is focused on shared UI consistency only. It should not change backend logic, Supabase queries, server actions, accounting workflows, auth behavior, or data models.

## Current Finding

KhataOne already has a good design system:

- Sora for headings/display.
- Manrope for UI and body text.
- JetBrains Mono for numbers, GSTINs, invoice numbers, dates, and ledger-like values.
- Color tokens in `src/app/globals.css` and `tailwind.config.ts`.
- Dashboard primitives in `src/components/design-system.tsx`.
- Icons from `lucide-react`.

The inconsistency comes from some areas still using local one-off classes instead of shared primitives. This is most visible in the dashboard shell, sidebar, topbar, command/search dialog, status chips, and a few operations/audit details.

## Principles

1. Preserve KhataOne’s existing product identity.
2. Prefer shared components and named class constants over one-off Tailwind strings.
3. Keep dashboard UI dense, professional, and operational.
4. Do not introduce new colors, fonts, icon libraries, or decorative styles.
5. Keep all financial/accounting behavior unchanged.
6. Verify with source contracts and build checks after every phase.

## Phase 1: Define Shared Visual Primitives

Create or extend shared primitives in `src/components/design-system.tsx` and small shell-specific components where needed.

Recommended additions:

- `TopbarIconButton`
- `ProfilePill`
- `CommandDialog`
- `CommandOption`
- `StatusBadge`
- `SidebarSectionLabel` or shared sidebar label class
- `IconBadge` or `StatusIconBadge`

Recommended shared class constants:

- `tinyLabelClassName`
- `statusBadgeClassName`
- `topbarMetaClassName`
- `commandInputClassName`
- `commandOptionTitleClassName`
- `commandOptionDescriptionClassName`
- `dashboardStatValueClassName`

Exit criteria:

- Shared primitives exist.
- No product behavior has changed.
- Typecheck and lint pass.

## Phase 2: Normalize Typography

Replace dashboard one-off text sizes with shared typography classes.

Known targets:

- `src/components/dashboard-topbar-actions.tsx`
- `src/components/dashboard-nav.tsx`
- `src/app/(dashboard)/dashboard/audit-logs/page.tsx`
- `src/app/(dashboard)/dashboard/operations/page.tsx`
- shared stat value styling in `src/components/design-system.tsx`

Rules:

- Use Sora only for page titles, brand/display, and headings.
- Use Manrope for sidebar, topbar, forms, filters, table labels, and body copy.
- Use JetBrains Mono only for numbers, IDs, GSTINs, invoices, dates, and ledger-like values.
- Avoid new arbitrary text sizes unless they become named shared tokens.

Exit criteria:

- Dashboard shell/sidebar/topbar typography uses shared classes.
- Remaining arbitrary sizes are either removed or documented as approved shared tokens.

## Phase 3: Normalize Theme Color Usage

Keep the current KhataOne palette, but ensure components consume it through tokens.

Rules:

- Use `khata-*`, semantic Tailwind aliases, or existing CSS variables.
- Avoid raw hex values in UI components.
- Raw hex values remain acceptable inside token definitions, OpenGraph image generation, and PDF export generation.
- Avoid creating new color shades without adding them to the token system.

Known targets:

- Command/search dialog selected states.
- Sidebar firm card and active nav treatment.
- Status chips in audit/operations pages.
- Inline badges and small pills.

Exit criteria:

- UI components use tokenized colors.
- Repeated color patterns are represented by shared components/classes.

## Phase 4: Normalize Icon Treatment

The app already uses `lucide-react`, so this phase is about sizing, stroke feel, containers, and interaction states.

Rules:

- Use lucide icons for interface icons.
- Use brand image only for KhataOne logo/mark.
- Use document images only for evidence previews.
- Standardize icon sizes by context:
  - Topbar icon button: `size-5` icon inside `size-9` button.
  - Sidebar nav icon: `size-4` icon in nav row/rail.
  - Status/icon badge: shared `IconBadge` or `StatusIconBadge`.
  - Empty state icon: shared `EmptyState` treatment.

Known targets:

- `DashboardTopbarActions`
- `DashboardNav`
- `DashboardSidebar`
- status and operation cards
- settings/platform icon panels

Exit criteria:

- Topbar, sidebar, and main dashboard icon treatments feel visually related.
- No new icon library or SVG icon set is introduced.

## Phase 5: Migrate Shell Components

Apply the new shared primitives to the persistent shell first because it appears on every dashboard screen.

Targets:

- `src/components/dashboard-topbar-actions.tsx`
- `src/components/dashboard-sidebar.tsx`
- `src/components/dashboard-nav.tsx`
- `src/components/dashboard-mobile-menu.tsx`
- `src/app/(dashboard)/dashboard/layout.tsx`

Work items:

- Replace local topbar icon button classes with `TopbarIconButton`.
- Replace profile pill local styling with `ProfilePill`.
- Replace search dialog local structure with `CommandDialog` and `CommandOption`.
- Normalize sidebar section labels and nav icon rhythm.
- Preserve current sidebar widths and current header height unless explicitly changed later.

Exit criteria:

- Shell looks consistent between sidebar, topbar, and command dialog.
- Navigation, search routing, activity menu, profile display, logout, and mobile menu still work.

## Phase 6: Migrate Dashboard Content Components

Apply shared typography/color/icon primitives to dashboard content where one-off styling remains.

Targets:

- Audit log badges/details.
- Operations metrics and job metadata.
- Status chips and small pills.
- Any page-level one-off text or badge styling that duplicates shared patterns.

Exit criteria:

- Main dashboard content visually matches shell typography and icon treatment.
- Status and metadata styling is consistent across pages.

## Phase 7: Source Contracts And Regression Checks

Add or update lightweight source-level checks so future edits do not reintroduce inconsistency.

Recommended checks:

- Shared topbar controls are used instead of repeated local icon-button classes.
- Command dialog uses shared command primitives.
- Dashboard arbitrary text sizes are either absent or allowlisted in shared tokens.
- Dashboard UI components do not use raw hex colors.
- Interface icons continue to come from `lucide-react`.

Existing related checks:

- `test:dashboard-navigation-shell`
- `test:deliberate-density`
- `test:dashboard-responsive-harness`

Exit criteria:

- New/updated checks pass locally.
- Checks protect the shared-component direction without blocking legitimate landing-page hero typography.

## Phase 8: Visual Verification

Run local verification after implementation.

Minimum checks:

- Dashboard overview at desktop width.
- Inbox page with search dialog open.
- Review Queue page.
- Clients page.
- Operations page.
- Sidebar expanded and collapsed.
- Mobile navigation/menu basics.

If authenticated browser state is unavailable, mark authenticated visual checks as blocked and let the user perform manual production review.

Exit criteria:

- No obvious typography mismatch between sidebar, topbar, and main content.
- Topbar/search/sidebar icon treatments feel consistent.
- Colors use the same paper/green/muted/border language.
- No horizontal overflow or clipped labels.

## Recommended Execution Order

1. Build shared primitives and class constants.
2. Refactor topbar/search/profile first.
3. Refactor sidebar/nav second.
4. Refactor status badges and small dashboard metadata third.
5. Add source contracts.
6. Run full validation.
7. Push once all checks pass.

## Validation Commands

Run at minimum:

```bash
npm run typecheck
npm run test:dashboard-navigation-shell
npm run test:deliberate-density
npm run test:dashboard-responsive-harness
npm run lint
git diff --check
npm run build
```

## Non-Goals

- No backend changes.
- No database changes.
- No Supabase query changes.
- No accounting workflow changes.
- No new design direction.
- No new icon library.
- No large landing-page redesign in this pass.