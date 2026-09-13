# KhataOne Project Tracker

## Project Status

Status: Implementation started. Phase 0 and Phase 1 are complete; Phase 2 through Phase 13 foundations are in progress.

## Current Focus

- 2026-09-13 UI/UX isolated verification package prepared:
  [ISOLATED_VERIFICATION_PLAN.md](audits/ui-ux/2026-09-13-diagnosis/ISOLATED_VERIFICATION_PLAN.md)
  now defines the disposable two-firm workspace, role set, fixture groups,
  browser/accessibility matrix, per-finding assertions for KO-UX-001 through
  KO-UX-027, release gates and evidence output paths. Added
  `scripts/prepare-ui-ux-isolated-evidence.mjs` and
  `scripts/test-ui-ux-isolated-verification-plan.mjs`; `npm.cmd run
  prepare:ui-ux-evidence` created pending `run-summary.json`,
  `fixture-manifest.json`, `browser-matrix.json`, `console-errors.json` and
  `finding-results.csv` under the isolated-verification evidence folder.
  ui-ux-verification-plan, date-period-defaults, deliberate-density,
  safe-investigation-detail, truthful-identity-claims, typecheck, lint, build
  and diff checks passed. This prepares the next release-readiness phase without
  using live credentials or mutating production data.
- 2026-09-13 R02B UI/UX remediation locally verified: Audit Logs timestamp
  filters now convert each `YYYY-MM-DD` input into the full Asia/Kolkata
  calendar-day UTC range before querying `created_at`, and the page copy states
  that date filters use India calendar days. `src/lib/format.ts` now exposes
  `auditDateOnlyToIndiaUtcRange()`; `scripts/test-date-period-defaults.mjs`
  covers UTC/Asia/Calcutta month defaults, leap-day validity, invalid leap-day
  rejection, exact India-day UTC boundaries and Audit Logs helper wiring.
  date-period-defaults, export-history-visibility, typecheck, lint and build
  checks passed. Hosted boundary-row browser verification remains blocked
  without isolated audit fixtures.
- 2026-09-13 R12A UI/UX remediation locally verified: shared dashboard hierarchy
  now uses named constants for PageHeader/PageTitle/PageDescription and
  SectionCard header/title/description roles. The desktop page title step is a
  deliberate compact 26px, table header/body padding is tightened to `py-2.5`
  while the 46px row minimum remains, and the 56px shell plus 256/68px sidebar
  baseline is preserved. Login and signup secondary CTAs now use shared
  `ActionLink size="md"` controls instead of one-off 36px links. Added
  `scripts/test-deliberate-density-hierarchy.mjs`; deliberate-density,
  truthful-identity-claims, accessibility-contracts, responsive-containment,
  typecheck, lint, build and diff checks passed. Local Playwright checks for
  `/`, `/login`, `/signup`, `/forgot-password` and `/reset-password` passed at
  390px and 1440px. Broader visual-density changes remain gated by D07 visual
  approval and isolated authenticated fixtures.
- 2026-09-13 R11A UI/UX remediation locally verified: the sidebar firm identity
  block no longer uses a chevron or hover card treatment that implies an
  unavailable firm switcher. Landing copy now labels the review queue as an
  illustrative sample, describes implemented record-level confidence/risk/source
  evidence instead of field-level evidence, and changes the footer GST chip to
  "GST prep only" while preserving the direct-filing-outside-v1 boundary. Added
  `scripts/test-truthful-identity-public-claims.mjs`; truthful-identity-claims,
  accessibility-contracts, typecheck, lint, build and diff checks passed. Local
  Playwright checks for `/`, `/login` and `/signup` passed at 390px and 1440px.
- 2026-09-13 R10A UI/UX remediation locally verified: Audit Logs now selects
  `before_data` and `after_data`, links entities only through allowlisted internal
  dashboard routes, and shows a Safe investigation detail column with allowlisted
  field changes and metadata chips. Operations job errors now show complete
  sanitized text with links and token-shaped values redacted instead of a
  140-character slice. Shared `InlineAlert` supports wrapping detail text when a
  screen opts in. Added `scripts/test-safe-investigation-detail.mjs`;
  safe-investigation-detail, export-history-visibility, accessibility-contracts,
  responsive-containment, typecheck, lint, build and diff checks passed. Hosted
  correction-trace and long-error browser checks remain blocked without isolated
  metadata/error fixtures.
- 2026-09-13 R09A UI/UX remediation locally verified: Export history now has
  explicit refresh, truthful queued/processing/failed file-state labels, private
  download-route preservation and 50-row lookahead pagination. GST Summary,
  Reports, Audit Logs and Operations histories now use bounded pagination instead
  of fixed latest-record limits; Audit and Operations retain active filters across
  pages, and Operations refresh preserves the filtered page. Export and GST form
  validation messages are associated with their fields. Added
  `scripts/test-export-history-visibility.mjs`; export-history-visibility,
  accessibility-contracts, responsive-containment, typecheck, lint, build and
  diff checks passed. Live queued/processing/completed worker transitions and
  more-than-50 pagination fixtures remain blocked without an isolated environment.
- 2026-09-13 R08A UI/UX remediation locally verified: semantic foreground
  tokens now improve small feedback/status contrast; collapsed sidebar tooltips
  dismiss on Escape; client, ledger, review and onboarding forms connect invalid
  controls to inline errors; login/signup/forgot/reset password fields use 44px
  mobile input or toggle targets; update-password validation identifies the field
  that owns the current inline message. Added `scripts/test-accessibility-contracts.mjs`;
  accessibility-contracts, update-password-form, review-dirty-interlock,
  typecheck, lint and build checks passed. Local public auth browser checks passed
  at 390px and 1440px. Authenticated screen-reader/role browser checks remain
  blocked without isolated fixtures.
- 2026-09-13 R07A UI/UX remediation source/build verified: Review Queue filters
  no longer force the dense seven-column toolbar at the 1280px breakpoint, GST
  detail grid/table sections can shrink into scrollable table regions, shared
  `DataTable` wrappers are max-width constrained, and the mobile sign-out button
  now has a 44px minimum width while keeping its accessible name. Added
  `scripts/test-responsive-containment.mjs`; responsive-containment,
  dashboard-responsive-harness contract, typecheck, lint, build and diff checks
  passed. Full authenticated browser checks across all viewports and sidebar
  states remain blocked without isolated fixtures.
- 2026-09-13 R06A-R06B UI/UX remediation locally verified: added
  `src/lib/document-evidence.ts` and `src/components/document-evidence-panel.tsx`
  so Review detail can show supported private image/PDF/text/audio source evidence
  through 120-second signed URLs from `whatsapp-media-raw`, with precise fallbacks
  and extracted source text retained. GST period detail now labels generated totals
  as the saved GST summary, labels rows as live current-period transactions, and
  shows current blockers without changing the accounting query or totals. Added
  `scripts/test-evidence-provenance.mjs`; evidence-provenance, dirty-interlock,
  unavailable-state, lint, typecheck and build checks passed. Hosted signed-storage
  and post-generation GST provenance verification remain blocked without isolated
  fixtures.
- 2026-09-13 R05A UI/UX remediation locally verified: added
  `src/lib/availability.ts` for explicit unavailable count, nullable currency and
  nullable percent display. Overview, Reports, Operations, client detail, GST Summary
  and GST period detail now separate failed or absent reads from real zero values, use
  generic retry copy for read failures, and keep static `StatTile` cards from looking
  clickable. Overview confidence no longer maps absence to `0%`; missing GST summary
  totals/counts show `Unavailable` while valid zero remains numeric. Added
  `scripts/test-unavailable-states.mjs`; unavailable-state, return-context,
  action-outcome, role-affordance, dashboard workflow, query-semantics, lint, typecheck
  and build checks passed. Hosted injected-read-failure and deeper count-destination
  verification remain blocked without isolated fixtures.

- 2026-09-13 R04E UI/UX remediation locally verified: added
  `src/lib/return-context.ts` for allowlisted `return_to` dashboard list context.
  Clients, Review Queue and Ledger now carry safe page/filter context from lists into
  detail/edit/correction flows and back through client, review and ledger server-action
  redirects. Archive outcomes append fixed result codes to the safe Clients destination;
  reject/duplicate return to the filtered Review Queue; approval still routes to Ledger
  after handoff. Added `scripts/test-return-context.mjs` and updated source tests for the
  new form props; return-context, action-outcome, role-affordance, dirty-interlock,
  dashboard workflow, lint, typecheck and build checks passed. No live archive, review
  decision, approval, ledger correction, WhatsApp delivery or financial mutation was
  performed; hosted mutation/role verification remains blocked without isolated fixtures.

- 2026-09-13 R04D UI/UX remediation locally verified: added shared
  `PendingSubmitButton` form-status feedback and fixed outcome reporting for client
  archive and Operations manual job runs. Archive now checks the RPC result, revalidates
  client routes on success, and redirects to fixed success/error banners on Clients.
  Manual job actions now map bounded worker summaries to fixed result messages, catch
  worker exceptions, route failures to the failed-job filter, and avoid raw error text in
  URLs. Added `scripts/test-action-outcome-feedback.mjs`; action-outcome, role-affordance,
  dirty-interlock, dashboard workflow, query-semantics, lint, typecheck and build checks
  passed. No live archive, manual run, export, WhatsApp delivery or financial mutation was
  performed; R04 return-context behavior is now covered by the R04E record above.

- 2026-09-13 R04C UI/UX remediation locally verified: added shared
  `src/lib/permissions.ts` role helpers and aligned page-level mutation affordances
  with the existing owner/admin/staff server-action boundary. Client create/edit/detail,
  Review detail, Ledger detail/edit, GST Summary, Exports and Operations now show a
  shared read-only permission notice instead of create/edit/decision/generation/manual-run
  controls for read-only roles, while read-only histories and downloads remain visible.
  Added `scripts/test-role-aware-affordances.mjs`; role-affordance, dirty-interlock,
  dashboard workflow, query-semantics, lint, typecheck and build checks passed. Hosted
  owner/admin/staff/viewer matrix verification remains blocked without isolated role fixtures.

- 2026-09-13 R04B UI/UX remediation locally verified: review decision forms now
  expose submit-pending state through `useFormStatus()`. Approve, Reject and Mark
  duplicate disable while their own form is submitting and show specific pending labels;
  the WhatsApp clarification textarea and submit button also disable during submission
  with busy/disabled accessibility state. Updated `scripts/test-review-dirty-interlock.mjs`;
  dirty-interlock, lint, typecheck and build checks passed. No action RPC, redirect,
  ledger handoff, WhatsApp delivery, authorization or audit behavior changed. Client
  archive and Operations pending/outcome feedback remain in R04.

