# KhataOne Product Requirements Document

## Product Idea

KhataOne helps CA firms manage bookkeeping and GST preparation for Indian SMB clients. Business owners send documents naturally through WhatsApp. KhataOne uses AI to extract, classify, and organize the accounting data. CA users then review exceptions, approve ledger entries, monitor GST readiness, and export reports from a web dashboard.

## Product Principles

- WhatsApp is the client input layer.
- The CA dashboard is the professional control layer.
- AI should accelerate work, not remove human accountability.
- Every important output must be reviewable and traceable.
- The interface must feel dense, precise, and ledger-like.
- Production v1 should prepare GST summaries and exports; long-term architecture should allow direct GST integration.

## Primary Personas

### CA Firm Owner

Needs to manage many clients, view firm-level workload, track pending reviews, monitor filing readiness, and ensure staff productivity.

### CA Staff / Accounting Operator

Needs to process transactions quickly, resolve AI exceptions, verify documents, reconcile entries, and prepare exports.

### SMB Owner

Needs to send receipts, invoices, PDFs, bank statements, and voice notes through WhatsApp without learning accounting software.

## Core User Stories

- As a CA, I can create my firm workspace so my team can manage clients securely.
- As a CA, I can add a client and connect them to a WhatsApp workflow.
- As a client, I can send accounting documents through WhatsApp.
- As a CA staff member, I can see documents that need review.
- As a CA staff member, I can approve, edit, reject, or request clarification on AI-extracted transactions.
- As a CA, I can see monthly GST readiness for each client.
- As a CA, I can export transactions, summaries, and reports.
- As a firm admin, I can view audit logs for user actions and AI decisions.

## Production v1 Features

### Landing Page

- Clear explanation of KhataOne for CA firms.
- Primary CTA for demo, waitlist, or signup.
- Product workflow section: WhatsApp input, AI extraction, CA review, GST/report outputs.
- Trust cues around security, auditability, and CA control.
- Responsive layout for desktop and mobile.

### Authentication And Workspace

- Firm signup and login.
- Role-ready model for firm owner, admin, staff, and viewer.
- Secure sessions with Supabase Auth.
- Protected dashboard routes.

### Client Management

- Create, edit, archive, and view clients.
- Store business name, GSTIN, contact number, WhatsApp number, state, filing frequency, and assigned staff.
- Client status: onboarding, active, pending documents, review needed, filing ready, archived.

### WhatsApp Ingestion

- WhatsApp Cloud API webhook endpoint.
- Message verification and signature validation.
- Support for text, image, document, audio, and metadata.
- Store raw message event and normalized document record.
- Send acknowledgment or clarification messages when needed.

### AI Extraction

- Extract vendor/customer, date, amount, tax amount, GSTIN, invoice number, category, payment mode, and confidence.
- Classify document type: purchase invoice, sales invoice, receipt, bank statement, expense, payment proof, unclear.
- Mark low-confidence outputs for review.
- Preserve original file and AI result for audit.

### Review Queue

- Filter by client, date, document type, status, confidence, and GST period.
- Side-by-side original document and extracted data.
- Edit extracted values.
- Approve, reject, duplicate-mark, or request clarification.
- Bulk actions for safe low-risk cases.

### Ledger

- Confirmed transaction list.
- Draft and review-needed statuses.
- Basic debit/credit or income/expense classification.
- Search and filters.
- Export selected period or client.

### GST Summary

- Monthly and quarterly summary by client.
- Sales, purchases, input tax credit, output tax, tax category, and mismatch flags.
- GSTIN validation-ready fields.
- Export-ready summary for CA review.
- Architecture prepared for future GST API integration.

### Reports And Exports

- CSV export.
- PDF summary export.
- Tally-compatible export target for later iteration.
- Export history and audit logging.

### Audit And Operations

- Track user actions, AI extraction results, approvals, edits, rejections, exports, and webhook events.
- Basic error and processing status visibility.
- Admin-friendly production tracker.

## Future Features

- Direct GST integration.
- Bank statement reconciliation.
- GSTR-2B/GSTR-1 comparison.
- WhatsApp-based client confirmations.
- Client reminders and missing document nudges.
- Staff productivity analytics.
- Multi-firm partner/admin console.
- Billing and subscription management.
- Tally and accounting software sync.

## Non-Functional Requirements

- Secure by default.
- Data isolated per firm.
- Scalable background processing.
- Reliable webhook handling and retries.
- Good performance on large transaction tables.
- Clear audit trail.
- Accessible web UI.
- Mobile-responsive landing page and usable dashboard basics.

## Release Criteria

- Landing page is live.
- CA can sign up and access dashboard.
- CA can add clients.
- WhatsApp messages can be received and stored.
- AI extraction creates reviewable draft records.
- CA can approve/edit/reject records.
- GST summaries can be generated.
- Exports work for selected clients and periods.
- Audit logs record key actions.
- Basic production monitoring and error handling exist.
