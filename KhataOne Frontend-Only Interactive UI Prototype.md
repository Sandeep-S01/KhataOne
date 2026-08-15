# KhataOne Frontend-Only Interactive UI Prototype

Act as a senior product designer and senior frontend engineer. Build a polished, high-fidelity, fully interactive frontend prototype for a product called **KhataOne**.

Do not merely describe the design. Build the complete prototype.

The prototype will be presented to senior stakeholders for approval of the product flow, information architecture, interactions, visual design, and operational states before backend development begins.

---

# 1. Product Summary

KhataOne is a WhatsApp-first, AI-assisted bookkeeping and GST workflow platform for Indian CA firms serving SMB clients.

The product workflow is:

> Client sends a WhatsApp message or document → KhataOne preserves and matches the source → AI or rule-based extraction prepares a draft → CA staff reviews and approves it → ledger handoff is created → GST readiness is calculated → approved data can be exported.

The product must always feel:

- Professional
- Trustworthy
- Operational
- Indian business-aware
- AI-assisted but CA-controlled
- Calm under accounting and GST deadline pressure

KhataOne is not:

- A consumer finance application
- A complete ERP replacement
- An autonomous accounting system
- A direct GST filing product in production v1
- A system that allows AI to approve accounting records

The most important product principle is:

> AI prepares a draft. The CA team makes the accounting decision.

---

# 2. Prototype Goal

Build one connected frontend application containing:

- A public marketing landing page
- Demo authentication
- Guided firm onboarding
- A complete CA dashboard
- Realistic mock accounting data
- Working filters and search
- Editable forms
- Drawers and dialogs
- Status transitions
- Simulated asynchronous jobs
- Role-aware interface behavior
- Loading, empty, error, success, and permission states
- Responsive desktop, tablet, and mobile layouts

This should be a working application, not a collection of disconnected screenshots.

A senior stakeholder should be able to navigate the complete workflow:

1. Understand the product from the landing page.
2. Enter the demo workspace.
3. Add or open a client.
4. View an inbound WhatsApp document.
5. Resolve an unmatched WhatsApp number.
6. Open an AI-generated draft.
7. Review and edit the accounting fields.
8. Approve the transaction.
9. See the resulting ledger handoff.
10. Inspect GST readiness.
11. Generate an export.
12. Trace the activity through the audit log.
13. Retry a failed processing job.

---

# 3. Strict Frontend-Only Constraints

This is a UI prototype only.

Do not:

- Connect Supabase
- Create a real database
- Add API routes
- Add server actions
- Connect Meta WhatsApp APIs
- Connect OpenAI
- Connect GST providers
- Request API keys
- Add real authentication providers
- Make external backend requests
- Claim that any real integration is currently active

Use:

- Typed local mock data
- Client-side state
- React Context with `useReducer`, or an equally simple local state solution
- `localStorage` to preserve demo actions between routes and page refreshes
- Simulated delays using client-side timers
- In-browser file generation for demo CSV exports
- A print-ready preview for PDF summary exports

Add a visible but unobtrusive label in the application shell:

> Prototype · Mock data only

Provide a **Reset demo data** action in Settings.

All interactions must work without a backend.

---

# 4. Preferred Frontend Stack

Use this stack when supported by the platform:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- `lucide-react` icons

When the platform does not support Next.js, use:

- React
- TypeScript
- Tailwind CSS
- React Router or the platform’s equivalent routing solution
- `lucide-react`

Additional requirements:

- Use reusable components.
- Use strict TypeScript types.
- Keep business data separate from presentation components.
- Avoid unnecessary dependencies.
- Do not use stock photographs.
- Do not rely on remote images.
- Build invoice previews with HTML and CSS.
- Resolve all compilation errors and broken imports.
- Do not stop after creating the landing page or dashboard shell.
- Complete all specified routes and key interactions.

A shadcn-style component library may be used if available, but customize it to match the KhataOne visual system. Do not leave it looking like a default template.

---

# 5. Product Voice and Copy Rules

Use direct, practical language used by CA firms.

Preferred words:

- Review
- Approve
- Ledger handoff
- GST readiness
- Missing documents
- Tax mismatch
- Source document
- Audit trail
- AI draft
- Rule-based extraction
- Export

Avoid vague SaaS language such as:

- Revolutionize your finances
- Magical automation
- Effortless compliance
- AI does everything
- One-click GST filing
- Fully autonomous accounting

Never say:

- AI-approved transaction
- Automatically posted to books
- File GST directly from KhataOne
- Tally integration connected
- Bank reconciliation live

Use this language consistently:

> AI draft

> Needs review

> Approve and create ledger handoff

> Only approved transactions are included

> Your CA team reviews this before it affects your books

---

# 6. Visual Design System

## Brand palette

Use these colors through CSS variables or equivalent design tokens:

- Page background: `#F7F5EF`
- Main surface: `#FFFFFF`
- Muted surface: `#F1EEE6`
- Primary text: `#1F2A24`
- Secondary text: `#5F6B63`
- Border: `#D8D2C4`
- Brand green: `#146B43`
- Brand green dark: `#0D4B31`
- Saffron accent: `#D98A1F`
- Ink accent: `#27323A`
- Success: `#168A4A`
- Warning: `#B7791F`
- Danger: `#B42318`
- Information: `#2563A8`

Do not use a generic purple or bright-blue SaaS theme.

Do not use large glowing gradients, glassmorphism, floating coins, AI orbs, or futuristic finance illustrations.

## Typography

Use:

- A clean sans-serif for navigation, headings, labels, and body text
- Monospace or tabular-number styling for:
  - Currency values
  - GSTINs
  - Invoice numbers
  - Phone numbers
  - Job IDs
  - Export IDs
  - Ledger amounts

Display financial values using Indian number formatting:

- `₹11,800.00`
- `₹1,18,000.00`
- `₹12,45,600.00`

Use dates such as:

- `11 Aug 2026`
- `12 Aug 2026, 10:42 AM IST`

Use uppercase GSTIN formatting.

## Component style

Use:

- Compact professional tables
- Approximately 44–48 pixel table rows
- Restrained border radius
- Fine borders
- Minimal shadows
- Clear filters
- Sticky table headers
- Sticky action areas where useful
- Right-aligned financial values
- Status chips containing both icon and text
- Split-pane layouts for document review
- Drawers for contextual detail
- Dialogs for sensitive decisions

Avoid:

- Oversized cards
- Excessive empty space
- Huge decorative dashboards
- Important actions hidden only on hover
- Charts that occupy more space than actual work queues
- Using pill shapes for every control

Use `lucide-react` icons throughout.

---

# 7. Status System

Do not combine unrelated concepts into one badge.

Display these concepts separately.

## Workflow status

- Received
- Processing
- Needs review
- Approved
- Rejected
- Duplicate
- Exported

## Extraction method

- AI extracted
- Rule-based
- Manually entered
- OCR required

## Risk level

- Low risk
- Review recommended
- High risk

## Processing-job status

- Queued
- Running
- Completed
- Failed
- Retry scheduled

Example transaction summary:

> Needs review · Rule-based extraction · High risk

Status must never rely on color alone. Include text and, where useful, an icon.

---

# 8. Route Structure

Create these routes or equivalent routes in the selected framework:

- `/` — Marketing landing page
- `/login` — Demo login
- `/onboarding` — Guided onboarding
- `/app` — Redirect to Overview
- `/app/overview`
- `/app/clients`
- `/app/clients/[clientId]`
- `/app/inbox`
- `/app/review`
- `/app/review/[transactionId]`
- `/app/ledger`
- `/app/ledger/[entryId]`
- `/app/gst`
- `/app/reports`
- `/app/exports`
- `/app/audit-logs`
- `/app/operations`
- `/app/settings`

Navigation and deep links must work.

Use client-side route protection for the prototype:

- When no demo session exists, `/app/*` redirects to `/login`.
- Demo login creates a local session.
- Sign out clears only the demo session.
- Reset demo data is a separate action.

---

# 9. Public Landing Page

The landing page must communicate the product within the first viewport.

## Navigation

Include:

- KhataOne logo or wordmark
- Product
- How it works
- GST readiness
- Security
- FAQ
- Sign in
- Start workspace

Use a simple product logo based on a ledger, document, or checked book icon. Do not create a complex illustration.

The navigation should be sticky on desktop and collapse into a mobile menu.

## Hero

Use this exact content or a very close equivalent.

Eyebrow:

> Built for CA firms serving Indian SMBs

Headline:

> Turn client WhatsApp documents into review-ready books.

Supporting text:

> Collect invoices, receipts, PDFs, and messages on WhatsApp. KhataOne prepares reviewable accounting drafts while your CA team verifies the details, approves ledger handoffs, prepares GST summaries, and exports the final data.

Trust line:

> AI-assisted. CA-approved. Audit-ready.

Primary CTA:

> Start workspace

Secondary CTA:

> Book demo

Supporting microcopy:

> No accounting entry is created without CA review.

The Start workspace button should route to `/login`.

The Book demo button should open a working modal containing:

- Name
- Firm name
- Work email
- Phone number
- Team size
- Message

Submitting the form should show a frontend-only confirmation state.

## Hero visual

Build an actual workflow-style product visual, not an abstract illustration.

Show three connected panels:

### WhatsApp intake

Message:

> Invoice INV-301 from ABC Traders dated 11 Aug 2026 total 11800 taxable 10000 CGST 900 SGST 900

### AI draft

Show extracted fields:

- Invoice number: INV-301
- Date: 11 Aug 2026
- Taxable amount: ₹10,000.00
- CGST: ₹900.00
- SGST: ₹900.00
- Total: ₹11,800.00
- Party GSTIN: Missing

Show:

- AI extracted
- Review recommended
- Missing GSTIN warning

### CA review

Show:

- Original source preserved
- One warning
- Approve and create ledger handoff
- Request clarification