- 2026-09-13 R04A UI/UX remediation locally verified: added a coordinated
  `TransactionReviewWorkspace` for non-posted review details so unsaved field edits
  disable Approve, Reject, Mark duplicate and Request WhatsApp clarification until
  the explicit Save completes. `TransactionReviewForm` now reports dirty state, the
  dirty warning is announced and referenced by disabled decisions, the clarification
  textarea has a persistent label/help contract, and posted records remain read-only
  with their summary/evidence rail intact. Added `scripts/test-review-dirty-interlock.mjs`;
  dirty-interlock, dashboard workflow, query-semantics, lint, typecheck and build checks
  passed. No live approval/rejection/duplicate/WhatsApp clarification or financial
  mutation was performed; remaining R04 role, pending/outcome and return-context work
  still needs isolated fixtures.

- 2026-09-13 R03 UI/UX remediation locally verified: added migration
  `20260913110000_complete_dashboard_filtered_results.sql` with authenticated read-only
  `search_review_queue()` and `search_whatsapp_inbox()` functions so Review Queue and
  Inbox search/status/document/risk/date predicates run before pagination. Updated both
  pages to consume flat RPC rows and removed current-page memory filtering. Clients now
  includes the `onboarding` status and shows filtered-empty copy when active filters
  return zero rows. Added `scripts/test-dashboard-filter-rpcs.mjs`; dashboard RPC,
  query-semantics, date-default, password-form, lint, typecheck, and build checks passed.
  Hosted verification is pending until the migration is applied; R04 review action safety
  is the next workflow package.

- 2026-09-13 R02A UI/UX remediation locally verified: centralized GST/export
  month-default construction in `src/lib/format.ts` with `currentMonthDateRange()`
  and updated `src/components/gst-summary-form.tsx` plus `src/components/export-form.tsx`
  to avoid `toISOString()` shifting date-only calendar boundaries. Added
  `scripts/test-date-period-defaults.mjs` and `npm run test:date-period-defaults`,
  covering September 2026 in UTC and Asia/Calcutta, leap February 2024 and December
  month end. Focused date/password tests, lint, typecheck, and build passed. Audit-log
  timestamp-day filtering remains R02B pending the documented D02 timezone decision;
  R03 complete filtered results is the next ready workflow slice.

- 2026-09-13 R01 UI/UX remediation locally verified: fixed the password-reset
  submit handler in `src/components/update-password-form.tsx` so the form element is
  captured before the async Supabase Auth update and a genuine success cannot be
  converted into the setup-failure message by a cleared event reference. Added
  `scripts/test-update-password-form.mjs` and `npm run test:update-password-form`
  with a mocked deferred provider success plus provider rejection; no real password was
  changed. `npm.cmd run test:update-password-form`, lint, typecheck, and build passed;
  the built `/reset-password` route rendered at 390px and 1440px without horizontal
  overflow. Hosted recovery-session verification remains pending; R02 calendar
  boundaries are the next planned workflow slice.

- 2026-09-13 UI/UX remediation planning complete: created
  [UI-UX-Remediation-Plan.md](UI-UX-Remediation-Plan.md), assigning all 27 diagnosis
  findings to 12 scoped packages with acceptance criteria, decision defaults,
  fixture requirements and release gates. Linked the workstream from the
  implementation plan. R01 (password-reset success handling) is the first planned
  implementation slice, using a mocked provider; no remediation code has been
  implemented. Documentation-only change; existing audit evidence and Overview
  concepts preserved. Finding coverage, references and diff checks passed.

- 2026-09-13 Overview concept 2: prepared `docs/design-reviews/overview/overview-proposal-v2.png`
  and `layout-v2.md` from the user's additional layout reference. Proposed one header firm
  context, simpler navigation, a unified summary band, and compact review surfaces.
  Static visual approval remains pending; no application or backend changes.

- 2026-09-13 Overview screenshot review: prepared a page-specific visual audit and
  PNG approval concept in `docs/design-reviews/overview/`. Proposal improves density,
  worklist alignment, table wrapping, and visual hierarchy using the supplied records.
  Awaiting visual approval; no application code, backend, or other pages changed.

- 2026-09-12 WA-LAT recovery scheduling follow-up: production deployment and CI for commit
  `943a2d1` passed, but no recovery heartbeat appeared at the expected GitHub schedule slot.
  Read-only Actions history confirms multi-hour gaps between nominal five-minute runs, so
  GitHub scheduling is retained only as a temporary fallback and WA-LAT-6 recovery cadence
  is not certified. Repository and official Supabase flow inspection found the smallest
  replacement: Supabase Cron can invoke the two existing protected GET routes through
  asynchronous `pg_net`, with URL and bearer secret held in Vault. Added a read-only
  prerequisite/conflict/secret-presence preflight. Hosted preflight confirmed PostgreSQL 17,
  active Vault, and available but disabled `pg_cron` and `pg_net`. The owner enabled both and
  provisioned the two named Vault values without exposing them. Migration `20260912240000`
  adds a fixed-target, service-only Vault-backed dispatcher and two one-minute Supabase Cron
  jobs for the existing protected recovery routes. The owner applied migration `20260912240000`;
  hosted verification found both jobs active with successful Cron dispatches and three
  consecutive one-minute application heartbeats per worker. All six worker runs succeeded in
  about 0.1-0.95 seconds while idle; both due queues, retry counts, recent failures, and stale
  leases were zero. The longer cadence window and suppressed-wake-up recovery canary remain
  pending before GitHub fallback removal; no queue or financial record was mutated by checks.
- 2026-09-12 hosted WA-LAT migration gate passed. The owner applied migrations
  `20260912200000`, `20260912210000`, and `20260912220000` in order. Read-only hosted
  verification confirms the ordering-lease and worker-run tables are available, the
  aggregate health RPC returns exactly the `whatsapp_ingestion` and `ai_extraction` rows,
  and anonymous execution is denied with PostgreSQL `42501`. No queue row, heartbeat,
  document, extraction, transaction, or audit record was created or changed by verification.
  Release-branch deployment and non-mutating preview checks are next.
- 2026-09-12 WA-LAT-6 implemented locally. The protected WhatsApp ingestion and AI
  extraction recovery routes now record service-only start/completion outcomes, and a
  database aggregate exposes oldest due work, 24-hour p95 claim/ack delay, stale ordering
  leases, retry/terminal/recent-failure counts, and latest worker completion/success to
  readiness and authorized Operations users without exposing payloads or customer data.
  Threshold breaches emit structured operational errors. GitHub recovery schedules remain
  five-minute safety nets but are offset from top-of-hour load and now fail on non-200 or
  unsuccessful worker results. Focused SQL/security checks and the complete local release
  verifier pass, including zero known production dependency vulnerabilities and a successful
  Next.js build. Migration `20260912220000`, deployment, independent monitor wiring, cadence
  observation, and a suppressed-wake-up recovery canary remain pending; GitHub schedule
  delay/drop behavior means recovery is not yet production-certified.
- 2026-09-12 WA-LAT-5 implemented and verified locally. WhatsApp ingestion now dispatches
  at most three independent normalized-sender streams and AI extraction dispatches at most
  two independent firm-client streams; each stream remains sequential and result order is
  deterministic. The exact post-response AI wake-up uses the same two-wide client grouping.
  Migration `20260912210000` adds service-only durable ordering leases alongside skip-locked
  row claims, transactional status-based release, and ten-minute stale recovery, preventing
  overlapping serverless invocations from processing two items for one sender/client.
  Focused pool/PostgreSQL tests, security checks, lint, and typecheck pass. Migrations
  `200000` and `210000`, deployment, and production concurrency/provider canaries remain
  pending; no live data was changed.
- 2026-09-12 WA-LAT-4 implemented and verified locally. Meta send, media metadata, bounded
  error reads, and media downloads now share an abortable 10-second default deadline;
  OpenAI and Meta failures are sanitized and classified without retaining provider bodies.
  Timeout, connection, 429, and 5xx failures use capped exponential backoff with jitter and
  `Retry-After`; invalid configuration, malformed requests, unsupported media, and exhausted
  attempts remain terminal. Retryable WhatsApp events and AI jobs are explicitly requeued
  with future scheduling, while migration `20260912200000` removes automatic replay of
  terminal failed webhook events. Meta acknowledgment IDs use the existing correlation
  column. Focused PostgreSQL/provider tests and the complete release verifier pass, including
  zero known production dependency vulnerabilities. Migration application, deployment, and
  controlled Meta/OpenAI retry canaries remain pending; no live data was changed.
