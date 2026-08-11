# AI Extraction Fallback Layer Implementation Plan

## Goal

Allow KhataOne to keep creating reviewable accounting transactions even when OpenAI API credits are unavailable.

The immediate fallback should not depend on another paid AI API. For v1, add a deterministic text parser for simple WhatsApp invoice messages, then keep the architecture ready for additional providers later.

## Current Problem

OpenAI extraction can fail with:

```txt
429 You have no credits remaining.
```

When this happens today:

```txt
WhatsApp message -> document -> processing_job -> OpenAI failure -> failed job
```

The CA Review Queue may stay empty, even when the WhatsApp text includes enough clear accounting data.

## Target Behavior

Preferred target behavior:

```txt
Document queued
-> Try primary extractor
-> If OpenAI has no credits or is unavailable
-> Run deterministic fallback parser for text documents
-> Store ai_extractions row with fallback metadata
-> Create draft/needs_review transaction
-> Show item in Review Queue
```

The fallback must be conservative. It should extract only values clearly present in the message.

## Recommended Strategy

### Phase 1: No-Cost Deterministic Fallback

Build a local parser for WhatsApp text invoices.

Example supported input:

```txt
Invoice INV-301 from ABC Traders dated 11 Aug 2026 total 11800 taxable 10000 CGST 900 SGST 900
```

Fields to parse when clearly present:

- invoice number
- party name
- transaction date
- taxable amount
- CGST
- SGST
- IGST
- total amount
- rough transaction type
- description

Fallback output should use the existing `AccountingExtraction` schema.

Recommended confidence:

```txt
0.55 to 0.75
```

Recommended risk flags:

```txt
RULE_BASED_EXTRACTION
AI_PROVIDER_UNAVAILABLE
NEEDS_CA_REVIEW
```

This ensures records appear in Review Queue but are not treated as reliable final accounting data.

### Phase 2: Extractor Interface

Add a small provider interface:

```txt
extractAccountingData(document) -> AccountingExtractionResult
```

Providers:

```txt
openai
rule_based_text
```

Future providers can be added behind the same interface:

```txt
gemini
openrouter
local_model
```

Do not add a future provider until its API behavior, structured output support, cost, and environment variables are verified.

### Phase 3: Provider Order

Add environment-driven provider order:

```txt
AI_EXTRACTION_PROVIDER_ORDER=openai,rule_based_text
```

For current no-credit development, use:

```txt
AI_EXTRACTION_PROVIDER_ORDER=rule_based_text
```

This lets the app keep working without OpenAI credits.

### Phase 4: OpenAI Error Classification

Classify OpenAI errors:

- no credits / billing error
- rate limit
- invalid API key
- model unavailable
- malformed model response
- transient network failure

Fallback should run for:

- no credits
- rate limit
- transient provider failure

Fallback should not hide:

- schema bugs
- database write failures
- tenant mismatch
- duplicate safety failures

### Phase 5: Storage And Audit

Keep using existing tables:

- `documents`
- `ai_extractions`
- `transactions`
- `processing_jobs`
- `audit_logs`

For fallback extraction, store:

```txt
model = rule_based_text_v1
prompt_version = rule_based_text_v1
schema_version = accounting_extraction_v1
raw_output = parser match details and source text
normalized_output = validated extraction object
confidence_score = conservative score
risk_flags = includes RULE_BASED_EXTRACTION
status = needs_review
```

Transactions created from fallback extraction should normally be:

```txt
needs_review
```

not:

```txt
draft
```

### Phase 6: UI Visibility

Review Queue should clearly show when extraction came from fallback:

```txt
Rule-based extraction
```

Operations should show:

```txt
OpenAI failed, fallback succeeded
```

This avoids confusion when parsed data is partial.

### Phase 7: Safe Failure Behavior

If all providers fail:

```txt
processing_jobs.status = failed
documents.status = failed
last_error = useful non-secret error
```

If fallback partially extracts data:

```txt
documents.status = needs_review
transactions.status = needs_review
```

Do not invent missing accounting values.

## Implementation Order

1. Add fallback plan docs and tracker entry. Complete.
2. Add `AI_EXTRACTION_PROVIDER_ORDER` to `.env.example`. Complete.
3. Create provider interface types. Complete.
4. Move current OpenAI call into an `openai` extractor provider. Complete.
5. Add `rule_based_text` extractor provider. Complete.
6. Update `processDocumentExtraction` to try providers in order. Complete.
7. Store provider metadata in `ai_extractions.raw_output`. Complete.
8. Add conservative status/risk flags for fallback records. Complete.
9. Update health/settings to show provider order and fallback readiness. Complete.
10. Update Review Queue detail to show extraction source. Complete.
11. Run `npm run verify`. Pending.
12. Test with OpenAI disabled or zero-credit state. Pending live verification.

## Done Criteria

This feature is complete when:

- OpenAI 429/no-credit errors no longer block simple text invoice extraction.
- A simple WhatsApp text invoice creates a Review Queue transaction without paid API credits.
- Fallback extraction is clearly marked as rule-based and needs CA review.
- No duplicate transaction is created for the same document.
- Unknown fields remain null.
- Job status becomes completed when fallback succeeds.
- Job status becomes failed only when all providers fail.
- Health/settings show fallback configuration clearly.
- `npm run verify` passes.

## Scope Boundaries

Included now:

- Text-only deterministic parser.
- Provider interface.
- OpenAI-to-fallback flow.
- Conservative confidence and risk flags.
- Review Queue visibility.

Not included now:

- OCR for images or PDFs.
- Audio transcription.
- Direct GST filing.
- Automatic approval.
- Unverified third-party AI provider integration.

## Recommendation

Start with:

```txt
AI_EXTRACTION_PROVIDER_ORDER=rule_based_text
```

This gives you a working no-cost demo path immediately. Later, when credits or another provider are available, switch to:

```txt
AI_EXTRACTION_PROVIDER_ORDER=openai,rule_based_text
```

That gives the best extraction first, with the no-cost parser as backup.