On mobile, stack the panels vertically.

## Product proof strip

Show three concise statements:

- Clients continue using WhatsApp
- AI prepares reviewable drafts
- CAs remain in control

## Problem section

Heading:

> Your clients already send documents on WhatsApp. The problem is what happens next.

Show four practical problems:

- Documents arrive late and scattered across chats.
- PDFs, images, messages, and voice notes require manual sorting.
- Staff repeatedly enter the same accounting information.
- Missing documents are often discovered close to GST deadlines.

Use restrained visual cards representing messages, invoices, and spreadsheets.

## Four-step workflow

Show a connected process:

1. Client sends documents on WhatsApp
2. KhataOne stores and matches the source
3. AI prepares draft accounting fields
4. CA reviews, approves, and exports

Use a horizontal connected flow on desktop and a vertical timeline on mobile.

## Review-first product section

Heading:

> AI does the first pass. Your CA team makes the decision.

This should be the largest product section.

Show:

- Original invoice
- Extracted fields
- Field-level validation
- Tax calculation check
- Duplicate warning
- Reviewer edits
- Approval action
- Activity history

Do not use a generic chart dashboard in this section.

## GST readiness section

Heading:

> See what is blocking GST readiness before the deadline.

Show one realistic client-period card containing:

- Approved transactions
- Pending reviews
- Missing documents
- Tax mismatches
- Input tax
- Output tax
- Net tax payable
- Readiness status

Use this message:

> Prepare GST summaries and export-ready data from approved transactions.

Include a smaller clarification:

> Direct GST filing is not part of the current production workflow.

## CA workspace section

Group the product into four workflow areas.

### Capture

- Clients
- WhatsApp Inbox

### Review

- AI extraction
- Review Queue

### Account

- Ledger handoff
- GST Summary

### Control

- Exports
- Audit Logs
- Operations

Use realistic product previews and not generic feature icons alone.

## WhatsApp clarification section

Show this conversation:

Client:

> Invoice INV-301 from ABC Traders dated 11 Aug 2026 total 11800 taxable 10000 CGST 900 SGST 900

KhataOne:

> KhataOne received your document. Your CA team will review it before it affects your books.

CA clarification:

> Please share the GSTIN or invoice copy for this transaction.

Show that the clarification is connected to the original transaction.

## Trust section

Use buyer-friendly trust statements:

### Firm-isolated access

> Users see only the firms and clients assigned to their workspace.

### Private source documents

> Original documents and generated exports are designed to remain protected.

### Complete activity history

> Edits, approvals, corrections, retries, and exports remain traceable.

### Reviewable AI output

> The extraction method, warnings, source, and final CA decision remain visible.

Because this is a frontend prototype, do not state that live security controls are already implemented. The interface may mention that the intended production architecture uses authentication, firm membership, private storage, and row-level security.

## Integration roadmap

Show cards labelled clearly as planned:

- GST provider integration — Planned
- Tally sync — Planned
- Zoho Books sync — Planned
- QuickBooks sync — Planned
- Banking reconciliation — Planned
- Billing and subscriptions — Planned

Do not show active Connect buttons for planned integrations.

## FAQ

Include:

- Does KhataOne file GST directly?
- Does AI approve accounting transactions?
- What happens when extraction fails?
- Can multiple team members work in one firm?
- Are source documents retained?
- Can an approved ledger mapping be corrected?
- How are exports controlled?

## Final CTA

Heading:

> Keep client collection simple. Make CA review structured.

Actions:

- Start workspace
- Book demo

---

# 10. Demo Authentication

Create a polished login page.

Include:

- KhataOne branding
- Email
- Password
- Sign in
- Continue as demo owner
- Continue as demo staff
- Back to website

Any valid-looking email and non-empty password may create a demo session.

The demo role buttons should create predefined sessions.

Demo users:

- Ananya Rao — Owner
- Karan Shah — Admin
- Priya Nair — Staff
- Vikram Desai — Viewer

After first login, route to `/onboarding`.

Also include:

> Enter existing demo workspace

This can route directly to `/app/overview` for presentation convenience.

---

# 11. Guided Onboarding

Create a working multi-step onboarding wizard.

Use a visible progress indicator.

## Step 1: Create firm workspace

Fields:

- Firm name
- Contact email
- Contact phone
- City
- State
- Timezone

Pre-fill timezone as:

> Asia/Kolkata

## Step 2: Invite team

Fields:

- Team member name
- Email
- Role

Allow adding and removing invitation rows.

Include a Skip for now action.

## Step 3: Add first client

Fields:

- Business name
- Contact name
- Phone
- WhatsApp phone
- GSTIN
- Filing frequency
- State
- Status

Validate GSTIN format visually.

## Step 4: Connect WhatsApp

This is simulated.

Show:

- WhatsApp business number
- Webhook status
- Verification status
- Test connection

The button should simulate:

> Checking connection → Connected

Clearly label the integration as a prototype simulation.

## Step 5: Send a test message

Show a sample WhatsApp message and an animated processing timeline:

- Message received
- Sender matched
- Document preserved
- Extraction queued
- Draft prepared
- Ready for review

## Step 6: Review first draft

Show a simplified review form.

The user can approve it or continue without approval.

## Step 7: Workspace ready

Show:

- Firm created
- First client added
- WhatsApp simulation connected
- First message processed
- Review workflow available

Primary action:

> Open workspace

Persist onboarding completion locally.

---

# 12. Global Dashboard Shell

## Sidebar

Use a persistent sidebar on desktop.

At the top include:

- KhataOne logo
- Firm switcher
- Prototype badge

Use this grouped navigation.

### Work

- Overview
- Inbox
- Review Queue

### Clients

- Clients

### Accounting

- Ledger
- GST Summary

### Output

- Reports
- Exports

### Administration

- Audit Logs
- Operations
- Settings

Do not create a separate primary Platform page. Put planned integrations inside Settings.

Show actionable badges:

- Inbox: `4 unmatched`
- Review Queue: `8`
- Operations: `2 failed`

Badges should represent work needing attention, not total database records.

Include:

- Collapse sidebar action
- User profile
- Current role
- Sign out

On tablet and mobile, use an accessible navigation drawer.

## Top bar

Include:

- Breadcrumb or page title
- Global search or command palette
- Client context when relevant
- GST period context when relevant
- Attention or notification button
- Demo guide button
- User menu

The global search should find:

- Client
- GSTIN
- Phone number
- Invoice number
- Export ID
- Job ID

Selecting a result should navigate to the relevant screen.

## Demo guide

Create a small guide drawer containing direct links to these presentation flows:

1. Resolve unmatched WhatsApp sender
2. Review high-risk invoice
3. Approve transaction
4. Inspect ledger handoff
5. Review GST blockers
6. Generate export
7. Retry failed job

---

# 13. Overview Page

The Overview page is a daily command centre, not a generic analytics dashboard.

## Header

Include:

- Overview
- Current firm
- Period selector
- Add client
- Open review queue

Use August 2026 as the default demo period.

## Attention strip

Show clickable items:

- 4 unmatched WhatsApp senders
- 2 failed processing jobs
- 3 high-risk reviews
- 2 GST periods with blockers

Each item should open the correctly filtered destination.

## Workload cards

Show:

- Needs review
- Oldest pending review
- Documents processing
- Clients needing action

Each card should include useful context.

Example:

> 8 need review  
> 3 have been waiting more than two days

## Client readiness matrix

Use rows for clients and columns for:

- Document intake
- Pending review
- GST readiness
- Latest export

Each cell should be clickable.

## Recent activity

Show:

- Recent WhatsApp intake
- Recent approvals
- Recent ledger corrections
- Recent exports
- Processing failures

Do not fill the page with decorative charts.

A maximum of two small charts may be used in Reports, but not as the primary Overview content.

---

# 14. Clients Page

## Client list

Create a searchable, sortable, filterable table.

Columns:

- Business name
- Contact
- Phone
- WhatsApp number
- GSTIN
- Filing frequency
- Status
- Last activity
- Updated date
- Actions

Filters:

- All
- Onboarding
- Active
- Missing documents
- Review needed
- GST ready
- Archived

Actions:

- Add client
- Open details
- Edit
- Archive

Do not permanently delete a client.

Archive requires a confirmation dialog explaining the effect.

## Add and edit client

Use a drawer or modal.

Include validation and working save behavior.

Saving should:

- Update the client list
- Add an audit event
- Show a success message

## Client detail

Use a persistent client header containing:

- Business name
- GSTIN
- WhatsApp mapping
- Filing frequency
- Status
- Last intake date

Tabs:

- Overview
- Documents
- Transactions
- Ledger
- GST
- Exports
- Activity
- Settings

The Overview tab should show current-period readiness, not only profile information.

---

# 15. WhatsApp Inbox

The Inbox should feel like an intake triage workspace, not a WhatsApp chat clone.

## Tabs

- All
- Unmatched
- Processing
- Failed
- Ignored

## Table columns

- Received time
- Sender
- Matched client
- Message or file type
- Content preview
- Processing status
- Related transaction or job
- Actions

## Message detail drawer

Clicking a row should open a drawer showing:

- Original message
- Media or invoice preview
- Sender
- Matched client
- WhatsApp phone
- Processing timeline
- Related document
- Related job
- Related extraction
- Related transaction
- Activity history

## Unmatched sender flow

For an unmatched message, provide:

- Search existing clients
- Select client
- Confirm phone-number mapping
- Checkbox to reprocess previous messages from the number
- Link and reprocess action

After linking:

- Update the message status
- Add the phone mapping
- Simulate reprocessing
- Add an audit event
- Show success feedback

## Failed media flow

Provide:

- Error summary
- Technical details
- Retry media download

Retry should transition:

> Failed → Queued → Processing → Downloaded

Include a demo failure toggle so the retry can also end in Failed.

---

# 16. Review Queue

This is the most important product area.

## Review list

Create saved views:

