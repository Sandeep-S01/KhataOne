# KhataOne UI & UX Design Brief

## Product Experience Summary

KhataOne has two connected experiences:

- A public landing page that explains and sells the product to CA firms.
- A secure CA dashboard where real accounting, GST preparation, and document review work happens.

SMB clients primarily experience the product through WhatsApp, not through the dashboard.

## Landing Page UX

### Primary Audience

CA firm owners and decision-makers.

### First Viewport Goal

Within five seconds, a visitor should understand:

- KhataOne is for CA firms.
- Clients send documents on WhatsApp.
- AI extracts accounting data.
- CAs review, prepare GST summaries, and export reports.

### Suggested Sections

- Hero: KhataOne name, direct value proposition, product/workflow visual, primary CTA.
- Workflow: WhatsApp input to AI extraction to CA review to GST/report output.
- CA Console: review queue, ledger, GST readiness, exports.
- Client Experience: send receipts, invoices, PDFs, and voice notes through WhatsApp.
- Trust: audit logs, firm data isolation, CA-controlled approvals.
- Future-ready GST: summaries now, integration-ready architecture later.
- CTA: book demo or start workspace.

### Landing Page Tone

Clear, professional, practical. Avoid hype-heavy AI claims. Emphasize time saved, fewer follow-ups, better readiness, and CA oversight.

## Dashboard UX

### Primary Dashboard Jobs

- See which clients need attention.
- Review AI-extracted transactions.
- Find missing documents.
- Check GST readiness.
- Resolve mismatches and low-confidence items.
- Export reports.

### Navigation

Recommended sidebar items:

- Overview
- Clients
- Inbox
- Review Queue
- Ledger
- GST Summary
- Reports
- Exports
- Audit Logs
- Settings
- Billing

### Dashboard Home

Show:

- Clients needing action.
- Pending review count.
- GST deadlines and readiness.
- Recent inbound documents.
- Extraction failures.
- Export status.

Avoid:

- Decorative charts without operational purpose.
- Oversized vanity metrics.

### Review Queue UX

Recommended layout:

- Left: filterable queue/table.
- Right: selected document preview and extracted fields.
- Actions: approve, edit, reject, duplicate, request clarification.
- Confidence and risk flags should be visible near the affected field.

### Ledger UX

Recommended layout:

- Dense table.
- Client and period filters.
- Search.
- Amounts right-aligned.
- GST fields visible or configurable.
- Inline edit or side panel edit.

### GST Summary UX

Recommended layout:

- Period selector.
- Filing readiness status.
- Sales and purchase summaries.
- ITC and tax totals.
- Missing/uncertain items.
- Export actions.

### WhatsApp Client UX

Clients should receive short, natural messages:

- Document received.
- Need clarification.
- Reminder for missing documents.
- Summary confirmation where needed.

Do not expose complex accounting language to SMB users unless necessary.

## Component Style

- Compact rows and controls.
- 8px or smaller border radius unless component library defaults require otherwise.
- Soft borders, limited shadows.
- Monospace numbers.
- Clear status chips.
- Tooltips for icon-only actions.
- Icons from lucide-react.

## Responsive Behavior

- Landing page must work fully on mobile.
- Dashboard should remain usable on tablet and desktop.
- Mobile dashboard can prioritize read/review basics; heavy ledger operations may be desktop-first.

## UX Copy Guidelines

- Use direct action labels: Approve, Edit, Reject, Export, Request Clarification.
- Use accounting terms familiar to CAs.
- Use simpler WhatsApp copy for SMB clients.
- Avoid vague AI copy like "magic" or "revolutionary."
- Always show whether AI output is draft, reviewed, or approved.
