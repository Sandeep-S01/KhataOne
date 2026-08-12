# KhataOne Creative Requirements Document

## Purpose

This CRD is the practical creative and product brief for building KhataOne landing pages and the CA dashboard. It translates the BRD, PRD, app flow, design system, and backend schema into clear page requirements, UI content, data surfaces, and acceptance criteria.

KhataOne is a WhatsApp-first AI accounting and GST workflow platform for Indian SMBs, operated by CA firms through a professional web dashboard.

## Product Positioning

### One-Line Description

KhataOne helps CA firms turn client WhatsApp invoices, receipts, PDFs, and messages into reviewable accounting records, ledger handoffs, GST summaries, and export-ready reports.

### Core Promise

Clients keep using WhatsApp. CAs get structured, reviewable, traceable accounting workflows.

### Primary Value Pillars

- WhatsApp-first document collection.
- AI-assisted accounting extraction.
- CA-controlled review and approval.
- Ledger handoff and GST summary preparation.
- Auditability and firm-level data isolation.
- Export-ready reports for real CA workflows.

### What KhataOne Is Not

- Not generic consumer finance software.
- Not a full ERP replacement.
- Not autonomous GST filing in production v1.
- Not an AI system that approves accounting entries without CA review.

## Audience

### Primary Buyer

CA firm owner or partner who manages multiple SMB clients and wants faster monthly bookkeeping and GST preparation.

### Primary Daily User

CA staff or accounting operator who reviews documents, fixes extracted fields, approves transactions, prepares GST summaries, and exports reports.

### Client-Side User

Indian SMB owner or staff member who sends documents through WhatsApp and receives simple acknowledgments or clarification requests.

## Brand Direction

### Personality

- Professional.
- Trustworthy.
- Efficient.
- Indian business-aware.
- AI-enabled but CA-controlled.
- Calm under GST deadline pressure.

### Tone Of Voice

Use direct, practical language. Avoid exaggerated AI claims. Explain outcomes in CA terms: review, approve, ledger, GST readiness, exports, audit trail.

### Messaging Rules

- Always describe AI output as draft or reviewable.
- Do not claim direct GST filing is live.
- Do not imply government approval, bank integration, or Tally sync unless implemented.
- Keep SMB WhatsApp language simple and non-technical.

## Visual System

### Palette

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

### Typography

- Use a clean sans-serif for product UI.
- Use monospace for amounts, GSTINs, invoice numbers, job IDs, export IDs, and ledger values.
- Dashboard headings should be compact and work-focused.
- Landing page headings can be larger but should stay clear and literal.

### Component Style

- Compact tables.
- Clear filters.
- Status chips.
- Right-aligned amounts.
- Split-pane review layouts where useful.
- Simple bordered surfaces with restrained shadows.
- Icons from `lucide-react`.
- Avoid decorative SaaS dashboards that hide the work.

## Landing Page Requirements

### Landing Page Goal

Within five seconds, a CA firm owner should understand:

- KhataOne is for CA firms.
- Clients send documents on WhatsApp.
- AI extracts accounting data.
- CAs review and approve.
- GST summaries and reports become easier to prepare.

### Hero Section

Primary headline:

```txt
KhataOne
```

Supporting headline or subheading:

```txt
WhatsApp-first AI bookkeeping and GST workflow for CA firms.
```

Supporting copy:

```txt
Collect client documents on WhatsApp, convert them into reviewable accounting records, approve ledger handoffs, and prepare GST summaries from one CA-controlled dashboard.
```

Primary CTA:

```txt
Start workspace
```

Secondary CTA:

```txt
Book demo
```

Hero visual requirement:

- Show an actual workflow-style product visual, not a generic abstract illustration.
- Must include signs of WhatsApp intake, review queue, ledger, and GST readiness.
- Avoid claiming direct GST filing.

### Problem Section

Purpose:

Show the pain CA firms face before KhataOne.

Content points:

- Client documents arrive late and scattered.
- WhatsApp messages, PDFs, images, and voice notes need manual sorting.
- Staff spend time entering data and chasing missing documents.
- GST period readiness is hard to track across many clients.

