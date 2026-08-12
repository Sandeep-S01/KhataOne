# WhatsApp Help Menu Implementation Plan

## Goal

Add a safe first-version WhatsApp help/menu responder for simple greeting and help messages such as `hi`, `hello`, `hey`, `help`, `menu`, and `start`.

This should improve the SMB client experience by explaining what the user can currently do with KhataOne, without promising unfinished features such as automated P&L reports, direct GST filing, GSTIN validation commands, bank statement analysis, or Tally XML generation.

## Product Context

KhataOne is a WhatsApp-first AI accounting and GST workflow platform for Indian SMBs, operated by CA firms through a professional dashboard.

The WhatsApp user is usually the SMB client. The dashboard user is the CA or accounting team.

## Safe First-Version Scope

### In Scope

- Detect greeting/help messages:
  - `hi`
  - `hello`
  - `hey`
  - `help`
  - `menu`
  - `start`
  - common case-insensitive variants with punctuation, such as `Hi`, `hello!`, `HELP`.
- Send a KhataOne-branded help/menu message.
- Include the client business name when the sender is matched.
- Include KhataOne website URL:
  - `https://khataone.vercel.app/`
- Store the inbound WhatsApp message as usual for traceability.
- Avoid creating an AI extraction job for pure help/greeting commands.
- Mark the WhatsApp message processing status as handled/ignored rather than queued for extraction.

### Out Of Scope For This First Version

- Real `gst` command automation.
- Real `report` or `pl` command automation.
- Real `export` command automation.
- GSTIN validation and saving through WhatsApp.
- PDF bank statement extraction.
- Tally XML download links.
- Automatic accounting entry creation from short commands such as `add sale`.
- Natural-language chatbot conversations.
- Direct GST filing.

## Recommended Safe WhatsApp Reply

Use this copy for matched clients:

```txt
Hello {business_name}! Here is what you can do with KhataOne:

Send Documents
Upload invoices, receipts, PDFs, payment proofs, or accounting notes. Your CA team will review everything before it affects your books.

Send Invoice Text
Example:
Invoice INV-301 from ABC Traders dated 11 Aug 2026 total 11800 taxable 10000 CGST 900 SGST 900

Ask For Help
Type help anytime to see this menu again.

GST / Reports
Your CA team can prepare GST summaries, ledger handoff, reports, and exports from reviewed data inside KhataOne.

Website:
https://khataone.vercel.app/
```

Use this copy for unmatched senders:

```txt
Hello! This is KhataOne.

You can send invoices, receipts, PDFs, payment proofs, or accounting notes here. Your CA team reviews the data before it affects your books.

This WhatsApp number is not linked to a client workspace yet. Please ask your CA team to add your WhatsApp number in KhataOne.

Website:
https://khataone.vercel.app/
```

## Why This Copy Is Safe

- It says KhataOne can receive documents and accounting notes, which exists in the current WhatsApp ingestion flow.
- It says the CA team reviews data before it affects books, which matches the review-first product model.
- It says GST summaries, ledger handoff, reports, and exports are prepared inside KhataOne from reviewed data, which matches the dashboard direction.
- It does not promise direct GST filing, Tally XML, bank statement parsing, or command-based report generation.

## Existing Flow To Inspect Before Implementation

Before code changes, inspect:

- `src/app/api/webhooks/whatsapp/route.ts`
- `src/lib/whatsapp/ingestion.ts`
- `src/lib/whatsapp/client.ts`
- `src/lib/whatsapp/types.ts`
- `src/lib/ai/extraction-worker.ts`
- `src/lib/ai/extraction-processor.ts`
- `docs/App-Flow.md`
- `docs/Backend-Schema.md`

## Proposed Integration Point

Use the smallest correct integration point inside WhatsApp ingestion after:

1. webhook signature verification,
2. raw inbound event storage,
3. sender phone extraction,
4. client matching attempt,
5. message text extraction.

Then:

```txt
if inbound text is greeting/help command
  send help menu message
  update whatsapp_messages.processing_status = ignored or handled-equivalent
  do not create document
  do not create processing_jobs
  return success
else
  continue existing document/extraction flow
```

If there is no existing `handled` processing status, use existing `ignored` to avoid a schema migration for v1.

## Detection Rules

Normalize inbound text:

- trim whitespace,
- lowercase,
- remove simple punctuation around the word,
- collapse repeated spaces.

Match only simple standalone commands:

```txt
hi
hello
hey
help
menu
start
```

Do not match invoice text that merely contains one of these words.

Examples:

- `Hi` -> help menu
- `hello!` -> help menu
- `help` -> help menu
- `menu please` -> not v1 unless explicitly supported
- `Invoice from Hello Traders total 1000` -> normal document flow

## Data Handling

### Store Raw Event

Always preserve raw inbound WhatsApp event in `whatsapp_messages`.

### Matched Client

If sender matches a client:

- set `firm_id`,
- set `client_id`,
- send matched help message with business name.

### Unmatched Sender

If sender does not match:

- keep `firm_id` and `client_id` nullable,
- send unmatched help message,
- do not create a document.

### Processing Status

Use:

```txt
processing_status = ignored
```

Reason:

The message is valid and handled, but it should not enter accounting extraction.

## Audit And Traceability

For v1, the raw `whatsapp_messages` row is enough traceability.

No audit log is required because this is a client-side informational reply and does not mutate financial records.

Future version may add `audit_logs` for outbound system messages if needed.

## Failure Handling

If sending the help message fails:

- do not retry inside the webhook for a long time,
- preserve the inbound message,
- mark message as failed only if existing patterns support it,
- log structured operational error if available.

If WhatsApp outbound env is missing:

- do not break inbound storage,
- return webhook success after storing inbound event,
- log outbound failure.

## Test Cases

### Matched Sender

Input:

```txt
Hi
```

Expected:

- `whatsapp_messages` row exists.
- `firm_id` and `client_id` are populated.
- outbound WhatsApp help menu sent.
- no `documents` row created.
- no `processing_jobs` row created.

### Unmatched Sender

Input:

```txt
help
```

Expected:

- `whatsapp_messages` row exists.
- `firm_id` and `client_id` remain null.
- unmatched help message sent.
- no document/job created.

### Normal Invoice Text

Input:

```txt
Invoice INV-301 from ABC Traders dated 11 Aug 2026 total 11800 taxable 10000 CGST 900 SGST 900
```

Expected:

- existing document/extraction flow continues.
- help menu is not sent.

### Non-Accounting Chat Text

Input:

```txt
How are you?
```

Expected:

- v1 behavior remains unchanged unless separately scoped.

## Acceptance Criteria

- Greeting/help commands return KhataOne help menu.
- Matched client receives branded message with business name.
- Unmatched sender receives setup guidance.
- Help messages do not create review queue noise.
- Invoice/accounting text still flows to extraction.
- Raw inbound events remain stored.
- No direct GST filing or unbuilt command automation is promised.
- Existing webhook verification and client matching behavior remain intact.

## Future Enhancement Plan

### Phase 2

Add command routing for:

- `gst`
- `report`
- `export`

Only after the dashboard APIs can produce and authorize those outputs.

### Phase 3

Add GSTIN update command:

```txt
gstin 29ABCDE1234F1Z5
```

Only after validation, permission, audit, and client confirmation flows are implemented.

### Phase 4

Add manual entry commands:

```txt
add sale <amount> <description>
add purchase <amount> <description>
add expense <amount> <description>
```

Only after duplicate detection and CA review routing are implemented.

### Phase 5

Add richer document-type guidance and media-specific responses for PDFs, images, and payment proofs.