- All pending
- High risk
- Low confidence
- Possible duplicates
- Tax mismatch
- Rule-based extraction
- Waiting for clarification

Table columns:

- Client
- Transaction type
- Invoice number
- Party
- Date
- Amount
- Workflow status
- Extraction method
- Risk
- Updated time
- Reviewer
- Actions

Filters:

- Client
- Status
- Risk
- Extraction method
- GST period
- Transaction type
- Reviewer

Sorting:

- Highest risk
- Oldest first
- Highest amount
- Client
- GST period

Do not include bulk approval.

Rows should open `/app/review/[transactionId]`.

---

# 17. Review Workbench

Create a highly polished transaction-review workspace.

## Header

Show:

- Client
- Transaction type
- Invoice number
- Amount
- Workflow status
- Extraction method
- Risk level
- Previous item
- Next item
- Return to queue

## Desktop layout

Use a split layout.

### Left side: source

Show:

- Original WhatsApp message
- Invoice or receipt preview
- PDF or image controls
- Page navigation
- Zoom controls
- Download source
- Source message metadata
- Source and activity timeline

Build the invoice preview with HTML and CSS.

Where practical, selecting an extracted field should visually highlight the related source value in the invoice.

### Right side: editable accounting form

Group fields into sections.

#### Transaction identity

- Type
- Date
- Invoice number
- Description

#### Party and GST

- Party name
- Party GSTIN
- Place of supply

#### Classification

- Category
- Ledger mapping suggestion
- Payment mode

#### Tax calculation

- Taxable amount
- CGST
- SGST
- IGST
- Cess
- Total

## Field-level review

Each extracted field may show:

- Extracted value
- Confidence
- Validation state
- Source reference
- Edited marker

Implement realistic validation warnings:

- GSTIN missing
- GSTIN format invalid
- Invoice number missing
- Taxable amount plus tax does not equal total
- CGST and SGST used where IGST may be expected
- Possible duplicate invoice
- Invoice date outside selected GST period
- Party information mismatch
- Amount differs from source

Do not show confidence alone. Explain why a field needs review.

## Review summary

Show:

- Risk reasons
- Extraction method
- Extraction timestamp
- Source message
- Related document
- Validation results
- Similar transaction warning
- Reviewer activity

## Sticky decision bar

Include:

- Save edits
- Request clarification
- Reject
- Mark duplicate
- Approve and create ledger handoff

Approval should be visually prominent but never automatic.

## Action behavior

### Save edits

- Save locally
- Mark changed fields
- Add audit event
- Show success feedback

### Request clarification

Open a message composer with a suggested message:

> Please share the GSTIN or invoice copy for this transaction.

Allow editing.

Submitting should:

- Add a clarification event
- Show a simulated sent message
- Set a secondary state of Waiting for clarification

### Reject

Require a rejection reason.

### Mark duplicate

Require the user to select or confirm the possible original transaction.

### Approve

Validate required fields first.

When approved:

- Change transaction status to Approved
- Create exactly one ledger handoff
- Prevent duplicate ledger creation if approval is clicked again
- Add an audit event
- Update Overview counts
- Remove the item from pending Review Queue views
- Make it available in GST calculations
- Show a link to the created ledger entry
- Offer Open next review item

## Unsaved changes

If the reviewer edits a field and navigates away, show:

- Save changes
- Discard changes
- Stay on page

## Mobile behavior

On mobile, replace the split layout with tabs:

- Source
- Accounting fields
- Review summary

Keep the decision actions in a sticky bottom bar.

---

# 18. Ledger

## Ledger list

Columns:

- Date
- Client
- Account
- Source invoice
- Party
- Debit
- Credit
- Mapping status
- Created by
- Action

Filters:

- Client
- From date
- To date
- Account
- Mapping status

## Ledger detail

Show:

- Debit and credit lines
- Source transaction
- Original source document
- Reviewer approval
- Created timestamp
- Mapping history
- Corrections
- Source lineage timeline

## Correct ledger mapping

Use a focused drawer or dialog.

Require:

- Existing account
- Corrected account
- Reason for correction
- Preview of the change

Show this clarification:

> This changes only the ledger handoff. The source transaction and original extraction remain preserved.

Saving should:

- Update the ledger entry
- Add mapping history
- Add an audit event
- Leave the source transaction unchanged
- Show success feedback

---

# 19. GST Summary Workspace

The GST page should be a client-and-period closing workspace, not a basic report form.

## Header

Include:

- Client selector
- Period selector
- Filing frequency
- Current readiness
- Last generated time
- Generate or regenerate summary
- Export

## Readiness area

Show blockers before totals:

- Transactions awaiting review
- Missing documents
- Possible duplicates
- Tax mismatches
- Failed document processing

Every blocker should be clickable and open the relevant filtered records.

## Tax totals

Group into:

### Sales

- Taxable amount
- Output CGST
- Output SGST
- Output IGST

### Purchases

- Taxable amount
- Input CGST
- Input SGST
- Input IGST

### Current position