### Workflow Section

Required four-step flow:

```txt
1. Client sends documents on WhatsApp
2. KhataOne stores and matches the message
3. AI extracts draft accounting fields
4. CA reviews, approves, and exports
```

Each step should have a compact visual or UI preview.

### CA Console Section

Show the professional dashboard modules:

- Overview.
- Clients.
- Inbox.
- Review Queue.
- Ledger.
- GST Summary.
- Reports.
- Exports.
- Audit Logs.
- Operations.
- Settings.

Copy should emphasize control, traceability, and speed.

### WhatsApp Client Flow Section

Show simple client messages:

```txt
Invoice INV-301 from ABC Traders dated 11 Aug 2026 total 11800 taxable 10000 CGST 900 SGST 900
```

Response example:

```txt
KhataOne received your document. Your CA team will review it before it affects your books.
```

Clarification example:

```txt
Please share the GSTIN or invoice copy for this transaction.
```

### GST Readiness Section

Production v1 message:

```txt
Prepare GST summaries and export-ready data from approved transactions.
```

Must not say:

```txt
File GST directly from KhataOne
```

unless direct filing is implemented and verified.

### Trust Section

Required trust points:

- Firm data isolation.
- Supabase Auth and RLS-backed tenant model.
- Original WhatsApp events retained.
- Source documents preserved.
- AI outputs stored with confidence and risk flags.
- CA approvals and edits are audit logged.
- Exports are traceable.

### Final CTA Section

Goal:

Convert CA decision-makers into signup/demo flow.

CTA copy options:

- `Start workspace`
- `Book demo`
- `Join waitlist`

Use only the actions implemented in the app.

## Dashboard Information Architecture

### Global Shell

Required layout:

- Persistent sidebar navigation.
- Firm workspace context.
- Sign out action.
- Main working area.
- Dense, professional spacing.

Recommended sidebar order:

```txt
Overview
Clients
Inbox
Review Queue
Ledger
GST Summary
Reports
Exports
Audit Logs
Operations
Settings
Platform
```

### Dashboard Copy Rule

Operational screens should not explain the whole product. They should show the work, state, filters, errors, and actions.

## Dashboard Pages

### Overview

Purpose:

Give CA staff a daily command center.

Required widgets:

- Pending review count.
- Recent inbound WhatsApp documents.
- Clients needing action.
- Failed processing jobs.
- GST periods needing review.
- Recent exports.

Primary actions:

- Add client.
- Open review queue.
- Open operations.
- Generate GST summary.

Empty state:

```txt
Add your first client and connect their WhatsApp number to start document intake.
```

### Clients

Purpose:

Manage SMB clients and their WhatsApp/accounting setup.

Required table columns:

- Business name.
- Contact name.
- Phone.
- WhatsApp phone.
- GSTIN.
- Filing frequency.
- Status.
- Updated date.

Actions:

- Add client.
- Edit client.
- Archive client.
- Open client detail.

Statuses:

- `onboarding`
- `active`
- `pending_documents`
- `review_needed`
- `filing_ready`
- `archived`

Client detail should show:

- Business profile.
- GST details.
- WhatsApp mapping.
- Recent documents.
- Recent transactions.
- GST readiness summary.

### Inbox

Purpose:

Track inbound WhatsApp messages and document intake before extraction.

Required columns:

- Received time.
- Sender phone.
- Matched client.
- Message type.
- Processing status.
- Source text or file name.

Statuses:

- `received`
- `matched`
- `unmatched`
- `media_downloaded`
- `media_failed`
- `queued`
- `ignored`
- `failed`

Actions:

- Open message.
- Link unmatched sender to client.
- Retry failed media download.
- Open related document/job.

### Review Queue

Purpose:

Let CAs verify AI-created draft transactions before they affect books.

Required list columns:

- Client.
- Transaction type.
- Invoice number.
- Party.
- Date.
- Amount.
- Confidence.
- Source model.
- Status.

