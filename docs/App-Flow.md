# KhataOne App Flow

## Public Landing Page Flow

1. Visitor opens KhataOne landing page.
2. Visitor understands the promise: WhatsApp-first AI bookkeeping and GST workflow for CA firms.
3. Visitor sees the workflow: client sends documents, AI extracts, CA reviews, GST/report outputs are prepared.
4. Visitor clicks primary CTA: book demo, join waitlist, or start signup.
5. Visitor submits contact/signup details.
6. System creates lead, account request, or firm workspace depending on launch mode.

## CA Onboarding Flow

1. CA signs up or receives invitation.
2. CA verifies email/phone if required.
3. CA creates firm profile.
4. CA configures firm details, team members, and default GST/report settings.
5. CA adds first client.
6. System generates WhatsApp onboarding instructions for the client.
7. Client begins sending documents through WhatsApp.

## Client Setup Flow

1. CA opens Clients.
2. CA clicks Add Client.
3. CA enters business name, contact name, phone number, GSTIN, state, filing frequency, and assigned staff.
4. System validates required fields.
5. System stores client and links WhatsApp sender number.
6. CA sends onboarding message or QR/invite instructions.
7. Client status becomes active after first valid WhatsApp interaction.

## WhatsApp Document Flow

1. Client sends message, image, PDF, audio, or document to KhataOne WhatsApp number.
2. WhatsApp Cloud API sends webhook event.
3. KhataOne verifies webhook authenticity.
4. System stores raw event.
5. System matches sender to firm and client.
6. System downloads media if present.
7. System creates document record.
8. System starts AI extraction job.
9. System sends acknowledgment to client if appropriate.
10. Extracted data appears in CA review queue.

## AI Extraction Flow

1. Processing job receives document record.
2. System prepares input based on document type.
3. OCR/transcription/text extraction runs where needed.
4. OpenAI extracts structured accounting fields.
5. System validates output against schema.
6. System computes confidence and risk flags.
7. System creates draft transaction or marks document unclear.
8. System routes item to approved-ready, needs-review, duplicate-risk, or clarification-needed state.

## CA Review Flow

1. CA opens Review Queue.
2. CA filters by client, GST period, document type, risk, or confidence.
3. CA opens an item.
4. CA views original document and extracted fields side by side.
5. CA edits fields if needed.
6. CA approves, rejects, marks duplicate, or requests client clarification.
7. System writes audit log.
8. Approved item moves into ledger.

## Ledger Flow

1. CA opens client ledger.
2. System shows approved and draft transaction views.
3. CA searches, filters, edits, or exports entries.
4. Changes are logged.
5. Ledger entries feed GST summaries and reports.

## GST Summary Flow

1. CA selects client and filing period.
2. System aggregates sales, purchases, tax amounts, GST categories, and eligible ITC.
3. System highlights missing documents, mismatches, invalid GSTIN fields, and low-confidence transactions.
4. CA resolves pending issues.
5. Filing period becomes ready for export.
6. CA downloads GST summary or export file.
7. Future: CA can push data through approved GST integration.

## Reporting And Export Flow

1. CA selects report type, client, and period.
2. System validates report readiness.
3. System creates export job.
4. Export file is generated and stored.
5. CA downloads CSV/PDF/Tally-ready file.
6. Export action is logged.

## Exception Flows

- Unknown WhatsApp sender: create unmatched inbound event and optionally send registration guidance.
- Low-confidence extraction: send to review queue.
- Duplicate invoice detected: flag for manual review.
- Missing GSTIN or invalid tax fields: flag in GST readiness.
- Failed media download: retry and show operational error.
- Failed AI extraction: allow manual entry and retry.
- Client clarification needed: send WhatsApp prompt and link response to original document.