- Net tax payable
- Mismatch count
- Missing-document count
- Readiness state

All values must be right-aligned and formatted using Indian number grouping.

Display this rule prominently:

> Only approved transactions are included in this summary.

## Drill-down

Clicking a GST total should open a drawer listing the approved transactions contributing to that value.

## Generate summary

When selected:

- Show calculating state
- Derive totals from approved mock transactions
- Ignore Needs review, Rejected, and Duplicate transactions
- Create or update a mock GST period
- Add an audit event
- Show completion state

Do not present a direct GST filing action.

---

# 20. Reports

Keep Reports focused and operational.

Show:

- Approved transaction count
- Transaction value by type
- GST summaries created
- Client readiness distribution
- Pending operational issues
- Recent export activity

Use mostly scorecards and tables.

At most two compact charts may be included.

Every report summary should link to the underlying records.

Actions:

- Open Review Queue
- Generate GST Summary
- Go to Exports

---

# 21. Exports

## Export creation

Use a drawer or focused form.

Fields:

- Export type
- Client
- Period start
- Period end
- File format

Export types:

- Transactions CSV
- GST summary
- PDF summary

Before generation, show a preview such as:

> This export will include 14 approved transactions.

Only approved transactions may be included.

## Generation behavior

Simulate:

> Queued → Generating → Ready

Also allow a Failed state through demo controls.

## Downloads

For Transactions CSV:

- Generate a real CSV in the browser using approved local mock data
- Trigger a working file download

For PDF Summary:

- Open a professional print-ready summary view
- Allow the browser’s Print or Save as PDF flow

## Export history

Columns:

- Export ID
- Type
- Client
- Period
- Requested by
- Requested time
- Status
- Completed time
- Download
- Actions

Statuses:

- Queued
- Generating
- Ready
- Failed
- Expired

Export creation should add an audit event.

A success toast alone is not sufficient. The created export must remain visible in history.

---

# 22. Audit Logs

Create a dense, traceable audit interface.

## Columns

- Time
- Actor
- Action
- Client
- Entity type
- Entity ID
- Result
- Actions

## Filters

- Actor
- Action
- Entity type
- Client
- Date range

## Tracked actions

Include examples of:

- Client created
- Client updated
- Client archived
- WhatsApp sender linked
- AI extraction completed
- Transaction edited
- Transaction approved
- Transaction rejected
- Transaction marked duplicate
- Clarification requested
- Ledger mapping corrected
- GST summary generated
- Export requested
- Export completed
- Processing job manually run
- Processing job retried

## Detail drawer

Show:

- Human-readable action summary
- Actor and role
- Timestamp
- Related client
- Related entity
- Before and after values
- Source relationship
- Technical metadata in a collapsed section

Do not show only raw JSON.

---

# 23. Operations

Operations is available only to Owner and Admin roles.

## Health cards

Use understandable labels:

- WhatsApp intake
- Document storage
- AI extraction
- Background processing
- Export generation

Mock statuses:

- Operational
- Degraded
- Unavailable
- Setup required

Clearly label these as simulated prototype statuses.

## Processing jobs

Columns:

- Job ID
- Job type
- Client
- Status
- Attempts
- Last error
- Created time
- Last attempted time
- Action

Include:

- AI extraction
- Media download
- GST summary generation
- Export generation

## Job detail

Show:

- Processing timeline
- Related WhatsApp message
- Related document
- Error explanation
- Technical details
- Retry action

## Run now behavior

The Run now action must show the real simulated state transition:

> Queued → Running → Completed

Do not immediately show success before the simulated job completes.

Allow the demo to simulate:

> Queued → Running → Failed → Retry scheduled

---

# 24. Settings

Create these sections.

## Firm profile

- Firm name
- Contact information
- City
- State
- Timezone
- Default date format
- Default currency

## Team and roles

- Members
- Invitations
- Role
- Access status
- Last active
- Change role
- Remove access

## Integrations

Show prototype readiness cards for:

- WhatsApp
- AI extraction
- Document storage
- Background worker

Show planned cards for:

- GST provider
- Tally
- Zoho Books
- QuickBooks
- Banking reconciliation

Planned integrations must not have active Connect actions.

## Security and access

Show interface concepts for:

- Firm membership
- Role permissions
- Active sessions
- Export permission
- Operations access

Do not claim real security is active in the frontend prototype.

## Workspace readiness

Show a setup checklist:

- Firm profile complete
- First client added
- WhatsApp simulation connected
- Test message received
- AI extraction simulation available
- Background worker simulation active

## Demo controls

Include:

- Switch user role
- Switch firm
- Normal state
- Empty state
- Loading state
- Degraded AI state
- Failed export state
- Failed job state
- Reset demo data

---

# 25. Role-Aware Interface

Implement a role switcher in the user menu and Settings demo controls.

## Owner

Can:

- Access all pages
- Manage team
- Manage settings
- Review and approve
- Correct ledger
- Generate GST summaries
- Generate exports
- View audit logs
- Run and retry jobs

