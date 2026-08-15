# Landing Page Design Improvement Plan

## Goal

Improve the KhataOne landing page from a strong prototype into a production-quality, high-trust conversion page for CA firm owners.

The redesign must keep the existing KhataOne brand direction: professional, CA-first, WhatsApp-first, AI-assisted, review-controlled, and GST/export preparation focused.

## Current Audit Summary

Current rating: `7.1 / 10`

The page is clear, calm, and credible, but it still feels like an early product prototype. The next pass should sharpen first-viewport comprehension, remove risky feature claims, show the WhatsApp client flow more clearly, and add trust/security proof before asking for a demo.

## Non-Negotiables

- Do not claim direct GST filing is live.
- Do not imply autonomous accounting approval.
- Do not overpromise bank statement, voice note, Tally XML, or direct report-command automation unless those flows are implemented and verified.
- Keep AI output described as draft/reviewable.
- Keep CA review and auditability central.
- Preserve the current restrained KhataOne palette and compact professional style.
- Keep the landing page responsive and readable on mobile.

## Phase 1: Copy And Claim Safety

Priority: Highest

### Objective

Remove any wording that could overpromise current production capabilities and make the page safer for real prospects.

### Changes

- Replace broad phrases like `bank statements and voice notes` with safer current-language such as `invoices, receipts, PDFs, payment proofs, and accounting notes`.
- Replace `Bank PDF` in the sample review queue unless bank statement parsing is fully supported in production.
- Keep Tally as future-ready only, not live.
- Keep GST messaging focused on summaries, readiness, exports, and CA preparation.

### Done Criteria

- No landing page copy implies direct GST filing.
- No unsupported media/extraction type is presented as production-ready.
- AI is described as draft/reviewable.

## Phase 2: Hero Clarity And CTA Consistency

Priority: Highest

### Objective

Make the first viewport understandable within five seconds.

### Changes

- Keep `KhataOne` as the main brand signal.
- Strengthen supporting headline into a clearer workflow promise:

```txt
WhatsApp client documents become CA-reviewed accounting records.
```

- Tighten supporting copy:

```txt
Collect invoices and receipts on WhatsApp, turn them into draft transactions, review every field, and prepare GST summaries and exports from one CA-controlled workspace.
```

- Use one primary CTA label consistently:

```txt
Book demo
```

- Keep secondary CTA:

```txt
See workflow
```

### Done Criteria

- First viewport communicates: WhatsApp input, AI draft extraction, CA review, GST/export preparation.
- Primary CTA label is consistent in nav, hero, and form.
- Supporting copy is shorter and more decisive.

## Phase 3: Add WhatsApp Client Flow Visual

Priority: High

### Objective

Make the WhatsApp-first product model visually obvious.

### Changes

- Add a compact WhatsApp-style panel to the hero product visual.
- Show one client message:

```txt
Invoice INV-301 from ABC Traders dated 11 Aug 2026 total 11800 taxable 10000 CGST 900 SGST 900
```

- Show one KhataOne acknowledgment:

```txt
KhataOne received your document. Your CA team will review it before it affects your books.
```

- Visually connect this panel to the Review Queue sample.

### Done Criteria

- Visitor can see both SMB WhatsApp input and CA dashboard review in the hero.
- Visual remains compact and does not become decorative clutter.
- Mobile layout stacks cleanly without horizontal overflow.

## Phase 4: Improve Product Mockup Realism

Priority: High

### Objective

Make the hero console feel more like a real accounting workflow and less like a generic dashboard sample.

### Changes

- Replace `Live sample` with a clearer label such as `Review queue`.
- Add invoice numbers to queue rows.
- Add confidence or risk status where useful.
- Keep financial values right-aligned and monospace.
- Use status chips with clearer tones:
  - Needs Review
  - Approved
  - Low Confidence
  - Extracting
- Use saffron subtly for GST/readiness warning or attention states.

### Done Criteria

- Hero visual shows realistic CA work: client, invoice, status, amount, confidence/readiness.
- Statuses are understandable without relying only on color.
- The mockup still feels restrained and professional.

## Phase 5: Upgrade Workflow Section

Priority: Medium

### Objective

Make the four-step process easier to scan and more memorable.

### Changes

- Convert current cards into numbered steps:

```txt
1. WhatsApp intake
2. Draft extraction
3. CA review
4. GST summaries and exports
```

- Add a subtle arrow or sequence treatment on desktop.
- Keep cards stacked or two-column on mobile/tablet.
- Keep copy short and specific.

### Done Criteria

- Workflow can be understood by scanning only headings.
- Sequence is visually clear on desktop.
- Mobile layout remains clean and readable.

## Phase 6: Add Trust And Control Section

Priority: High

### Objective

Increase confidence for CA firms handling private financial documents.

### Section Content

Add a new trust section before the demo form.

Recommended heading:

```txt
Built for CA-controlled financial workflows.
```

Trust points:

- Firm data isolation.
- Original WhatsApp messages retained.
- Source documents preserved.
- AI outputs include confidence and risk flags.
- CA approvals and edits are audit logged.
- Exports are traceable and private.

### Done Criteria

- Trust section exists before final conversion form.
- It uses factual product/system capabilities only.
- It strengthens confidence without sounding like legal certification.

## Phase 7: Demo Section Conversion Polish

Priority: Medium

### Objective

Make the demo request feel lower-friction and more valuable.

### Changes

- Add a short `What happens next` sequence:

```txt
15-minute workflow review
WhatsApp setup mapping
Demo workspace walkthrough
```

- Keep form fields but reduce visual heaviness where possible.
- Ensure all CTA wording uses `Book demo` or `Request demo` consistently.

### Done Criteria

- User understands what they get after submitting.
- Form feels purposeful, not heavy.
- CTA language is consistent.

## Phase 8: Responsive And Accessibility Verification

Priority: High

### Objective

Make sure the improved landing page works across desktop, tablet, and mobile.

### Checks

- Desktop: `1440px`
- Tablet: `834px`
- Mobile: `390px`
- No horizontal overflow.
- No text overlap.
- CTA labels fit.
- Form fields remain readable.
- Product visual does not become too dense on mobile.
- Keyboard focus states remain visible.
- Contrast remains readable for muted text and status chips.

### Done Criteria

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- Visual checks pass on desktop/tablet/mobile.

## Recommended Build Order

1. Update copy for claim safety.
2. Tighten hero headline, supporting copy, and CTA labels.
3. Add WhatsApp client visual inside/near the hero product mockup.
4. Improve Review Queue mockup realism.
5. Convert workflow into numbered sequence.
6. Add trust/control section.
7. Polish demo form context.
8. Verify desktop/tablet/mobile.

## Acceptance Criteria

- A CA firm owner understands KhataOne in the first viewport.
- The page clearly shows WhatsApp input and CA dashboard review.
- The copy avoids unsupported production claims.
- The page includes trust/control proof before demo conversion.
- CTA labels are consistent.
- The product visual feels realistic and accounting-specific.
- Mobile layout is readable and non-overlapping.
- No backend behavior changes are required for this design pass.