- 2026-09-12 WA-LAT-3 matched text-invoice production canary passed on deployment `dpl_6PbPNa7h4C1sDtYUB9MrmNXmxhj3`. The fresh event was claimed in 63 ms, acknowledged in 976 ms, created its durable extraction job in 1.18 s, and completed extraction plus draft transaction creation in 1.54 s. Exactly one provider event, message, document, AI job, extraction, and transaction exist; the first-attempt job has no error and Vercel has no canary-window errors. The configured `rule_based_text_v1` path correctly produced `needs_review` with `RULE_BASED_EXTRACTION` and `NEEDS_CA_REVIEW`, never approval. The historical failed AI backlog remained exactly 17. No provider fallback failure was recorded, which indicates production selected rule-based extraction directly; image, PDF, and audio canaries remain pending until OpenAI is intentionally restored with working quota.
- 2026-09-12 WA-LAT-3 production activation is healthy on deployment `dpl_6PbPNa7h4C1sDtYUB9MrmNXmxhj3`. The verified source was first deployed with `WHATSAPP_IMMEDIATE_AI_ENABLED=false`, passed liveness and deployment-log checks, then redeployed with the flag enabled. Production liveness is 200, Vercel reports no activation-window errors, and the historical failed AI backlog remains exactly 17 before the controlled canary. No migration or backlog replay occurred. A fresh matched non-help text invoice is now required to verify exact new-job claiming, extraction latency, draft/review output, and unchanged historical failures.
- 2026-09-12 WA-LAT-3 implemented and verified locally behind `WHATSAPP_IMMEDIATE_AI_ENABLED=false`. WhatsApp ingestion now distinguishes a newly inserted extraction job from an existing idempotent job and propagates that marker to the webhook's existing post-response callback. When enabled, the callback uses the deployed exact-job claim boundary to process only newly committed jobs; duplicate deliveries and the historical failed backlog are not awakened. Scheduled recovery and manual Operations execution are unchanged, and AI output remains draft/needs-review. The route declares a 300-second execution budget for bounded post-response work. Focused flow, security, and AI recovery suites pass, as does the complete local release verifier with zero known production dependency vulnerabilities. No migration, production activation, provider request, or live data mutation occurred in this step; a flag-off deployment followed by a controlled matched text-invoice canary is next.
- 2026-09-12 WA-LAT-2 production canary passed and immediate ingestion remains enabled. Production deployment `dpl_DHXvqKRt2bap264KmCiurJ1QihH5` processed the owner-controlled signed `hi` message through the existing durable queue: claim latency was 66 ms, acknowledgment latency was 1.32 s, and total event processing latency was 1.40 s. The event correctly ended as `ignored` help handling with no error; exactly one webhook event and one WhatsApp message existed, liveness returned 200, and Vercel showed no errors in the canary window. This removes scheduled ingestion as the normal reply path while retaining it for recovery. WA-LAT-3, immediate AI-worker wake-up after durable extraction-job creation, is next; failed historical AI jobs remain excluded from automatic replay.
- 2026-09-12 WA-LAT-2 implemented and verified locally behind the server-only `WHATSAPP_IMMEDIATE_INGESTION_ENABLED` flag, which defaults off. After a signed webhook durably inserts at least one new event, Next.js `after()` now starts the existing bounded skip-locked ingestion claimant without delaying the webhook response. Matched non-help messages persist first and then send a truthful processing acknowledgment before media lookup/download/upload, document creation, or extraction-job insertion. Tests prove flag-off compatibility, post-response deferral, immediate worker invocation, acknowledgment ordering, duplicate suppression, and retry/skip behavior. Scheduler recovery, claims, leases, attempt limits, signature/rate-limit checks, private storage, and review-first accounting remain unchanged. The complete local release verifier passes with zero known production dependency vulnerabilities. No environment activation, deployment, Meta/OpenAI request, migration, or live data mutation occurred; controlled canary activation is the next gate before WA-LAT-3.
- 2026-09-12 WA-LAT-1 completed locally without changing WhatsApp processing behavior. Added deterministic coverage for Meta signature acceptance/rejection, signed route enqueue, help, unmatched, matched text, matched media, duplicate suppression, acknowledgment retry/skip, ingestion claiming, and AI claiming. Added opt-in privacy-safe timings for webhook persistence, client matching, media handling, extraction enqueue, acknowledgment, ingestion queue wait/process duration, and AI queue wait/process duration through the existing performance logger. Phone numbers, payloads, document content, tokens, and provider error bodies are not logged. The complete local release verifier passed, including isolated PostgreSQL integrity/policy suites, security boundaries, worker recovery and execution bounds, shared rate limits, performance checks, zero known production dependency vulnerabilities, lint, typecheck, and production build. No worker wake-up, acknowledgment reordering, migration, provider request, deployment, or live data mutation occurred in that baseline step.
- 2026-09-12 WhatsApp latency remediation planned after a code and production-flow trace. Live evidence showed a signed inbound `hi` durably queued at 15:45:49 IST but still unclaimed and unacknowledged after 17 minutes, while historical queue waits reached hours and the nominal five-minute GitHub scheduler ran irregularly. Phase 12A now preserves the existing durable skip-locked queues and identifies the smallest integration points: post-enqueue event-driven ingestion wake-up, acknowledgment before media I/O, and post-job event-driven AI wake-up. Provider deadlines, classified retries, bounded per-client-aware concurrency, latency telemetry, recovery scheduling, canary gates, and rollback are sequenced behind those changes. No runtime code, migration, provider request, deployment, or data mutation was performed for this planning step.
- 2026-09-12 production promotion completed: `main` was fast-forwarded from the verified release branch and pushed at `8c047d5`; Vercel production deployment `dpl_31esWMyon3QzQrV5pwSxFdi6d5vE` reached Ready and owns `khataone.vercel.app`, with application functions in `hnd1`. Public liveness returned 200, unauthenticated deep readiness correctly returned 401, 15/15 repeated liveness requests and 10/10 login requests succeeded, and Vercel reported no production error logs. An authenticated read-only browser run returned populated 200 responses: Clients click-to-rows p50 968 ms with one 3.59 s first-sample outlier, Ledger p50 963 ms/p95 974 ms, and Inbox p50 1.04 s/p95 1.17 s. Two later focused browser sessions encountered runner-side `ERR_CONNECTION_RESET` during navigation despite the clean direct HTTP checks; protected deep readiness still requires an authorized external check and the latency figures remain preliminary rather than capacity certification.
- 2026-09-12 production promotion gate passed: production shared-rate-limit storage and service-role/browser privilege checks passed after migration `20260912190000`. Vercel Production now has `RATE_LIMIT_SHARED_ENFORCEMENT=shared-store` and `RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT=true`, backed by the previously configured independent key secret. The complete local release verifier passed again, including security and PostgreSQL suites, performance regressions, zero production dependency vulnerabilities, lint, typecheck, and the Next.js production build. Capacity certification remains explicitly waived and provider/live workflow checks remain post-deployment observations.
- 2026-09-12 production migration execution: the owner manually applied production migrations `20260912100000` through `20260912190000` in order after read-only preflights. Function/policy checks through `20260912180000` passed. Seven legacy approved transactions without ledger handoffs were repaired with seven migration audit records; subsequent transaction ownership, approval metadata, and handoff checks returned zero inconsistencies. The only dashboard audit preflight finding was valid historical activity by the actual firm owner whose membership is now disabled, so no history was altered; the preflight now distinguishes missing membership from inactive historical membership. Final shared-rate-limit permission verification, Vercel shared-enforcement activation, release verification, and production promotion remain pending.
- 2026-09-12 production schema drift repair: live preflight found seven approved transactions without ledger handoffs, then confirmed the legacy `transactions` table lacks `approved_by` (and may lack `approved_at`) despite the approval RPC existing. Added idempotent approval-metadata restoration and an audited, conflict-safe ledger-handoff backfill that preserves unknown historical actor/time as null rather than fabricating them. Isolated PostgreSQL verification covers the repair and audit metadata before manual production application.
- 2026-09-12 coordinated release candidate: committed all reviewed hardening, performance, migration, test, and documentation work as `25d519e` on `release/security-performance-hardening-20260912`; baseline recovery branch remains at `c62e3ef`. Pushed only the release branch. Git-triggered Preview `dpl_D5hHRDk3Fpi3c17JYuVvxG5DB3mq` built successfully with middleware/functions in hnd1. Vercel Production now has independent readiness and rate-limit key secrets, but shared enforcement is still disabled. `origin/main` and production remain unchanged. Production backup verification, SQL preflights, and migrations are blocked pending a Supabase management token or database password/connection string; the Preview still shares production Supabase and was not used for workflow/load testing.
- 2026-09-12 release preparation: created recovery branch `backup/pre-hardening-release-20260912` at production baseline `c62e3ef` and working branch `release/security-performance-hardening-20260912`. Added independent cryptographically random `READINESS_CHECK_SECRET` and `RATE_LIMIT_KEY_SECRET` values to Vercel Production without exposing or storing them in the repository. Shared rate-limit enforcement remains disabled until migration `20260912190000` is applied and verified. Supabase backup/preflight/migration work is blocked because no management token, database password, connection string, or psql access is available locally.
- 2026-09-12 Phase 7 local release preparation: owner declined a separate staging Supabase project, so capacity execution is explicitly waived/unverified rather than marked passed. Added a fail-closed local release preflight for migration/application coupling, hnd1/crons, tracked secret files, conflict markers and diff hygiene, plus one full local verifier that reuses the existing security, financial-integrity, recovery, performance, dependency and production-build suites. Hosted migration, tenant isolation, provider and target-scale capacity evidence remain external release risks.
- 2026-09-12 Phase 7 local verification passed: `npm run verify:release-local` completed all structural, Phase 1-3, capacity-safety, security-boundary, isolated PostgreSQL financial/policy, AI recovery/bounds, protection, dashboard regression, dependency, lint, TypeScript, and production-build checks. Production dependency audit reported zero known vulnerabilities. No migration, deployment, push, provider request, live load, or financial mutation was performed.
- 2026-09-12 Phase 6 capacity validation: hardened the non-production k6 harness with exact-host production denial, redirect rejection, route-specific latency and dropped-iteration thresholds, dashboard-only defaults, explicit provider-cost authorization, and exact-host paginated before/after staging reconciliation. Native k6 2.2.0 now parses the workload and passes synthetic preflight. An actual run remains pending an isolated staging app/database and controlled staging session. Production was not load tested.
- 2026-09-12 capacity isolation check: Vercel Preview and Production use the same jointly scoped Supabase URL, anonymous key, and service-role secret bindings. Existing previews therefore reach the production database and are not approved capacity targets. Create a separate staging Supabase project, assign Preview-only credentials, deploy Preview, and create a controlled staging session before running the prepared k6 workflow.

- 2026-09-12 Phase 5 protection/readiness prepared locally: added a service-role-only atomic Supabase fixed-window limiter using keyed HMAC-SHA-256 identifiers, bounded thresholds and expiry cleanup; all existing sensitive endpoints now support opt-in cross-instance enforcement and fail closed when required protection is unavailable. Production deep readiness now requires a separate strong timing-safe bearer secret, returns private/no-store responses, and verifies the selected shared store; public liveness remains cheap. Isolated PostgreSQL, adapter, route, security and type tests pass. Migration `190000`, strong environment secrets, cross-instance staging verification and monitor updates remain release gates. Nothing applied, pushed or deployed.

- 2026-09-12 Phase 4 AI worker resilience prepared locally: batch/manual claims recover ten-minute abandoned leases with skip-locked, batch and attempt bounds while automatic claims leave failed jobs untouched. Private media rejects unsupported types before I/O, streams through byte caps, and has an abort timeout; OpenAI has bounded request time and retries. A protected five-minute GitHub scheduler reuses the established `CRON_SECRET` pattern because Vercel Hobby cron remains daily. PostgreSQL, execution-bound, security, hardening, lint/typecheck/build tests pass. Migration/workflow remain unapplied and uncommitted; provider/storage staging checks, Actions invocation and production failed-job diagnosis remain release gates. No live jobs changed.

- 2026-09-12 controlled dashboard audit writers prepared locally: client create/update/archive, export+job enqueue, and manual job requests now use purpose-built authorized functions that derive audit data and roll back business writes when audit insertion fails. Restrictive browser policies deny direct clients/exports/jobs/audit writes while service-role workers remain supported. Isolated two-firm PostgreSQL tests, security tests, lint/typecheck/build passed; read-only preflight added. Local Phase 3 boundaries are complete under posted immutability, but all migrations remain unapplied and Supabase staging/live-policy verification is pending. No push/deployment/live mutations.

- 2026-09-12 clarification and transaction-write boundary prepared locally: clarification is authorized/audited before WhatsApp, then records a linked delivery outcome; blank/posted/foreign requests are denied. All browser transaction mutation paths now use controlled functions, allowing restrictive direct INSERT/UPDATE/DELETE policies while preserving service-role AI processing. Isolated PostgreSQL and application security tests pass, including audit rollback and no posted outbound side effect. Migration unapplied. Direct audit-log forgery, reversal design and Supabase staging remain pending; no push/deployment/live mutations.

- 2026-09-12 atomic transaction review prepared locally: review-stage field edits and reject/duplicate decisions now use scoped SQL functions that lock the row, revalidate role/tenant/client/status/input, and commit transaction plus before/after audit together. Repeated identical decisions are idempotent and database errors are private. Isolated PostgreSQL/action tests passed, including audit-failure rollback; read-only preflight added. Migration unapplied. Clarification delivery audit, direct non-posted transaction/audit restrictions, reversal design and Supabase staging remain pending. No push/deployment or live mutations.