Filters:

- Client.
- Status.
- Confidence/risk.
- Date/GST period.
- Transaction type.

Transaction detail layout:

- Left: editable accounting form.
- Right: review summary, risk flags, source text/document, decision actions.

Editable fields:

- Type.
- Date.
- Party.
- Party GSTIN.
- Invoice number.
- Category.
- Place of supply.
- Payment mode.
- Taxable amount.
- CGST.
- SGST.
- IGST.
- Cess.
- Total.
- Description.

Decision actions:

- Save review edits.
- Approve and create ledger handoff.
- Reject.
- Mark duplicate.
- Request WhatsApp clarification.

Required behavior:

- Approval creates or reuses one ledger handoff.
- Low-confidence or rule-based extraction remains visible.
- Failed action must show a clear error.
- Audit log records sensitive decisions.

### Ledger

Purpose:

Show approved ledger handoff entries created from reviewed transactions.

Required table columns:

- Date.
- Client.
- Account.
- Source invoice.
- Party.
- Debit.
- Credit.
- Action.

Filters:

- Client.
- From date.
- To date.
- Account.

Actions:

- Open ledger entry.
- Correct ledger mapping.

Rules:

- Ledger correction updates ledger handoff only.
- Source transaction and AI extraction remain preserved.
- Corrections must create audit logs.

### GST Summary

Purpose:

Prepare reviewed GST period summaries from approved transactions.

Required controls:

- Client selector.
- Period start.
- Period end.
- Filing type.
- Generate summary.

Required summary values:

- Sales taxable amount.
- Purchase taxable amount.
- Output CGST.
- Output SGST.
- Output IGST.
- Input CGST.
- Input SGST.
- Input IGST.
- Net tax payable.
- Mismatch count.
- Missing document count.
- Readiness status.

Statuses:

- `open`
- `missing_documents`
- `needs_review`
- `ready`
- `exported`
- `filed_future`

Rule:

Only approved transactions feed GST summaries.

### Reports

Purpose:

Give CA users a high-level reporting hub.

Required content:

- Approved transaction count.
- GST summaries created.
- Export history shortcut.
- Pending operational issues.

Actions:

- Go to exports.
- Generate GST summary.
- Open review queue.

### Exports

Purpose:

Generate and download traceable export files.

Export types:

- `csv_transactions`
- `gst_summary`
- `pdf_summary`

Required fields:

- Export type.
- Client.
- Period start.
- Period end.

Required export history columns:

- Type.
- Client.
- Status.
- Requested date.
- Completed date.
- Download action.

Rules:

- Transaction CSV uses approved transactions only.
- Export files are private.
- Downloads must verify firm membership.
- Export creation must be audit logged.

### Audit Logs

Purpose:

Give the firm traceability over sensitive actions.

Required columns:

- Time.
- Actor.
- Action.
- Entity type.
- Entity id.
- Client.

Filters:

- Action.
- Entity type.
- Client.
- Date.

Tracked actions:

- Client created/updated/archived.
- AI extraction completed.
- Transaction updated/approved/rejected/duplicate.
- Ledger corrected.
- GST summary generated.
- Export requested/completed.
- Processing job manually run.

### Operations

Purpose:

Help admins and staff diagnose workflow failures.

Required sections:

- Queued/processing count.
- Failed jobs count.
- Processing job table.

Job table columns:

- Job type.
- Client.
- Status.
- Attempts.
- Last error.
- Created date.
- Action.

Actions:

- Run AI extraction job now.
- Refresh.

Important rule:

Errors must be visible. Do not silently redirect after failed server actions.

### Settings

Purpose:

Manage firm profile and integration readiness.

Required sections:

- Firm profile.
- Workspace members.
- Supabase readiness.
- WhatsApp readiness.
- AI extraction provider readiness.
- Worker/cron readiness.

### Platform

Purpose:

Show long-term integration roadmap without implying unavailable features are live.

Allowed future modules:

- GST provider integration.
- Tally sync.
- Zoho Books sync.
- QuickBooks sync.
- Banking reconciliation.
- Billing.
- Analytics.

