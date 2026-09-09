# Live Website UI/UX Audit Implementation Plan

## Goal

Address the September 8, 2026 live website UI/UX audit for `khataone.vercel.app` while preserving KhataOne's CA-first, WhatsApp-first, AI-draft, human-review product positioning.

This is a production polish plan for the public landing page, login page, and signup page. It must not change accounting workflows, GST claims, tenant isolation, or Supabase data contracts unless a specific later implementation task requires it.

## Implementation Status

Status: Implemented locally on September 8, 2026.

Completed:

- Generated Open Graph and Twitter image routes.
- Added canonical/Open Graph/Twitter metadata and public sitemap/robots routes.
- Added unique metadata for login, signup, forgot-password, reset-password, privacy, terms, and contact pages.
- Removed fictional testimonial copy and replaced it with factual trust/control content.
- Unified public CTAs around `Book a demo`.
- Added Supabase password reset request and update-password UI.
- Added password visibility controls and signup password helper text.
- Improved demo form required fields, pending feedback, `aria-describedby`, `aria-live`, and textarea resizing.
- Added skip-to-content, mobile menu auto-close, and desktop scroll-spy active navigation.
- Replaced misleading hero stats with factual workflow proof points.
- Added structured data for Organization, SoftwareApplication, and FAQPage.

Still needs live verification:

- Supabase password recovery email redirect and update-password flow with production Auth settings.
- Visual checks on deployed desktop, tablet, and mobile viewports.
- External social preview validation after deployment.

## Source Audit Summary

Audit score: `7.8 / 10`

Strong areas:

- Clear CA-firm positioning.
- Restrained ledger-paper visual style.
- Realistic review queue concept in the hero.
- Strong copy around AI drafts, CA approval, auditability, and GST readiness.

Main gaps to fix:

- Social/SEO metadata is incomplete.
- Login recovery UX is missing.
- Fictional testimonial weakens trust.
- CTA labels are inconsistent.
- Mobile menu and anchor navigation need polish.
- Form validation exists server-side, but native required hints, `aria-describedby`, and field-level accessibility can improve.
- Some responsive/tablet layouts need tighter handling.

## Product And Compliance Guardrails

- Do not claim direct GST filing is live.
- Do not claim bank/GSTR reconciliation, Tally sync, or OAuth/SSO is available unless implemented and verified.
- Do not invent real testimonials, customers, certifications, partnerships, government approval, or usage metrics.
- Treat pricing as an open decision. If added before pricing is final, use a conservative `Contact for pricing` or `Book a demo for pricing` pattern.
- Keep AI described as draft extraction that requires CA review before ledger approval.
- Preserve existing lead capture and Supabase Auth behavior unless explicitly changing those flows.

## Current Code Areas

- Landing page: `src/app/page.tsx`
- Global metadata: `src/app/layout.tsx`
- Demo request form: `src/components/lead-capture-form.tsx`
- Auth form: `src/components/auth-form.tsx`
- Login page: `src/app/(auth)/login/page.tsx`
- Signup page: `src/app/(auth)/signup/page.tsx`
- Auth actions: `src/app/actions/auth.ts`
- Lead request action: `src/app/actions/lead-request.ts`
- Public assets: `public/`

## Phase 1: Critical Trust, SEO, And CTA Fixes

Priority: Critical

### Work

- Add a production `og:image` asset at `1200x630` under `public/`.
- Add Open Graph image metadata, `og:url`, canonical metadata, and `twitter:card = summary_large_image`.
- Add unique page metadata for `/login` and `/signup`.
- Add `robots.ts` and `sitemap.ts` or equivalent Next.js metadata routes.
- Replace the fictional testimonial block with a non-fiction trust/control section, product evidence block, or remove the quote entirely.
- Normalize all primary CTA labels to `Book a demo` across header, hero, final CTA, and form context.

### Done Criteria

- Shared links have a large preview image.
- Landing, login, and signup pages have accurate titles and descriptions.
- No fictional social proof remains.
- CTA wording is consistent.
- `npm run verify` passes.

## Phase 2: Auth Recovery And Login Usability

Priority: Critical

### Work

- Add a `Forgot password?` link to the login form.
- Implement a Supabase password reset request flow if this is intended to work immediately.
- If reset is not implemented in the same pass, link to a small disabled/contact-support state rather than a dead route.
- Add a password visibility toggle using lucide icons and accessible labels.
- Increase auth inputs from `h-9` only if visual verification shows mobile tap comfort is weak; preserve compact auth proportions otherwise.
- Add password requirement helper text on signup.

### Done Criteria

