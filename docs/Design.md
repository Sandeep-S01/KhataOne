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

- Persistent left sidebar.
- Compact topbar with firm/client context, search, notifications, and user menu.
- Main content optimized for tables, filters, split panes, and review workflows.
- Avoid nested cards.
- Use cards only for repeated items, compact stat tiles, and modals.
- Use full-width working surfaces for queue, ledger, GST, and reports.

## Color System

Recommended palette:

- Background: `#F7F5EF`
- Surface: `#FFFFFF`
- Surface muted: `#F1EEE6`
- Text primary: `#1F2A24`
- Text secondary: `#5F6B63`
- Border: `#D8D2C4`
- Brand green: `#146B43`
- Brand green dark: `#0D4B31`
- Accent saffron: `#D98A1F`
- Accent ink: `#27323A`
- Success: `#168A4A`
- Warning: `#B7791F`
- Danger: `#B42318`
- Info: `#2563A8`

Use green as the brand anchor, saffron as a controlled accent, and neutral ledger-paper tones for surfaces. Avoid making the product overwhelmingly green or beige.

## Typography

- Primary font: Inter or similar modern sans-serif.
- Numeric/ledger font: JetBrains Mono, IBM Plex Mono, or system monospace for amounts, GSTINs, invoice numbers, and tabular values.
- Dashboard headings should be compact and functional.
- Landing page headings may be larger but should remain direct.
- Letter spacing should remain normal.

## Component Guidelines

- Buttons: clear hierarchy with primary, secondary, ghost, and danger variants.
- Icon buttons: use lucide icons with tooltips.
- Tables: sticky header, compact rows, clear selection state, right-aligned amounts.
- Filters: visible and quick to adjust.
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