Required copy rule:

Use roadmap or planned language unless integration is implemented and verified.

## Data And Content Mapping

### WhatsApp To Review Queue

```txt
whatsapp_messages
-> documents
-> processing_jobs
-> ai_extractions
-> transactions
```

### Review Queue To Ledger

```txt
transactions.status = approved
-> ledger_entries row
-> audit_logs row
```

### Ledger To GST Summary

```txt
approved transactions
-> gst_periods
-> gst_summaries
```

### GST Summary To Exports

```txt
gst_summaries / approved transactions
-> exports
-> private file download
-> audit_logs
```

## Status Language

### AI And Document Statuses

- Received.
- Queued.
- Extracting.
- Needs Review.
- Failed.
- Rule-Based Extraction.
- AI Provider Unavailable.
- OCR Required.

### Transaction Statuses

- Draft.
- Needs Review.
- Approved.
- Rejected.
- Duplicate.
- Exported.

### GST Statuses

- Open.
- Missing Documents.
- Needs Review.
- Ready.
- Exported.
- Filed Future.

## Empty States

### No Clients

```txt
Add your first client to start WhatsApp document intake.
```

### No Inbox Messages

```txt
Connect the Meta webhook and link client WhatsApp numbers before documents appear here.
```

### No Review Queue Items

```txt
No extracted transactions need review right now.
```

### No Ledger Entries

```txt
Approve a review queue transaction to create a ledger handoff record.
```

### No GST Summaries

```txt
Generate a GST summary after approved transactions exist for a client and period.
```

### No Exports

```txt
Create a transactions CSV or GST summary export after approved data exists.
```

## Error States

### AI Credit Error

```txt
OpenAI extraction is unavailable. KhataOne can use rule-based text extraction for simple WhatsApp messages, but CA review remains required.
```

### WhatsApp Unmatched Sender

```txt
This WhatsApp number is not linked to a client yet.
```

### Approval Failure

```txt
Could not approve transaction. Check transaction status constraints, ledger handoff rules, and firm permissions.
```

### Export Failure

```txt
Could not create export. Confirm approved transactions, storage configuration, and firm access.
```

## Acceptance Criteria

### Landing Page Done

- Visitor understands KhataOne in first viewport.
- CTA routes to implemented signup/demo flow.
- Workflow shows WhatsApp, AI extraction, CA review, GST/report output.
- Trust section includes auditability and firm isolation.
- No unavailable feature is described as live.
- Mobile layout is readable and non-overlapping.

### Dashboard Done

- Protected routes require login.
- Active firm context is respected.
- Sidebar navigation covers core modules.
- Each module has loading, empty, error, and data states where applicable.
- Financial values use monospace and right alignment.
- Statuses are clear and consistent.
- Review actions are auditable.
- Ledger handoff is traceable to source transaction.
- GST summaries use approved transactions only.
- Exports are private and traceable.

### Production v1 Done

- CA can sign up, onboard firm, and add clients.
- WhatsApp messages create matched documents.
- Extraction creates reviewable transactions.
- CA can review, edit, approve, reject, duplicate, and request clarification.
- Approval creates ledger handoff.
- GST summary can be generated from approved data.
- CSV/PDF exports work.
- Audit logs show key actions.
- Operations page shows job failures and retries.

## Build Priorities

1. Landing page that clearly communicates the CA-first WhatsApp workflow.
2. Auth, onboarding, and dashboard shell.
3. Client management.
4. WhatsApp inbox.
5. Review queue and transaction detail.
6. Ledger handoff.
7. GST summary.
8. Reports and exports.
9. Audit logs and operations.
10. Settings and platform roadmap.

## Non-Negotiables

- Preserve source documents and raw inbound WhatsApp events.
- Keep AI output reviewable.
- Never auto-approve accounting entries.
- Keep firm data isolated.
- Do not claim direct GST filing as live.
- Show errors clearly.
- Make operational screens dense, precise, and useful for daily CA work.
