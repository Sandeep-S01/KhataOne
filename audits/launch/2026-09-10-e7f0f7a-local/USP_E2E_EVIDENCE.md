# USP E2E Evidence

Core promise tested: SMBs use WhatsApp; KhataOne stores evidence and creates draft accounting records; authorized CAs review before ledger handoff, GST summary or export.

## Trace

Intended path:

```text
WhatsApp event -> durable intake -> client/firm resolution -> source storage -> processing job -> extraction -> draft/review -> authorized approval -> ledger handoff -> GST summary -> private export -> audit lineage
```

Code evidence:

- Webhook route reads the raw body and verifies `x-hub-signature-256` before parsing JSON: `src/app/api/webhooks/whatsapp/route.ts:72`.
- Webhook events are enqueued rather than synchronously processed: `src/app/api/webhooks/whatsapp/route.ts:93`.
- Sender matching avoids arbitrary client selection when multiple matches exist by returning a client only when exactly one match is found: `src/lib/whatsapp/ingestion.ts:188` and `src/lib/whatsapp/ingestion.ts:198`.
- AI extraction stores structured outputs and creates transactions through the extraction processor; media-only source text remains the key gap.
- Review action requires firm context and filters transaction by `firm_id`: `src/app/actions/review.ts:82`.
- Approval writes approval fields, creates a ledger handoff and audit log, but not atomically: `src/app/actions/review.ts:344` and `src/app/actions/review.ts:371`.
- GST summary generation selects only `status = approved` transactions: `src/app/actions/gst.ts:240`.
- Export download verifies the requesting firm before using service-role storage download: `src/app/api/exports/[exportId]/download/route.ts:48`.

## What Works By Code Inspection

- The product is implemented as a CA-controlled workflow rather than autonomous posting.
- Landing/auth/dashboard route surface exists and builds.
- Protected dashboard routes redirect unauthenticated users in local smoke testing.
- Raw webhook storage and asynchronous ingestion foundations exist.
- Text-first and rule-based extraction can create reviewable draft records.
- Review, ledger handoff, GST summary, export and audit-log foundations exist.

## What Is Not Proven

- Live WhatsApp delivery, current Meta retry behavior, outbound acknowledgments, and clarification delivery were not tested.
- OCR/PDF/audio extraction is not implemented to the promised production-v1 level.
- Multi-firm, multi-role, revoked-user and cross-tenant runtime denial tests were blocked.
- Human accounting accuracy, correction rate, document collection improvement and CA time-savings were not measured.
- No representative 100-document or 500-document labeled evaluation set was available.

## USP Verdict

Implementation status: `PARTIAL`.
Verification status: `BLOCKED/FAIL mixed`.
Evidence level: mostly `CODE_INSPECTED`, with local route smoke as `LOCAL_EXECUTED`.

KhataOne has the correct product shape and a substantial implementation foundation, but the full WhatsApp-first, AI-assisted, CA-controlled USP is not launch-proven end to end because media extraction and live multi-tenant runtime verification remain open gates.