- 2026-09-12 posted transaction lifecycle guard prepared locally: product/schema review found no defined void or reversal model, so approved/exported records are now read-only for browser roles until one exists. Review actions block posted edits, decisions and clarification before side effects; the detail UI hides those controls. Isolated PostgreSQL and action tests verify posted denial, normal review edits, no WhatsApp send and approval compatibility. Migration unapplied; atomic non-posted transaction/audit writes and reversal design remain pending. No push, deployment or live data changes.

- 2026-09-12 idempotent approval prepared locally: replaced the approval RPC implementation so repeated approval returns the existing ledger handoff without overwriting manual corrections. Approved records missing a handoff are repaired once with a distinct audit. Isolated PostgreSQL tests cover correction preservation, single approval audit and rollback of first approval/repair on audit failure. Migration unapplied; approved transaction edit/reject/duplicate void/reversal behavior remains the next Phase 3 decision. No push, deployment or live data changes.

- 2026-09-12 atomic ledger correction prepared locally: traced edit form/action and approval handoff. Replaced separate read/update/audit requests with an authorized RPC, retaining source data and adding restrictive browser ledger-write policies. Isolated PostgreSQL tests passed for audit rollback, tenant/role denial, invalid amounts, source ownership and initial approval compatibility; action tests passed. Added read-only preflight and coordinated release notes. Migration unapplied; repeated-approval overwrite, stale handoffs and broader transaction/audit hardening remain pending. No push/deployment or live financial edits.

- 2026-09-12 atomic GST slice prepared locally: replaced bounded API row aggregation and separate writes with an authorized SQL aggregate/period/summary/audit RPC. Added direct-write restrictions, scoped ownership checks, strict date validation and reports invalidation. Isolated PostgreSQL tests passed for >1500 rows, tenant/role denial, input/output totals, readiness states, repeat generation and audit-failure rollback. Added read-only GST preflight SQL. No production migration/regeneration or deployment. Remaining transaction/ledger audit boundaries and all live/staging release gates are still pending.

- 2026-09-12 worker-input database boundary prepared: traced dashboard export compensation and service-role document/job writes. Added restrictive policies plus an export-update trigger in 20260912100000_protect_worker_inputs.sql; no migration applied. Export action now ignores inactive selectors. Isolated PGlite PostgreSQL tests passed for two firms, viewer/revoked/anonymous roles, forged artifacts, job ownership, allowed compensation and service-role writes. Application tests and full lint/typecheck/build passed. Added read-only live preflight SQL. Live policy/grant verification, Supabase staging, financial-integrity phases and deployment remain pending; existing dirty work preserved.

- 2026-09-12 audit remediation started: local immediate-security slice rejects missing worker secrets and malformed document IDs, blocks viewer clarification side effects, validates privileged export paths and propagates job firm/client ownership to both processors. Upgraded Next.js/eslint-config-next to 16.3.5, Sharp to 0.35.4 and js-yaml to 4.3.2 through the lockfile. Full verify, new security-boundary tests and phase 1/2 checks passed; npm audit reports zero known vulnerabilities locally. Live remains c62e3ef; no push/deployment or database mutations. Phase 1 live-policy verification and Phase 2 database input restrictions/integration remain pending; Phases 3-7 not completed. See docs/security-hardening-plan.md.

- Post-release next-step review: re-read the pending firm-loader/middleware recovery changes and reran firm-context, session/cookie/deadline and visible-row-probe tests; all passed. No additional runtime changes or deployment made. Recovery behavior is not a demonstrated navigation-speed fix. Requested a user-side private-window and mobile-hotspot Clients-to-Ledger comparison on the updated live site to distinguish the previously observed pre-send stalls from application latency; independent-network evidence remains pending.

- Post-push public-domain smoke: existing-account Clients/Ledger/Review Queue checks passed on the Git-triggered Tokyo deployment; click samples 885/885/863 ms, with populated rows and hnd1/private-no-store responses. Evidence: docs/performance/region-release-main-smoke.json. One sample each, not p95 certification.

- 2026-09-12 GitHub integration complete: Fast-forwarded main to the tested region-only commit c62e3ef and pushed origin/main; remote SHA verified. Other pending edits were preserved and excluded. Git-triggered production deployment dpl_jkyuKGWc8XiDEyELvAcdefJzsMF9 is READY; public khataone.vercel.app resolves to it and API metadata confirms the exact GitHub SHA and hnd1 region. This supersedes the integration-pending status below. Documentation remains local with the other pending performance work.

- 2026-09-12 isolated Tokyo release LIVE: With user-confirmed GitHub noreply identity, created new region-only commit c62e3ef5e40b9d920b6fce550274570e5e004e6b on local release/tokyo-region; no history rewritten. Vercel accepted and built dpl_CUpLfdbKjMnDntcXEuShjQQdsVtH. Candidate authenticated three-route smoke and unauthenticated redirect passed, then promotion succeeded. Public khataone.vercel.app resolves to the new deployment; real-account Clients/Ledger/Review Queue rows and hnd1/private-no-store headers verified. Public click samples 868/882/899 ms, hard loads 751/977/868 ms (one each, not percentile certification). Crons unchanged; no financial mutations or database migration. Prior iad1 deployment retained for rollback. Only region placement is released; other diagnostics/recovery work remains separate. No GitHub push performed; release commit must be integrated before a future main deployment to preserve placement. Intermittent stalls and broader acceptance checks remain open. This supersedes the blocked release status below.

- 2026-09-12 isolated production release BLOCKED: User authorized region-only production rollout. Verified production commit e780570 and prepared detached `.codex-tmp/region-release` with only hnd1 config added, crons preserved. Isolated lint/typecheck and phase 1/2/3 tests passed. Vercel rejected staged production candidate dpl_HrQtbvUc8kHz7bQRLgY2xzWxJ5Dr before build with TEAM_ACCESS_REQUIRED: commit author not verified/authorized. No controls bypassed or domain promoted. Live site remains dpl_9GuQVWLef4f3RfZiFUfL53b5YVFp in iad1; owner must resolve Vercel Git-author/project access before retrying the isolated release. Existing dirty work preserved; no commit/push.

- 2026-09-12 thirty-trial observation check: Re-inspected the navigation/auth/data flow and added only a browser-side numeric visible-row probe with synthetic DOM tests. Thirty Clients-to-Ledger trials on the existing recovery preview measured click median/p95 901/1419 ms versus visible-DOM 702.3/1023.6 ms; the runner's observation gap median was 185.4 ms. A source Clients request separately stalled ~19.14 seconds before recorded DNS/connection work (connection phase ~62 ms), with matching auth/data spans far shorter. Saved partial matching traces and source-stall evidence. Build/lint/typecheck and regression tests passed. Independent browser/network comparison, remaining auth/API outliers and authorized security integration checks remain open; production unchanged.

- 2026-09-12 delivery/recovery continuation: Reproduced a 19.35-second Ledger click with 18.13 seconds before browser requestStart, and a separate 4.98-second click with correlated slow auth/API spans. Added numeric DNS/TCP/TLS timing capture; the pre-send stall did not recur in a separate ten-trial check, so its finer cause remains open. Fixed resolved auth/membership error misclassification in the existing firm loader and added a generic route-group retry boundary above dashboard layout. Preserved fresh verification, active membership filters, roles, request memoization and genuine access redirects. Local recovery/privacy/UI and regression checks passed; protected hnd1 recovery preview created, production unchanged. No live outage, membership change or financial mutation injected.

- 2026-09-12 exact-request follow-up: Inspected sidebar, middleware, cached firm loader, queue/ledger queries and review action flow before editing. Changed only diagnostic scripts to correlate client responses, trial phases, optional Clients-source navigation and cancelled-request timing. Ten real-account Clients-to-Ledger/Queue trials reproduced 6527 ms Ledger click and 4941 ms queue hard-load outliers; exact matching auth/data spans were each under 50 ms. Saved browser and per-route trace evidence; no app runtime changes or new deployment. Build/lint/typecheck and diagnostic/query/session tests passed. Remaining work is outside measured auth/data spans, plus the separately identified server firm-loader error recovery issue and authorized security integration fixtures. Production and financial records unchanged.

- 2026-09-12 auth resilience: Added five-second middleware auth deadline with transport cancellation and private fail-closed 503 for transient failures; invalid sessions still redirect. Local fault/cookie/cancellation tests, build, lint/typecheck, query/tracing and phase 1/2/3 hardening checks passed. Verified protected hnd1 preview using the existing real account: ten trials per mode each for queue and ledger; click medians 896/892 ms, maxima 2927/915 ms. Queue targets remain unmet; auth stall did not recur in the partial 87-span log window, which is not proof of resolution. Saved sanitized evidence in docs/performance. Production unchanged; no financial mutations or password changes.

- 2026-09-12 tail investigation: Ledger follow-up recorded a 25-second browser request wait and concurrent ~40-second Edge auth spans. Tested the same auth guard under supported Node proxy in a separate hnd1 preview (30 queue trials); queue p95 was 2427 ms, so the runtime change was not retained. Selected local configuration remains original middleware plus hnd1. Added build-manifest auth-matcher regression coverage. Intermittent stalls and p95 targets remain open; no production promotion.

- 2026-09-12 Tokyo comparison: User Infrastructure screenshot confirmed Supabase ap-northeast-1. Deployed and verified hnd1 preview; 30 review-queue trials per mode reduced median click-to-rows from 1905 to 913 ms and p95 from 1949 to 1419 ms. Prepared vercel.json region with cron jobs unchanged. All p95 targets remain unmet; three-route checks found a 5519 ms Ledger outlier despite fast server spans, now under targeted browser/network follow-up. Production remains unchanged.

- 2026-09-12 continuation: Deployed protected instrumentation and selective-prefetch previews. The real-account baseline completed 30 hard navigations and 30 queue clicks; click p95 was 1949 ms and hard-navigation-to-rows p95 was 2596 ms. Sanitized browser/trace artifacts are in docs/performance. Database region confirmation and the colocation experiment remain pending; production is unchanged.
- 2026-09-12 comparison complete: The selective-prefetch preview also completed 30 trials per mode. Tracked requests fell from 511 to 462, but click p95 rose to 2435 ms; the experiment remains disabled by default. Captured a separate sanitized 995-event Chrome CPU timeline and corrected final-response timing for Early Hints. Local lint/typecheck/build and session/tracing checks passed. Region confirmation, colocation testing and remaining authorization/workflow integration states are still outstanding.

- 2026-09-12: Implemented correlated dashboard latency diagnostics, tested auth cookie propagation and an opt-in prefetch experiment, corrected browser readiness measurement, and verified production functions execute in iad1. Local checks passed; database region and authenticated preview latency/security comparisons remain unverified. See `docs/performance/dashboard-latency-results.md`.