## Admin

Can:

- Access all operational pages
- Manage clients
- Review and approve
- Correct ledger
- Generate GST summaries
- Generate exports
- View audit logs
- Run and retry jobs
- View most settings

## Staff

Can:

- Access Overview
- Access Clients
- Access Inbox
- Access Review Queue
- Edit and approve transactions
- View ledger
- View GST
- Generate permitted exports
- View limited audit activity

Cannot:

- Manage team
- Change integrations
- Access sensitive workspace security settings

## Viewer

Can:

- View allowed pages and records

Cannot:

- Add or edit clients
- Link WhatsApp numbers
- Edit or approve transactions
- Correct ledger entries
- Generate exports
- Retry jobs
- Change settings

For restricted actions:

- Hide navigation that is never relevant to the role.
- Disable contextually visible restricted actions.
- Explain why the action is unavailable.

Example:

> Admin permission is required to retry this job.

---

# 26. Typed Mock Data

Create typed local entities for:

- Firm
- Firm user
- Client
- WhatsApp message
- Document
- Processing job
- AI extraction
- Transaction
- Ledger entry
- GST period
- GST summary
- Export
- Audit event

Preserve this relationship:

> WhatsApp message → document → processing job → extraction → transaction → approval → ledger entry → GST summary → export

Show this source lineage in transaction, ledger, GST, export, and audit detail views.

Seed enough data to make every screen useful:

- 2 firms
- 4 demo users
- 6–8 clients
- 14–18 inbox messages
- 10–14 transactions
- 6–8 pending reviews
- 8–12 ledger entries
- 3 GST periods
- 4–6 exports
- 18–25 audit events
- 6–10 processing jobs

All businesses and identifiers must be fictional.

Use these example firms:

- Rao & Mehta Chartered Accountants
- Sharma & Iyer LLP

Use these example clients:

- ABC Traders
- Mehta Hardware & Electricals
- Saanvi Textiles
- Northstar Business Services
- Kaveri Foods
- BluePeak Logistics

Use realistic fictional GSTIN-format values, Indian phone numbers, cities, and filing frequencies.

Include these sample transactions.

## Transaction 1

- Client: ABC Traders
- Party: Metro Paper Supplies
- Type: Purchase
- Invoice: INV-301
- Date: 11 Aug 2026
- Taxable: ₹10,000.00
- CGST: ₹900.00
- SGST: ₹900.00
- Total: ₹11,800.00
- Status: Needs review
- Extraction: AI extracted
- Risk: Review recommended
- Warning: Party GSTIN missing

## Transaction 2

- Client: Mehta Hardware & Electricals
- Party: Jalaram Steel
- Type: Purchase
- Invoice: MH-884
- Date: 10 Aug 2026
- Taxable: ₹48,000.00
- CGST: ₹4,320.00
- SGST: ₹4,320.00
- Total: ₹56,640.00
- Status: Approved
- Extraction: AI extracted
- Risk: Low risk

## Transaction 3

- Client: Saanvi Textiles
- Party: Elegant Retail
- Type: Sale
- Invoice: ST-1421
- Date: 9 Aug 2026
- Taxable: ₹75,000.00
- IGST: ₹13,500.00
- Total: ₹88,500.00
- Status: Needs review
- Extraction: Rule-based
- Risk: High risk
- Warning: Low-confidence party match

## Transaction 4

- Client: Kaveri Foods
- Party: GreenFarm Packaging
- Type: Purchase
- Invoice: KFS-904
- Date: 7 Aug 2026
- Taxable: ₹20,000.00
- CGST: ₹1,800.00
- SGST: ₹1,800.00
- Total: ₹23,600.00
- Status: Needs review
- Risk: High risk
- Warning: Possible duplicate invoice

Include a mix of:

- Approved
- Needs review
- Rejected
- Duplicate
- Processing
- OCR required
- Rule-based extraction
- Missing GSTIN
- Tax mismatch
- Out-of-period date
- Failed extraction

Keep derived counts consistent with the underlying data.

When the user performs an action, dynamically update:

- Overview counts
- Review Queue counts
- Client readiness
- Ledger entries
- GST totals
- Export record counts
- Audit events
- Operations counts

Do not hardcode KPI totals independently from the data.

---

# 27. Empty, Loading, Error, and Success States

Every major page must have:

- Loading skeleton
- First-use empty state
- Filtered empty state
- Populated state
- Processing state
- Error state
- Permission-restricted state

Use these messages where applicable.

## No clients

> Add your first client to start WhatsApp document intake.

## No inbox messages

> Connect the WhatsApp simulation and link client phone numbers before documents appear here.

## No review items

> No extracted transactions need review right now.

## No ledger entries

> Approve a Review Queue transaction to create a ledger handoff record.

## No GST summaries

> Generate a GST summary after approved transactions exist for a client and period.

## No exports

> Create a transactions CSV or GST summary export after approved data exists.

## AI unavailable

> AI extraction is unavailable. KhataOne can use rule-based text extraction for simple messages, but CA review remains required.