- Login users have an obvious recovery path.
- Password fields remain keyboard and screen-reader friendly.
- No dead auth links are shipped.
- Existing sign-in and sign-up server actions continue to work.

## Phase 3: Demo Form Accessibility And Feedback Polish

Priority: High

### Current State

Server-side validation and inline error rendering already exist in `submitLeadRequest`. The implementation pass should improve HTML and accessibility around that existing behavior rather than rewriting it.

### Work

- Add native `required` attributes to critical demo fields: name, firm, email, phone, and request type.
- Add `aria-describedby` links from fields to their `FieldError` elements.
- Add `aria-live` to the success/error message region.
- Change textarea from `resize-none` to `resize-y`.
- Add disabled/pending affordance that includes a small spinner or clear visual progress cue.
- Keep the honeypot and existing rate limiting intact.

### Done Criteria

- Empty critical submissions are blocked by native browser affordances before server validation.
- Server validation still handles all fields.
- Field errors are announced correctly.
- Success/error state remains visible after submission.

## Phase 4: Navigation And Mobile Menu Polish

Priority: High

### Work

- Add a skip-to-content link and set `main` id to support it.
- Close the mobile `<details>` menu when an anchor link is selected.
- Add active section highlighting for desktop nav using a small client component with Intersection Observer.
- Consider adding a `Pricing` nav item only after the pricing decision is made. Until then, include pricing expectations in demo copy only if needed.
- Add footer links for Privacy, Terms, and Contact once target routes or documents exist.

### Done Criteria

- Keyboard users can skip navigation.
- Mobile menu does not remain open after anchor navigation.
- Active nav state reflects the current section on desktop.
- Footer does not link to missing pages.

## Phase 5: Landing Layout, Copy, And Responsive Refinement

Priority: Medium

### Work

- Replace hero stats with truthful workflow proof points, for example:
  - `WhatsApp intake`
  - `CA review required`
  - `GST summary ready`
- Move `100% Human-approved postings` out of the metric style and into trust/control copy.
- Update generic eyebrows:
  - `Workflow` -> `Four-step workflow`
  - `Platform` -> `What CAs get`
  - `Answers` -> `Common questions`
  - `Workflow setup` -> `Demo setup`
- Consider `md:grid-cols-2` for the hero if tablet review confirms the current full-width product card is too stretched.
- Widen FAQ to `max-w-4xl` or test a two-column FAQ layout on desktop.
- Verify badge contrast and adjust warning/danger text or background if small text fails WCAG AA.
- Keep the saffron accent only if it appears in at least two intentional places, such as trust warnings and GST readiness accents.

### Done Criteria

- Hero avoids suspicious or misleading numbers.
- Copy remains specific to CA firms and WhatsApp accounting intake.
- Tablet and mobile hero layouts are readable with no overflow.
- FAQ layout no longer feels visually pinched on desktop.

## Phase 6: Structured Data And Final Production Checks

Priority: Medium

### Work

- Add JSON-LD for `Organization` and `SoftwareApplication` using factual product details only.
- Add `FAQPage` JSON-LD for the existing FAQ content.
- Verify favicon/app icon usage across browser and share contexts.
- Check loaded JavaScript and avoid adding client-side code beyond small navigation/auth interactions.

### Done Criteria

- Structured data validates with no unsupported claims.
- Metadata routes build successfully.
- No unnecessary client bundles are introduced.

## Recommended Build Order

1. Implement Phase 1 first because trust and metadata gaps affect every public share.
2. Implement Phase 2 so auth does not strand users.
3. Implement Phase 3 because the lead form is the primary conversion workflow.
4. Implement Phase 4 to improve accessibility and mobile navigation.
5. Implement Phase 5 after visual checks at desktop, tablet, and mobile widths.
6. Implement Phase 6 as final SEO hardening.

## Verification Checklist

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run smoke:local` if the app is running with required environment variables.
- Browser or Playwright visual checks at:
  - `1440x900`
  - `834x1112`
  - `390x844`
- Check for:
  - no horizontal overflow
  - no clipped button or chip text
  - visible focus states
  - mobile menu closes after anchor click
  - form errors and success messages are visible and announced
  - social preview metadata includes image, title, URL, and description

## Open Decisions Before Implementation

- Password reset is implemented with Supabase Auth, but production redirect settings still need verification.
- Canonical URL resolves from `NEXT_PUBLIC_APP_URL`, falling back to `https://khataone.vercel.app`.
- Privacy, Terms, and Contact routes were created with conservative product-language summaries.
- Should pricing remain `Contact for pricing`, or is there an approved pricing model?
- Is there a real testimonial or beta quote available? If not, use product evidence instead of social proof.