- Plan and execute dashboard UI/UX audit improvements across the protected CA console, mirroring the public-site audit process while preserving dense operational workflows, RLS assumptions, and CA-controlled accounting decisions.
- Deploy and visually verify the September 8, 2026 live website UI/UX audit polish on desktop, tablet, and mobile, including social previews and Supabase password recovery redirects.
- Verify AI extraction fallback layer so simple WhatsApp text invoices can become Review Queue items without paid OpenAI credits.
- Verify automatic AI extraction job processing on live Supabase/Vercel after applying the new worker migration and adding `CRON_SECRET`.
- Verify Phase 2 against a live Supabase project.
- Apply Supabase migrations for lead requests, firms, and memberships.
- Verify Phase 4 client management against a live Supabase project.
- Continue Phase 3 dashboard shell with filters, modals, and real data wiring.
- Continue dashboard design-system migration across protected work areas, prioritizing shared primitives, dense tables, compact forms, and Lovable-aligned spacing while preserving existing Supabase flows.
- Verify Phase 5 WhatsApp webhook with Meta after environment variables and public URL are configured.
- Verify KO-PERF-04 Stage 2 fast-ack webhook cutover in staging and production: the webhook now verifies Meta signature, durably queues inbound events, and returns before worker-side matching/media/document/job/ack processing; signed production probe and protected worker processing passed, while scheduler cadence still needs continued monitoring because no new GitHub scheduled run appeared during the short post-cutover wait window.
- Verify Phase 6 AI extraction against real OpenAI and Supabase credentials.
- Verify Phase 7 review actions and ledger handoff against live Supabase data.
- Verify Phase 8 ledger filters and correction workflow against live Supabase data.
- Verify Phase 9 GST summary generation against live approved transactions.
- Verify Phase 10 reports and exports against live Supabase Storage and real approved transaction/GST summary data.
- Verify Phase 11 audit, operations, rate-limit, and production smoke checklist against live deployment settings.
- Verify Phase 12 health checks, smoke scripts, demo seed, deployment runbook, and RLS verification plan against a live Supabase project and deployed app.
- Keep Phase 13 platform extensions behind explicit provider, compliance, RLS, audit, and smoke-test gates.
- Local environment values from the old application credential file have been mapped into `.env.local`; OpenAI credentials remain missing unless supplied separately.

## Milestones

| Milestone | Status | Notes |
| --- | --- | --- |
| Documentation baseline | Complete | BRD, PRD, TRD, CRD, app flow, design, schema, implementation plan, tracker, rules, AGENTS.md, skills |
| Project setup | Complete | Next.js App Router, TypeScript, Tailwind, Supabase helpers, env template, CI |
| Landing page | Complete | Public page and demo/signup/waitlist CTA capture flow implemented |
| Auth and firm workspace | In progress | Login/signup, middleware, onboarding, firm tables, and RLS migration implemented; needs live Supabase verification |
| Dashboard shell | In progress | Lovable-aligned sidebar/topbar, protected overview, module routes, shared status/table primitives, and first core list-page migration implemented; filters/modals and remaining detail pages still need polish |
| Client management | In progress | Client table, RLS, list/detail/create/edit/archive flows, WhatsApp mapping fields, and audit logging implemented; needs live Supabase verification |
| WhatsApp ingestion | In progress | Webhook verification, signature validation, raw message storage, client matching, media download, document creation, processing jobs, and inbox view implemented; needs live Meta/Supabase verification |
| AI extraction | In progress | Structured output schema, OpenAI Responses processor, AI extraction table, draft transaction creation, job endpoint, and review queue data view implemented; text-first and needs live verification |
| Review queue | In progress | Transaction detail, edit, approve, reject, duplicate, clarification request, audit logging, and ledger handoff implemented; needs live Supabase verification |
| Ledger | In progress | Ledger handoff table, RLS, approval-generated entries, filters, entry detail, correction form, and correction audit logging implemented; needs live Supabase verification |
| GST summaries | In progress | GST period table, summary table, generation action, readiness flags, summary list/detail, source transaction view, and audit logging implemented; needs live Supabase verification |
| Reports and exports | In progress | Export table, private storage buckets, CSV transactions, GST summary CSV/PDF, export history, report hub, and guarded download route implemented; needs live Supabase verification |
| Audit, security, and operations | In progress | Real audit log viewer, processing job operations view, settings readiness screen, endpoint rate limits, structured operational error logging, and smoke checklist implemented; needs live verification |
| Production hardening | In progress | Verify script, local smoke runner, health endpoint, demo seed script, CI lint/build/typecheck, security headers, production runbook, RLS verification plan, and expanded smoke checklist implemented; needs live deployment verification |
| Long-term platform extensions | In progress | Future integration schema, GST provider boundary, Platform roadmap page, and platform extension roadmap document implemented; features remain gated and not production-live |

## Open Decisions

- Final launch CTA: demo booking, waitlist, direct signup, or all three.
- GST integration provider strategy.
- Billing model and pricing.
- Whether production v1 needs staff invite flow or owner-only workspace first.
- Whether Tally export is required in production v1 or v1.1.
- Whether PDF/image processing through OpenAI native media input is sufficient for pilot quality or needs a dedicated OCR pipeline.

## Risks

- AI extraction accuracy must be validated with Indian invoices and receipts.
- GST workflows must remain CA-reviewed.
- WhatsApp sender matching must handle shared phones and business owners with multiple GSTINs.
- RLS and firm isolation must be tested early.
- Export formats must be checked by practicing CAs.

## Next Tasks

- Apply and verify migrations `20260912200000`, `20260912210000`, then `20260912220000`;
  deploy WA-LAT-4/5/6; and run controlled retry, terminal-failure, independent-client
  concurrency, ordering, duplicate-side-effect, recovery-cadence, and suppressed-wake-up
  canaries.
- Run image, PDF, and audio production canaries for WA-LAT-3, confirming one acknowledgment, one document/job/extraction where applicable, bounded queue wait, and no duplicate side effects.
- Do not automatically replay the existing failed AI backlog; classify and reconcile those failures separately.
- Manual testing by product owner: authenticated desktop/tablet/mobile visual verification for `docs/Dashboard-UI-UX-Audit-Implementation-Plan.md` using seeded or live dashboard data.
- Deploy the live website UI/UX audit polish and validate metadata previews for Open Graph, Twitter/X, LinkedIn, and WhatsApp sharing.
- Verify Supabase password reset email links redirect to `/reset-password` and successfully update passwords in production.
- Visually verify the landing, login, signup, forgot-password, reset-password, privacy, terms, and contact pages at desktop, tablet, and mobile widths.
- Deploy and visually verify the new conversion-focused landing page redesign against the production URL on desktop, tablet, and mobile widths.
- Deploy and verify the safe WhatsApp greeting/help menu responder from `docs/WhatsApp-Help-Menu-Plan.md` with matched and unmatched sender tests.
- Apply `supabase/migrations/20260812090000_normalize_transactions_nullable_fields.sql` in Supabase if Operations "Run now" reports any not-null violation on draft transaction fields such as `date`, `amount`, or `category`.
- Apply `supabase/migrations/20260812103000_normalize_transaction_lifecycle_constraints.sql` in Supabase if approving a transaction reports `transactions_status_check`.
- Deploy AI extraction fallback layer and set `AI_EXTRACTION_PROVIDER_ORDER=rule_based_text` in Vercel for no-credit testing.
- Apply `supabase/migrations/20260811110000_add_ai_extraction_job_worker.sql` in Supabase.
- Add `CRON_SECRET` to Vercel environment variables and redeploy so Vercel Cron can call `/api/jobs/ai-extraction/run-queued`. Hobby deployments use daily cron; use the Operations "Run now" action or an external scheduler for immediate testing.
- Send a matched WhatsApp text invoice and confirm it automatically appears in Review Queue without manually calling `/api/jobs/ai-extraction`.
- Configure Supabase environment variables locally.
- Apply Supabase migrations.
- Verify signup, login, firm onboarding, protected dashboard, and signout against Supabase.
- Verify client create, edit, archive, RLS isolation, and audit logs against Supabase.
- Add shared dashboard filter/modal primitives.
- Continue migrating dashboard detail pages, operational forms, and secondary modules to shared primitives.
- Configure WhatsApp environment variables and public webhook URL.
- Verify Meta webhook challenge and signed POST delivery.
- Verify media download/upload to private Supabase storage.
- Verify matched and unmatched sender behavior.
- KO-PERF-04 Stage 2 fast-ack webhook cutover is implemented and production-probed: signed webhook acceptance, durable queue insert, duplicate handling, invalid-signature rejection, and protected worker processing passed. Continue monitoring the five-minute GitHub scheduler cadence with real inbound events.
- Configure `OPENAI_API_KEY`, `OPENAI_EXTRACTION_MODEL`, and optional `JOB_RUNNER_SECRET`.
- Configure `OPENAI_TRANSCRIPTION_MODEL` before relying on audio-note extraction.
- Add OpenAI credits or use an authorized non-production provider account with credits, then rerun PDF/image/scanned-PDF media extraction staging smoke; the latest PDF diagnostic reached OpenAI but received `429 no credits remaining`, and the app now preserves that provider error when text fallback is unavailable.
- Deploy the current export worker route to non-production; local current-code export generation passed against the authorized non-production database, but the configured deployed URL returned `404` for `/api/jobs/exports/run-queued`.
- Review and promote the current Vercel preview only after launch blockers are accepted or cleared; preview `khata-pm7ju8lr2-sandeep-s01s-projects.vercel.app` builds and exposes the new health/export routes behind Deployment Protection, while public production `khataone.vercel.app` is still on the older deployment without those routes.
- Complete Phase 2 cleanup after evidence review by running `cleanup:phase2-staging-fixtures` with the specific synthetic run IDs to remove only attributed test records/storage.
- Use the Phase 3 workload manifest and fail-closed capacity harnesses after Phase 2 media/export deployment verification passes; current Phase 3 preflight is blocked by missing native `k6` and a signed-in dashboard test cookie.
- Verify Phase 7 approve, edit, reject, duplicate, clarification, audit, and ledger handoff flows against Supabase.
- Verify Phase 8 ledger filters, entry detail, correction flow, and correction audit logs against Supabase.
- Verify Phase 9 GST period generation, readiness status, tax buckets, source transactions, and audit logs against Supabase.
- Verify Phase 10 CSV/PDF generation, private storage upload/download, and export audit logs against Supabase.
- Verify Phase 11 audit log filtering, operations job visibility, endpoint rate limiting, and settings readiness with live credentials.
- Connect structured operational logs to Sentry or chosen monitoring provider.
- Run `npm run verify` and `SMOKE_BASE_URL=<deployment-url> npm run smoke:local` in deployment pipeline.
- Run `npm run seed:demo` after live Supabase migrations and at least one Auth user exist.
- Complete `docs/RLS-Verification-Plan.md` with two live test firms.
- Review `docs/Platform-Extensions-Roadmap.md` before implementing GST filing, GSTR comparison, bank reconciliation, reminders, sync, billing, analytics, or admin console features.
- Replace the planned GST provider boundary only after verifying an approved provider contract/docs and adding production smoke checks.
- Validate export formats with a practicing CA before marking production-ready.
- Add first end-to-end demo path with seeded data.

## Change Log