## Unmatched sender

> This WhatsApp number is not linked to a client yet.

## Approval failure

> Could not approve the transaction. Review the required fields, ledger handoff rules, and your current permissions.

## Export failure

> Could not create the export. Confirm that approved transactions exist and try again.

Use inline errors for field-level problems and persistent alerts for operational failures.

Do not silently redirect after an unsuccessful action.

---

# 28. Feedback and Interaction Patterns

Use:

- Inline form validation
- Success toasts
- Persistent updated records
- Confirmation dialogs
- Undo where safe
- Skeleton loading
- Empty-state actions
- Error recovery actions

Every visible button must do one of the following:

- Navigate
- Open a modal or drawer
- Change data
- Trigger a simulation
- Download a file
- Show an explained disabled state

Do not leave dead buttons.

Sensitive actions requiring confirmation:

- Archive client
- Reject transaction
- Mark duplicate
- Approve transaction
- Correct ledger mapping
- Remove team access
- Reset demo data

Use subtle animation, approximately 150–200 milliseconds.

Respect reduced-motion preferences.

---

# 29. Responsive Requirements

## Landing page

Design mobile-first.

Requirements:

- Hero is readable without overlap
- CTAs stack on small screens
- Workflow becomes vertical
- Navigation becomes a drawer
- Product previews remain legible
- No horizontal scrolling
- No hover-only information

## Dashboard

Design desktop-first but keep all core functionality accessible.

### Large desktop

- Full sidebar
- Split review workspace
- Dense tables
- Sticky source and decision areas

### Tablet

- Collapsible sidebar
- Two-pane layouts where possible
- Drawers for secondary content

### Mobile

- Navigation drawer
- Tables become cards or controlled horizontal tables
- Source and accounting review become tabs
- Decision actions remain sticky
- Forms use a single column
- Filters open in a sheet or drawer

Do not hide essential status or decision information on mobile.

---

# 30. Accessibility

Meet a strong WCAG AA-level design standard.

Include:

- Semantic headings
- Semantic table headers
- Visible keyboard focus
- Keyboard-accessible menus
- Accessible dialogs and drawers
- Focus trapping inside modals
- Return focus after closing
- Accessible names for icon buttons
- Labels for every form field
- Error messages linked to their fields
- Sufficient color contrast
- Status communicated by text, not color alone
- Touch-friendly controls on mobile
- Reduced-motion support

---

# 31. Prototype Presentation Quality

The application should feel credible during a senior review.

Add:

- Realistic populated screens
- Consistent source lineage
- Meaningful timestamps
- Realistic Indian accounting language
- Contextual empty and error states
- A Demo guide
- Role switching
- State simulation controls
- Reset demo data

Avoid:

- Lorem ipsum
- Placeholder headings such as “Feature 1”
- Unexplained mock charts
- Dead links
- Empty pages
- Inconsistent counts
- Generic dashboard copy
- Unavailable integrations shown as active
- Claims of direct GST filing
- Claims that AI approves transactions

---

# 32. Build Order

Build in this order, but complete the entire scope without asking for additional confirmation:

1. Design tokens and reusable components
2. Mock data and local state store
3. Routes and dashboard shell
4. Landing page
5. Login and onboarding
6. Overview
7. Clients
8. Inbox
9. Review Queue
10. Review Workbench
11. Ledger
12. GST Summary
13. Reports
14. Exports
15. Audit Logs
16. Operations
17. Settings
18. Responsive behavior
19. Role restrictions
20. Loading, empty, error, and demo states
21. Final compilation and interaction review

---

# 33. Final Acceptance Criteria

The prototype is complete only when all of these are true:

- The landing page clearly communicates the product in the first viewport.
- The landing-page CTAs work.
- Demo login works.
- Onboarding works from beginning to end.
- All dashboard routes work.
- The sidebar is grouped by operational workflow.
- Firm and user context is visible.
- Global search navigates to records.
- Overview cards open relevant filtered pages.
- Client creation and editing work.
- Unmatched WhatsApp numbers can be linked.
- Failed document processing can be retried.
- Review fields can be edited.
- Validation warnings are visible and understandable.
- Clarification requests can be simulated.
- Transactions can be rejected or marked duplicate.
- Approval creates one ledger handoff.
- Approval cannot create duplicate ledger entries.
- Ledger corrections preserve the original source transaction.
- GST totals are derived only from approved transactions.
- GST blockers link to the relevant records.
- CSV export downloads work in the browser.
- PDF summary has a print-ready view.
- Export status transitions are visible.
- Actions create audit events.
- Operations jobs transition through visible statuses.
- Role restrictions work.
- Empty, loading, error, and permission states exist.
- Important values use Indian number formatting.
- The application is responsive.
- There are no dead buttons.
- There are no backend calls.
- No unavailable feature is represented as live.
- AI output is always presented as reviewable.
- The complete source lineage remains visible.
- The project compiles without errors.

Build the complete frontend prototype now. Do not return only a design explanation, wireframe description, or implementation plan.