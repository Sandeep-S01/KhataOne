# KhataOne Business Requirements Document

## Business Overview

KhataOne is a WhatsApp-first AI accounting and GST workflow platform for Indian SMBs, operated through a CA and accounting firm console.

Small businesses often send invoices, receipts, bank statements, voice notes, and GST-related documents in scattered formats. CAs then spend significant time chasing documents, entering data, reconciling GST, preparing summaries, and reminding clients. KhataOne turns this messy document collection process into a structured workflow where business owners use WhatsApp and CAs manage review, compliance readiness, reporting, and exports through a professional dashboard.

## Business Goals

- Reduce manual bookkeeping effort for CA firms.
- Improve document collection rates from SMB clients.
- Convert unstructured WhatsApp messages into structured accounting records.
- Help CAs review exceptions instead of entering every transaction manually.
- Prepare GST summaries, mismatch views, and export-ready reports.
- Build a long-term platform foundation for direct GST integration when legally, technically, and commercially feasible.
- Create a trusted professional workflow that can support multiple firms, clients, users, roles, and audit logs.

## Target Customers

- Chartered accountants and CA firms serving Indian SMBs.
- Accounting practices that manage monthly bookkeeping and GST work.
- CA staff who process ledgers, reconcile data, and prepare filings.
- SMB owners who prefer sending documents on WhatsApp instead of using accounting software.

## User Problems

- Business owners do not maintain clean books in real time.
- Accounting documents are scattered across WhatsApp, email, PDFs, photos, voice notes, and bank statements.
- CAs spend time chasing clients before GST deadlines.
- Manual data entry creates delays and errors.
- GST summaries and purchase/sales mismatches are hard to track across many clients.
- Existing accounting tools can feel too complex for small business owners.

## Business Requirements

- The platform must provide a public landing page explaining KhataOne, its value, and its CA-first workflow.
- CA firms must be able to register, sign in, and manage their own firm workspace.
- Firm admins must be able to add clients and connect each client to a WhatsApp ingestion flow.
- Clients must be able to send receipts, invoices, text, audio, PDFs, and other accounting material through WhatsApp.
- The system must extract useful accounting data using AI and store it as draft transactions.
- CA users must be able to review, approve, edit, reject, and export transactions.
- The platform must show GST summaries and filing readiness by client and filing period.
- The platform must track missing documents, uncertain AI classifications, duplicate risks, and reconciliation issues.
- Reports and exports must be available in formats useful for CA workflows, including CSV, PDF, and future Tally-compatible exports.
- All important actions must be auditable.
- The architecture must support production-grade security, privacy, backups, observability, and future integrations.

## Success Metrics

- Reduction in manual data entry time per client.
- Percentage of client documents received through WhatsApp before monthly deadlines.
- Percentage of AI-extracted transactions approved without major correction.
- Number of clients managed per CA staff member.
- Time from document receipt to ledger-ready entry.
- GST summary preparation time per client.
- Monthly active CA firms and active business clients.
- Export completion rate and report usage rate.

## Scope For Production v1

- Landing page.
- CA authentication and firm workspace.
- Client management.
- WhatsApp webhook ingestion.
- AI extraction for common invoice, receipt, text, image, PDF, and audio inputs.
- Transaction review queue.
- Ledger and document storage.
- GST summaries and export-preparation views.
- Reports and CSV/PDF exports.
- Audit logs.
- Billing-ready subscription model foundation.
- Admin-ready operational monitoring foundation.

## Long-Term Scope

- Direct GST portal integration or integration through approved GST Suvidha Provider APIs.
- Advanced reconciliation with bank feeds and GSTR data.
- Tally, Zoho Books, QuickBooks, and ERP integrations.
- Multi-branch and multi-GSTIN businesses.
- CA staff productivity analytics.
- Client-facing WhatsApp confirmations and reminders.
- AI assistant for accounting and GST questions.
- Mobile companion experience if needed.

## Out Of Scope For Initial Production v1

- Direct GST filing submission unless compliance access and integration are finalized.
- Full ERP replacement.
- Payroll, inventory, HR, and advanced finance modules.
- Consumer personal finance.
- Full mobile app.
- Unreviewed autonomous filing or tax advice without CA oversight.

## Business Risks

- AI extraction errors can create accounting or compliance risk.
- WhatsApp API policy changes can affect message workflows.
- GST integration requirements may change.
- Sensitive financial data requires strong security and privacy controls.
- CAs need trust, traceability, and correction workflows before relying on automation.

## Positioning

KhataOne is not generic accounting software. It is an AI-native bookkeeping and GST operations layer for CA firms, with WhatsApp as the business-owner input channel and a professional dashboard as the CA control layer.