| Date | Change |
| --- | --- |
| 2026-09-12 | Implemented WA-LAT-5 locally with a keyed three-wide WhatsApp/two-wide AI worker pool, deterministic results, sequential sender/client streams, and service-only durable ordering leases across overlapping skip-locked claimers. Focused ordering, concurrency, security, lint, and type checks pass; migrations/deployment/live canaries remain pending. |
| 2026-09-12 | Implemented WA-LAT-4 locally with end-to-end Meta request deadlines, bounded sanitized provider errors, classified OpenAI/Meta retries, capped jittered backoff, durable future scheduling, outbound ID correlation, and terminal-failure isolation. Focused and full local release verification pass; migration/deployment/live canaries remain pending. |
| 2026-09-12 | Passed the WA-LAT-3 matched text-invoice production canary on `dpl_6PbPNa7h4C1sDtYUB9MrmNXmxhj3`: 63 ms claim, 976 ms acknowledgment, 1.18 s durable job creation, and 1.54 s extraction/transaction completion. Exactly one row exists at each boundary, output is `needs_review`, no event/job/Vercel error occurred, and the historical failed backlog remained 17. |
| 2026-09-12 | Activated WA-LAT-3 on healthy production deployment `dpl_6PbPNa7h4C1sDtYUB9MrmNXmxhj3` after a successful flag-off deployment. Liveness is 200, activation logs contain no errors, and the 17 historical failed AI jobs remained unchanged before the matched invoice canary. |
| 2026-09-12 | Implemented WA-LAT-3 locally behind a default-off flag. Newly inserted WhatsApp extraction job IDs are propagated to the existing post-response callback and claimed exactly; duplicate/existing and historical failed jobs are excluded. Focused and full release verification pass with zero known production dependency vulnerabilities; production canary remains pending. |
| 2026-09-12 | Passed the WA-LAT-2 production canary on deployment `dpl_DHXvqKRt2bap264KmCiurJ1QihH5`: a fresh signed help message was claimed in 66 ms, acknowledged in 1.32 s, and completed in 1.40 s, with exactly one event/message, no event or Vercel error, and healthy liveness. Immediate ingestion remains enabled; WA-LAT-3 is next. |
| 2026-09-12 | Implemented WA-LAT-2 locally behind a default-off server flag: successful durable webhook inserts schedule the existing ingestion claimant after the response, and matched acknowledgments now precede media/document/job work. Deterministic ordering/flag/idempotency tests and the complete local release verifier pass; production activation and provider canary remain pending. |
| 2026-09-12 | Completed WA-LAT-1 locally with deterministic WhatsApp flow regression coverage and opt-in privacy-safe webhook, ingestion, acknowledgment, media, extraction-enqueue, and AI queue/process timings. The complete local release verifier passes with zero known production dependency vulnerabilities; no message ordering, worker triggering, deployment, provider, or live-data behavior changed. |
| 2026-09-12 | Added Phase 12A WhatsApp latency remediation plan after tracing the signed webhook, durable event claim, acknowledgment/media ordering, extraction job claim, scheduler configuration, and observed production queue delay. Selected event-driven wake-up at existing claim boundaries with scheduler recovery, phased tests, feature-flagged canary, observability, and non-destructive rollback; no runtime implementation or live mutation was performed. |
| 2026-09-10 | Started production hardening Phase 0/1 from the launch audit: added atomic approval/handoff RPC migration with one-handoff uniqueness, centralized CSV export sanitization, and local hardening regression checks; external RLS/staging/provider verification remains blocked until authorized targets and test users are supplied. |
| 2026-09-10 | Added fail-closed staging verification harnesses for the production hardening next step: approval migration duplicate preflight, approval RPC retry/concurrency checks, and RLS access-matrix execution remain blocked unless an explicitly labeled non-production Supabase target and role fixtures are provided. |
| 2026-09-11 | Started production hardening Phase 2: added media-aware OpenAI extraction preparation for private image/PDF/audio inputs, queued export generation with a protected worker route and claim migration, and local static hardening checks; live provider, migration, storage, and load verification remain blocked until an authorized non-production target is supplied. |
| 2026-09-11 | Added fail-closed Phase 2 staging harnesses for export-generation migration preflight, queued export worker smoke, and media extraction worker smoke; scripts require explicit non-production allowlist variables and fixture IDs before touching staging resources. |
| 2026-09-11 | Added a fail-closed Phase 2 staging fixture seeder that creates a synthetic approved export fixture and queued media extraction fixture under explicit non-production controls, printing the IDs needed by the worker smoke scripts. |
| 2026-09-11 | Added a fail-closed Phase 2 staging fixture cleanup script that removes only attributed synthetic export/media fixtures and their private storage objects by firm ID and run ID. |
| 2026-09-11 | Started Phase 3 capacity/release scaffolding with a versioned workload manifest, fail-closed k6 open-arrival load script, capacity preflight, post-run business reconciliation, and static local checks; staging capacity evidence remains blocked pending authorized non-production target and test credentials. |
| 2026-09-11 | Added the Phase 3 capacity runbook and npm load entry point so authorized staging runs have a documented preflight, k6 execution, reconciliation, stop-condition, and evidence-preservation sequence. |
| 2026-09-11 | Added Phase 3 evidence-capture scaffolding with a redacted environment template and local run-directory creator for k6 summaries, reconciliation output, and command preservation. |
| 2026-09-11 | Ran authorized non-production verification for production hardening: approval migration/export migration preflights passed, approval RPC concurrency and RLS access matrix passed, local current-code export worker smoke passed, health/worker-secret smoke passed, PDF media extraction reached OpenAI but was blocked by `429 no credits remaining`, and Phase 3 capacity load remains blocked by missing native k6 plus authenticated dashboard cookie. |
| 2026-09-11 | Hardened AI extraction failure reporting so media jobs preserve the actionable OpenAI provider error when rule-based text fallback cannot run because source text is missing; local Phase 2 hardening and TypeScript checks passed. |
| 2026-09-11 | Created a Vercel preview deployment from the current workspace and verified it behind Deployment Protection with `vercel curl`: liveness passed, readiness was degraded due known warnings/failed jobs, and the export worker route exists and rejects missing runner secrets; public production remains on the older deployment. |
| 2026-09-11 | Split health checks into fast liveness and deeper readiness endpoints while keeping `/api/health` as a compatibility readiness route; updated operations documentation for incident and smoke usage. |
| 2026-09-11 | Added development hardening for Operations job control: export generation jobs now have a single-job claim RPC, manual worker action, dashboard Run now control, and visible oldest active job age alongside AI extraction jobs. |
| 2026-09-11 | Added development hardening for bounded export generation: transaction CSV exports now enforce row/file byte limits, record approval snapshot metadata, surface failed export reasons, and update export copy to reflect background queueing. |
| 2026-09-11 | Added Operations queue-health development hardening with per-job-type active/failed/completed counts and configurable stale active-job warnings. |
| 2026-09-11 | Added processing-job aggregate readiness health so `/api/health/ready` degrades on stale active jobs or failed-job counts using configurable operations thresholds. |
| 2026-09-11 | Added configurable endpoint rate-limit thresholds and readiness visibility for shared platform/edge/store rate-limit enforcement, while keeping process-local limiting as a local guard. |
| 2026-09-11 | Hardened rate-limit client key derivation so forwarded IP headers are ignored unless `TRUST_FORWARDED_IP_HEADERS=true` is explicitly configured behind a trusted proxy, with readiness visibility for the setting. |
| 2026-09-10 | Implemented the safe dashboard performance pass with opt-in sanitized server timing, browser timing harness scaffolding, Clients database-side search before pagination, Review Queue low-confidence query filtering, deterministic pagination tie-breakers, health check duration reporting, prepared Supabase search/tie-break indexes, and local validation via `test:performance`, typecheck, lint, and build. |
| 2026-09-10 | Completed a diagnosis-only performance audit package with `docs/performance/PERFORMANCE_DIAGNOSIS.md` and `docs/performance/PERFORMANCE_BASELINE.json`, covering verified architecture, measured unauthenticated local/live baselines, code-confirmed bottlenecks, blocked authenticated/index evidence, and ranked next-phase recommendations. |
| 2026-09-10 | Added `docs/Performance-Architecture-Brief.md` as a copy-ready architecture/workflow/performance context package for independent ChatGPT diagnosis of authenticated dashboard navigation latency. |
| 2026-09-10 | Linked the local checkout to the Vercel `khata-one` project and verified Vercel env names without exposing secret values; `SUPABASE_ACCESS_TOKEN` is not present in any listed Vercel environment, so production Supabase migration remains blocked on a Supabase CLI access token or database password. Renamed authenticated timing tooling to `perf:live-dashboard` with normal live dashboard credential env names. |
| 2026-09-09 | Added authenticated live dashboard performance smoke coverage using Supabase SSR sign-in cookies and timed requests for dashboard, Clients, Ledger, Review Queue, Inbox, and GST Summary routes; production index application remains gated on Supabase CLI/database credentials. |
| 2026-09-09 | Implemented dashboard performance pass 3 by narrowing middleware matching to dashboard/onboarding/auth routes only, removing unnecessary Supabase auth refresh work from public pages and API endpoints while keeping protected route checks in place. |
| 2026-09-09 | Implemented dashboard performance pass 2 with shared pagination controls and bounded page-size queries for Clients, WhatsApp Inbox, Review Queue, and Ledger so route changes fetch only the visible page plus one lookahead record while preserving active filters. Local verify passed. |
| 2026-09-09 | Implemented first dashboard performance pass: request-cached firm context, removed duplicate page-level Supabase clients across dashboard routes, parallelized independent reads on hot pages, pushed status filters into Clients/Inbox/Review Queue queries, added dashboard loading skeleton, and added composite Supabase indexes for tenant-scoped dashboard queries. Local verify and smoke checks passed. |
| 2026-09-09 | Completed pre-push cleanup for the latest UI changes: fixed sidebar storage state handling for hydration-safe collapse persistence, removed stale imports/comments, normalized Tailwind utilities, pinned Turbopack to the repo root, and verified with `npm.cmd run verify`, `git diff --check`, and local smoke checks against `http://localhost:3000`. |
| 2026-09-09 | Implemented collapsible DashboardSidebar with full (w-64) and icon-only (w-[68px]) modes, top-right PanelLeftClose/PanelLeft collapse toggle button, Ctrl+B / Cmd+B keyboard shortcut, workspace avatar switcher card, custom sleek scrollbar (.k-scrollbar), and tooltip cues for collapsed icon navigation. Build passed cleanly. |
| 2026-09-09 | Redesigned landing page footer: upgraded to a 12-column structured layout with 3 categorized navigation groups (Product, Workspace, Trust & Legal), trust/compliance tags (India GST Ready, CA Controlled), full-width copyright bottom bar, and verified links. Build passed cleanly. |
| 2026-09-09 | Implemented redesigned professional header: upgraded to a 3-column CSS Grid (`grid-cols-[1fr_auto_1fr]`) for true mathematical navigation centering, standard 64px (`h-16`) vertical height, segmented capsule navigation pill with active/hover states, action boundary divider, kinetic primary CTA (`ArrowRight`), and polished mobile drawer. Build verification passed cleanly. |
| 2026-09-09 | Standardized UI components across public pages and auth forms: refactored `src/app/page.tsx`, `LeadCaptureForm`, and `AuthForm` to use unified primitives from `src/components/design-system.tsx` (`ActionLink`, `Input`, `Select`, `Textarea`, `Button`, `FormMessage`) and `StatusChip` with brand tone support. `npm run build` passed cleanly. |
| 2026-09-09 | Completed a development-only dashboard UI/UX follow-up with richer client detail operations panels for recent documents, review workload, approved records, GST readiness, and audit history, plus expanded Review Queue filters for client, document type, status, risk, search, and transaction date range; local lint/typecheck/build verification passed. |
| 2026-09-08 | Completed local dashboard audit Phase 9 verification pass: `npm.cmd run verify` passed and `SMOKE_BASE_URL=http://localhost:3000 npm.cmd run smoke:local` passed with expected unauthenticated dashboard redirects; authenticated desktop/tablet/mobile visual verification remains pending seeded/live credentials. |
| 2026-09-08 | Implemented dashboard audit Phase 8 first pass with expanded audit filters for action/entity/actor/date, accessibility labels for admin tables, truncated operations error display, role-gated run actions preserved, and explicit platform integration boundaries; local lint/typecheck/build verification passed. |
| 2026-09-08 | Implemented dashboard audit Phase 7 first pass with clearer GST readiness tables, separate mismatch and missing-document counts, explicit non-filing guidance in GST/export forms, private export/audit expectations, reserved Tally-ready labeling, table accessibility labels, and local lint/typecheck/build verification. |
| 2026-09-08 | Implemented dashboard audit Phase 6 first pass with visible active ledger filters, clearer filtered empty states, ledger table accessibility labels, and a correction page before-state panel showing current handoff values beside the audited correction form; local lint/typecheck/build verification passed. |
| 2026-09-08 | Implemented dashboard audit Phase 5 first pass with review queue search/status/risk filters, a denser review table including transaction date, risk flags, confidence, amount, age, and direct review actions, plus a sticky review-detail rail for summary, source evidence, and audited decision actions; local lint/typecheck/build verification passed. |
| 2026-09-08 | Implemented dashboard audit Phase 4 first pass with compact filters and filtered empty states for Clients and WhatsApp Inbox, status summaries for client setup, clearer inbox triage labels for unmatched/failed/queued/ready states, table accessibility labels, and local lint/typecheck/build verification. |
| 2026-09-08 | Implemented dashboard audit Phase 3 by turning the overview into a priority worklist for pending reviews, WhatsApp intake attention, GST blockers, and export job attention, with direct route links and an action-oriented latest-review snapshot; local lint/typecheck/build verification passed. |
| 2026-09-08 | Implemented the first dashboard UI/UX audit slice with protected dashboard metadata, skip-to-content navigation, mobile workspace nav auto-close, active link `aria-current`, mobile-safe sign-out labeling, resizable shared textareas, keyboard-reachable table scroll regions, sticky shared table headers, and local lint/typecheck/build verification. |
| 2026-09-08 | Added dashboard UI/UX audit implementation plan covering shell/navigation, shared operational primitives, overview prioritization, clients/inbox triage, review workflow, ledger, GST/reports/exports, audit/operations/settings, platform boundaries, responsive checks, and verification matrix. |
| 2026-09-08 | Implemented live website UI/UX audit fixes across metadata, generated social images, sitemap/robots, landing trust copy, CTA consistency, auth recovery, password visibility, demo form accessibility, mobile navigation, scroll-spy nav, structured data, and public legal/contact pages; local lint, typecheck, build, and HTTP route checks passed. |
| 2026-09-08 | Added live website UI/UX audit implementation plan covering public metadata, trust copy, auth recovery, demo form accessibility, navigation behavior, responsive polish, structured data, and verification order. |
| 2026-08-10 | Created initial planning and architecture document set for KhataOne. |
| 2026-08-10 | Added root `AGENTS.md` and KhataOne-specific Codex skills for product, design, backend, WhatsApp, AI extraction, GST, and implementation tracking. |
| 2026-08-10 | Completed Phase 0 project foundation and started Phase 1 landing page implementation. |
| 2026-08-10 | Completed Phase 1 landing page CTA capture flow with Supabase-backed lead request migration. |
| 2026-08-10 | Added Phase 2 auth/workspace foundation and Phase 3 dashboard shell routes. |
| 2026-08-10 | Added Phase 4 client management foundation with schema, RLS, create/edit/archive actions, client pages, and audit logs. |
| 2026-08-10 | Added Phase 5 WhatsApp ingestion foundation with webhook route, signature verification, raw message storage, media handling, document queueing, and inbox data view. |
| 2026-08-10 | Added Phase 6 AI extraction foundation with structured outputs, schema validation, AI extraction records, draft transaction creation, job endpoint, and review queue data view. |
| 2026-08-10 | Added Phase 7 review workflow foundation with transaction editing, approve/reject/duplicate/clarification actions, audit logs, ledger handoff migration, and real ledger view. |
| 2026-08-10 | Added Phase 8 ledger workflow foundation with filters, totals, entry detail, correction form, and ledger correction audit logging. |
| 2026-08-10 | Added Phase 9 GST summary foundation with periods, summary generation, readiness flags, source transaction view, and audit logging. |
| 2026-08-10 | Added Phase 10 reports and exports foundation with export history schema, private storage buckets, transactions CSV, GST summary CSV/PDF generation, guarded downloads, and report hub. |
| 2026-08-10 | Added Phase 11 audit, security, and operations foundation with audit log filters, operations job health view, settings readiness, endpoint rate limits, structured error logging, and production smoke checklist. |
| 2026-08-10 | Added Phase 12 production hardening foundation with health endpoint, smoke runner, demo seed script, security headers, CI lint coverage, production runbook, RLS verification plan, and expanded release checklist. |
| 2026-08-10 | Added Phase 13 long-term platform extension foundation with future integration schema, blocked GST provider boundary, Platform dashboard page, and roadmap gates. |
| 2026-08-10 | Mapped legacy application environment credentials into the current KhataOne env contract and documented the mapping without exposing secret values. |
| 2026-08-11 | Added automatic AI extraction worker implementation plan as the next production workflow improvement after WhatsApp ingestion. |
| 2026-08-11 | Implemented automatic AI extraction job worker with safe job claiming, idempotent extraction, protected Vercel Cron route, Operations manual run action, health/settings/env docs, and local lint/typecheck/build verification. |
| 2026-08-11 | Adjusted Vercel Cron schedule to daily so Hobby-plan deployments can succeed. |
| 2026-08-11 | Added AI extraction fallback layer plan focused on a no-cost deterministic text parser before any additional paid provider integration. |
| 2026-08-11 | Implemented AI extraction provider layer with OpenAI provider, no-cost rule-based text fallback, provider-order env config, fallback health/settings visibility, and Review Queue extraction-source labels. |
| 2026-08-11 | Added migration to relax legacy `transactions.date` not-null constraint so uncertain fallback extractions can enter Review Queue with null canonical `transaction_date`. |
| 2026-08-11 | Added broader legacy transactions compatibility migration for old `date` and `amount` columns. |
| 2026-08-12 | Added transaction schema normalization migration to stop repeated Operations failures from legacy not-null constraints on draft AI extraction fields such as `category`. |
| 2026-08-12 | Hardened transaction approval so ledger handoff creation surfaces errors, uses verified server-side mutation flow, records the ledger entry id in audit metadata, and rolls approval back if handoff creation fails. |
| 2026-08-12 | Added transaction lifecycle constraint normalization so live legacy databases allow the current `approved`, `rejected`, `duplicate`, and `exported` transaction states. |
| 2026-08-12 | Added project-level CRD for landing page and CA dashboard creation, including positioning, screen requirements, copy, status language, data mapping, and acceptance criteria. |
| 2026-08-13 | Added safe WhatsApp help menu implementation plan for KhataOne-branded greeting/help responses with website URL, matched/unmatched sender copy, and no unbuilt command promises. |
| 2026-08-13 | Implemented the safe WhatsApp greeting/help menu responder so simple help commands are stored, marked ignored, answered with KhataOne-branded guidance, and kept out of document/job extraction. |
| 2026-08-13 | Added landing page design improvement plan based on design audit priorities: safer claims, clearer hero, WhatsApp visual, trust section, workflow polish, and responsive checks. |
| 2026-08-13 | Implemented landing page design improvements with safer claims, sharper hero messaging, a WhatsApp intake visual, realistic review queue details, numbered workflow, trust/control section, and demo-step context. |
| 2026-08-14 | Added standalone `khataone-ui-prototype` frontend-only interactive UI prototype with mock data, local state, route coverage, role simulations, review/ledger/GST/export/audit/operations flows, and local typecheck/build verification. |
| 2026-08-15 | Redesigned the public landing page into the reference-inspired B2B SaaS layout with logo badge header, grid hero, review console preview, proof strip, platform grid, dark workflow band, demo form polish, explicit responsive viewport metadata, and local lint/typecheck/build verification. |
| 2026-08-15 | Applied landing-page-only production polish with compact SaaS navigation, WhatsApp/GST-specific hero copy, stronger workflow order, human-control review mockup, business-value section, final dark CTA, responsive hero safeguards, and local lint/typecheck/build verification. |
| 2026-08-15 | Implemented KO-PERF-04 Stage 1 infrastructure with durable WhatsApp webhook event schema, claim function, idempotent ingestion worker, protected worker route, conservative acknowledgment state handling, and local lint/typecheck/build verification while leaving the live webhook on synchronous processing. |
| 2026-08-16 | Added Vercel Cron wiring for the KO-PERF-04 WhatsApp ingestion worker at the current Hobby-compatible daily cadence and added a five-minute GitHub Actions external scheduler; Stage 2 remains gated on configuring the repository secret and verifying automatic invocation. |
| 2026-08-16 | Verified the GitHub Actions WhatsApp ingestion scheduler is firing on schedule, but runs fail at `Verify scheduler secret`; Stage 2 remains blocked until the repository `CRON_SECRET` secret is configured and a scheduled run processes a controlled queue probe. |
| 2026-08-16 | Verified the GitHub Actions WhatsApp ingestion scheduler now succeeds with `CRON_SECRET` and processed the controlled queue probe automatically; KO-PERF-04 Stage 1 runtime gate is ready for the separate Stage 2 cutover decision. |
| 2026-08-16 | Implemented KO-PERF-04 Stage 2 webhook cutover so signed WhatsApp POST requests enqueue durable inbound events and return before heavy ingestion work; worker/scheduler continue processing asynchronously. |
| 2026-08-16 | Verified Stage 2 on production with a signed synthetic webhook: initial response created only a queued durable event, duplicate replay was idempotent, invalid signature returned 401, and the protected worker processed the event asynchronously as unmatched; continue monitoring scheduler cadence because no new scheduled run appeared during the short verification window. |
| 2026-09-05 | Started application-wide design-system migration with Sora/Manrope/JetBrains Mono fonts, opacity-safe Tailwind token mapping, shared UI utilities/primitives, refreshed landing/auth/demo form styling, and first dashboard shell/component token pass. |
| 2026-09-05 | Rebuilt the public landing page into a calmer professional SaaS layout inspired by the Lovable direction while preserving the real demo request flow and deferring logo redesign. |
| 2026-09-05 | Tightened the Lovable-inspired landing implementation with safer mobile review-card layout, cleaner typography spacing, lead form polish, removal of prototype/date/fake metric copy, and local lint/typecheck/build plus Playwright viewport verification. |
| 2026-09-05 | Replaced the landing-page header/footer PNG badge with a crisp compact KhataOne lockup matching the green icon-tile reference and generated transparent logo variants from the source image. |
| 2026-09-05 | Compared the landing page against the Lovable GitHub implementation and widened the desktop frame, scaled hero typography, enlarged product-preview/card rhythm, improved form spacing, and verified desktop/tablet/mobile screenshots. |
| 2026-09-05 | Corrected the landing page over-scaling from the previous polish pass by restoring Lovable-source container widths, hero type scale, card density, button sizing, and compact form controls while keeping the cleaner logo lockup. |
| 2026-09-05 | Restored Lovable-matched hero proof numbers and made the quote card orange left rule explicit so it renders reliably with the shared card utility. |
| 2026-09-05 | Extracted the KhataOne K mark from the source logo and placed it inside the landing-page logo tile, replacing the temporary clipboard icon while preserving compact header sizing. |
| 2026-09-05 | Removed the dark backing from the visible landing logo mark, created a no-black light-header K mark variant, and wired matching favicon/app icon assets through Next metadata. |
| 2026-09-05 | Extended the Lovable-inspired public design language to login and signup with the shared KhataOne logo/header/footer, compact auth forms, responsive two-column desktop composition, and local lint/typecheck/build plus viewport screenshot verification. |
| 2026-09-05 | Reworked login and signup into the standalone Lovable-style split-screen auth layout with no header/footer, no prototype/demo-user content, real auth actions preserved, and final lint/typecheck/build plus viewport screenshot verification. |
| 2026-09-05 | Compared the auth pages directly against the Lovable GitHub `login.tsx` source and corrected the oversized auth UI by restoring the prototype's compact `max-w-sm`, `text-2xl`, `text-sm`, `h-9` form controls, hidden mobile side panel, and source-matched split-screen proportions. |
| 2026-09-06 | Started dashboard-area design-system migration with a Lovable-aligned protected shell, grouped icon sidebar, shared button/input/card/stat/table primitives, compact overview, and migrated Clients, Inbox, Review Queue, Ledger, and generic module list surfaces without changing backend flows. |
| 2026-09-06 | Continued dashboard UI migration across review detail, client detail/edit/new, ledger detail/edit, GST summary list/detail, exports, reports, operations, audit logs, settings, and shared operational forms using reusable primitives while preserving existing Supabase queries and server actions. |
| 2026-09-06 | Polished the firm onboarding workspace setup UI with the shared KhataOne logo, compact split setup layout, shared form controls, and design-system card treatment while keeping the existing create-firm server action unchanged. |
| 2026-09-06 | Added shared dashboard action-link and filter-bar primitives, migrated repeated dashboard action/filter surfaces to them, and verified public auth rendering plus protected-route redirects without bypassing authentication. |
| 2026-09-06 | Centralized remaining dashboard text-action links and form validation/message treatments into shared design-system primitives, then reran lint, typecheck, and production build successfully. |
| 2026-09-06 | Replaced dashboard overview scaffolding with firm-scoped live counts, a real review queue snapshot, and active firm context in the protected shell while preserving existing auth, RLS, and Supabase query boundaries. |
| 2026-09-06 | Replaced repeated dashboard and onboarding configuration fallback markup with a shared setup-required design-system surface and removed user-visible implementation-phase wording from protected app screens. |
| 2026-09-06 | Consolidated dashboard page gutters, record counters, and query-error presentation into shared design-system primitives across overview, clients, inbox, review queue, ledger, GST, exports, reports, operations, audit logs, settings, and platform pages. |
| 2026-09-06 | Normalized dashboard detail and edit page content gutters with the shared page body primitive across client, review, ledger, and GST detail workflows while preserving existing route guards and data access. |
| 2026-09-06 | Tightened dashboard header action alignment and centralized operational form footer alignment with a shared form-actions primitive across client, review, and ledger edit forms. |
| 2026-09-06 | Centralized dashboard, onboarding, and demo-request field-label typography into a shared design-system field-label primitive while preserving existing form actions, validation, and Supabase-backed flows. |
| 2026-09-06 | Added a shared inline alert primitive for compact dashboard risk/error signals and applied it to review queue risk flags and operations job failures without changing underlying data or actions. |
| 2026-09-06 | Centralized dashboard table numeric and action cell alignment into shared design-system table classes across overview, queue, ledger, GST, reports, exports, inbox, audit, settings, platform, and detail history tables. |
| 2026-09-06 | Polished shared dashboard empty and setup-required states with consistent icon treatment, action spacing, and setup messaging layout from the design-system layer. |
| 2026-09-06 | Tightened shared dashboard detail-list and key-value metadata primitives with consistent label typography, mobile-safe stacking, and desktop label/value alignment for client, ledger, GST, settings, review, and platform panels. |
| 2026-09-06 | Added a shared icon-panel primitive and migrated settings assurance cards, platform roadmap cards, and the legacy module page wrapper to shared dashboard presentation patterns. |
| 2026-09-06 | Centralized dashboard table numeric and action header alignment into shared design-system table header classes across operational list, overview, detail, history, and legacy module tables. |
| 2026-09-06 | Centralized common dashboard table row typography into shared primary, secondary, and monospace text classes across client, inbox, review, ledger, GST, reports, exports, audit, operations, platform, and legacy module rows. |
| 2026-09-12 | Cleaned obsolete repository artifacts by removing generated caches, the redundant legacy credential file, an unused module-page component, the superseded frontend-only prototype document, and unreferenced logo exports; retained active assets and release evidence, then verified lint and TypeScript. |
| 2026-09-12 | Completed Dashboard UI Refinement step 1 locally: Settings now distinguishes configuration presence from verified health, missing firm/client values say `Not provided`, Ledger totals explicitly describe the current page, and Operations empty timing values use contextual labels. Added focused semantic regression coverage without changing queries, mutations, authorization, or accounting behavior. |
| 2026-09-12 | Completed Dashboard UI Refinement step 2 locally: Export fields now follow the selected transaction/GST format and the action says `Queue export`; failed Operations jobs are directly reachable through the existing status filter; GST date inputs explicitly define a custom period and duplicate filing-boundary copy was removed. Existing server validation, queue states, audit behavior, and per-job retry permissions were preserved. |
| 2026-09-12 | Completed Dashboard UI Refinement step 3 locally: shared pagination captions and record-count grammar are consistent; dashboard dates use centralized India-local formatting; repeated row actions have descriptive accessible labels; empty states are denser; missing/no-data labels are contextual; controls retain compact desktop sizing with larger mobile targets; and shared cards now follow the documented 8px radius. Added focused regression coverage without changing data access or workflow behavior. |
| 2026-09-12 | Completed Dashboard UI Refinement step 4 locally: retained the compact top bar and sidebar widths, shortened repeated approval copy, kept one collapse control in a stable header location, added keyboard-visible collapsed-navigation tooltips through a body portal, added navigation scroll containment, moved Platform after Settings into a Planned group, and replaced the mobile details menu with a native modal dialog supporting Escape, outside-click, focus trapping, and focus return. Focused dashboard tests, lint, TypeScript, release preflight, production build, and unauthenticated route smoke checks passed; authenticated viewport and focus verification remains pending credentials. |
| 2026-09-12 | Completed Dashboard UI Refinement step 5 locally: top-level operational headers are more concise; Overview zero-count attention and readiness signals are neutral; worklist actions name their destinations; Client status chips explicitly cover the current page; Ledger retains localized dates and handoff language; and Platform shows neutral Planned items in at most three columns. Focused regression coverage was added without changing queries, mutations, authorization, accounting, or audit behavior. |
| 2026-09-12 | Prepared Dashboard UI Refinement step 6 verification: added a fail-closed read-only Playwright harness for six authenticated viewport sizes, page overflow, accessible names, mobile targets, skip-link/sidebar/mobile-menu focus behavior, private screenshots, and a 200% zoom stress check. Chromium and the unauthenticated login shell passed at 320x568, 390x844, 768x1024, 1024x768, 1280x800, and 1440x900. The protected dashboard run correctly refuses to start because authorized `LIVE_DASHBOARD_EMAIL` and `LIVE_DASHBOARD_PASSWORD` credentials are absent; Phase 6 remains incomplete without that evidence. |
| 2026-09-12 | Aligned login and registration to a stable desktop top rhythm, corrected password visibility icon centering against the input itself, and made assurance icon/text alignment explicit. Audited the existing browser constraints and authoritative server-action validation before the live-validation follow-up. |
| 2026-09-12 | Refined registration field labels and spacing into one compact, non-shifting rhythm and added accessible real-time validation for name, firm, email, and password. Browser and server actions now consume the same validation rules; invalid submissions are blocked locally and still revalidated authoritatively on the server. |
| 2026-09-12 | Passed the full local release gate for the dashboard refinement, auth validation, and Supabase recovery scheduler changes: repository preflight, hardening/security/worker/database policy suites, dashboard regression harnesses, accounting RPC tests, dependency audit, lint, TypeScript, and production build all passed. External capacity certification and hosted provider/tenant checks remain explicitly outside the local gate. |

2026-09-13 UI/UX remediation progress: R06A-R06B original evidence and GST provenance are locally verified. Added private review evidence signing/rendering and GST saved/current provenance labels. Verification passed: `npm.cmd run test:evidence-provenance`, `npm.cmd run test:review-dirty-interlock`, `npm.cmd run test:unavailable-states`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`. Hosted closure remains gated on isolated private-storage and GST snapshot/change fixtures.

| 2026-09-13 | Added a safe UI/UX browser-matrix runner that verifies public landing/auth routes locally, records protected dashboard routes as blocked without an isolated Playwright storage state, writes sanitized evidence files, and keeps live credentials out of the verification path. |

| 2026-09-13 | Ran the new UI/UX browser matrix locally after fixing public mobile touch targets. Public landing/login/signup/forgot-password/reset-password routes passed at 390px and 1440px with zero failures; 105 authenticated dashboard checks remain blocked pending isolated Playwright storage state and fixture IDs. |

| 2026-09-13 | Added an isolated UI/UX auth-state capture helper and contract test. The helper requires explicit disposable-workspace confirmation, writes storage state under ignored `.codex-tmp/`, and documents the fixture-ID handoff needed before authenticated dashboard browser checks can move from blocked to pass/fail. |
