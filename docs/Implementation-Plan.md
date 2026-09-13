# KhataOne Implementation Plan

## Build Strategy

Build KhataOne in vertical slices. Start with the landing page and project foundation, then build the CA dashboard shell, then connect real data workflows from client setup to WhatsApp ingestion to AI extraction to review to GST summary and export.

## UI/UX Remediation Workstream

The [UI/UX Remediation Plan](UI-UX-Remediation-Plan.md) maps the September 13 audit's
27 findings into scoped correctness, accessibility, investigation and visual
refinement packages. It supplements the feature build sequence below. Planning
is complete; R01, the password-reset outcome correction, R02A-R02B calendar
boundary correction, R03 complete filtered results, R04A-R04E review
action/role/outcome-feedback/return-context fixes, R05A unavailable-state fixes,
and R06A-R06B original-evidence/GST-provenance fixes are locally verified with
mocked or synthetic checks.
R03 requires migration `20260913110000_complete_dashboard_filtered_results.sql` before
hosted verification. R02B Audit timestamp filtering now uses Asia/Kolkata
calendar-day UTC boundaries, consistent with displayed audit times. R07A responsive
containment and shell target-size source/build fixes are verified, with authenticated browser-width verification still pending isolated fixtures. R08A shared accessibility source/build and public auth browser checks are verified; remaining authenticated accessibility checks need isolated fixtures. R09A export visibility and bounded history access is locally verified for source/build behavior; live worker-state and pagination-boundary checks need isolated fixtures. R10A safe investigation detail is locally verified with allowlisted audit detail, internal entity links and sanitized wrapping Operations errors. R11A truthful identity/public claims is locally verified with public/auth browser checks. R12A deliberate density and hierarchy is locally verified for named shared hierarchy tokens, modest table density, auth CTA alignment and D07 guardrails. Broader visual-density changes still need visual approval and isolated authenticated fixtures.
Financial mutations, private storage and role integration checks require the
isolated fixtures specified in that plan; existing live access remains read-only.
The isolated fixture and hosted-verification package is now documented in
[ISOLATED_VERIFICATION_PLAN.md](audits/ui-ux/2026-09-13-diagnosis/ISOLATED_VERIFICATION_PLAN.md),
covering all 27 findings, fixture groups, viewport/accessibility checks and
release gates. `npm.cmd run prepare:ui-ux-evidence` initializes blank sanitized
evidence templates for an isolated verification run.

## Phase 0: Project Foundation

- Initialize Next.js App Router project with TypeScript.
- Configure Tailwind CSS and design tokens.
- Add linting, formatting, typecheck, and build scripts.
- Configure Supabase client, server helpers, and environment variables.
- Create `docs/` as source-of-truth project guidance.
- Add `.env.example`.
- Add CI checks.

## Phase 1: Landing Page

- Build public landing page.
- Add CTA flow for demo/signup/waitlist.
- Include workflow section for WhatsApp, AI extraction, CA review, GST/report exports.
- Add security and auditability trust section.
- Ensure responsive desktop/mobile behavior.
- Verify accessibility and performance basics.

## Phase 2: Authentication And Firm Workspace

- Configure Supabase Auth.
- Create firm and firm user tables.
- Add protected dashboard layout.
- Implement signup/login/logout.
- Add firm onboarding screen.
- Add role-ready access model.

## Phase 3: Dashboard Shell

- Create sidebar navigation.
- Create topbar with firm context and user menu.
- Build Overview, Clients, Inbox, Review Queue, Ledger, GST Summary, Reports, Exports, Audit Logs, Settings routes.
- Add shared table, filter, status chip, button, modal, and form components.

## Phase 4: Client Management

- Build client list and detail pages.
- Add create/edit/archive client flows.
- Store GSTIN, WhatsApp number, filing frequency, state, and assigned staff.
- Add client status model.
- Add audit logs for client changes.

## Phase 5: WhatsApp Ingestion

- Add WhatsApp webhook verification endpoint.
- Add inbound webhook handler.
- Verify signatures.
- Store raw WhatsApp messages.
- Match sender phone to client.
- Download and store media.
- Create document records.
- Add processing job records.
- Send basic acknowledgment message.

## Phase 6: AI Extraction Pipeline

- Define extraction JSON schema.
- Build document text preparation for images, PDFs, audio, and text.
- Integrate OpenAI structured extraction.
- Store raw and normalized AI output.
- Add confidence scores and risk flags.
- Create draft transactions from extraction results.
- Route low-confidence items to review queue.

## Phase 7: Review Queue

- Build filterable review queue.
- Add document preview.
- Add extracted field editor.
- Add approve, reject, duplicate, and request clarification actions.
- Write audit logs for every review action.
- Move approved records into ledger.

## Phase 8: Ledger

- Build client ledger table.
- Add filters by client, date, status, category, and GST period.
- Add manual correction flow.
- Add ledger entry creation from approved transactions.
- Ensure amount formatting and GST fields are reliable.

## Phase 9: GST Summary

- Add GST period model.
- Generate GST summaries from approved transactions.
- Show filing readiness status.
- Surface missing documents, mismatches, low-confidence items, and invalid GST fields.
- Add summary refresh/regeneration action.
- Keep future direct GST integration behind a clear integration boundary.

## Phase 10: Reports And Exports

- Build export creation flow.
- Add CSV transaction export.
- Add PDF GST/accounting summary.
- Add export history.
- Store generated files.
- Log export actions.
- Prepare Tally-compatible export structure for future iteration.

## Phase 11: Audit, Security, And Operations

- Enforce RLS policies.
- Add role-based authorization checks.
- Add audit log viewer.
- Add processing job/error views.
- Add rate limiting for sensitive endpoints.
- Add Sentry or equivalent error tracking.
- Add production smoke test checklist.

## Phase 12: Production Hardening

- Test end-to-end client document flow.
- Test firm isolation.
- Test WhatsApp webhook retries.
- Test AI extraction failure paths.
- Test exports.
- Add backup and migration process.
- Finalize deployment pipeline.
- Run production readiness review.

## Phase 12A: WhatsApp Latency And Worker Delivery

### Verified Current Flow

- Meta sends a signed webhook to `POST /api/webhooks/whatsapp`.
- The route verifies the signature and durably upserts each inbound message into
  `whatsapp_webhook_events`, then returns without running ingestion.
- `claim_whatsapp_webhook_events` provides bounded, skip-locked, retryable claims.
- The ingestion worker currently waits for an external scheduled request and processes
  claimed events serially.
- For normal matched messages, sender matching and message persistence happen first,
  but media lookup, download, private storage upload, document creation, and extraction
  job creation all happen before the tracked WhatsApp acknowledgment.
- AI extraction has a separate durable `processing_jobs` claim boundary and also waits
  for an external scheduled request. Its batch worker is serial.
- GitHub Actions is configured at five-minute intervals, but production evidence on
  2026-09-12 showed multi-hour gaps. The Vercel Hobby fallback runs only daily.

### Architecture Decision

Use event-driven wake-up as the normal path and retain scheduled claiming only as a
recovery sweep. Preserve the existing Postgres event/job tables, unique provider IDs,
service-role-only claim functions, attempt bounds, stale-lease recovery, private media
storage, and review-first accounting behavior. Do not migrate to a second queue system
unless measured volume later proves the current durable claim model insufficient.

The smallest first integration point is immediately after a successful
`enqueueWhatsAppWebhookEvents` call in the signed webhook route. Schedule the existing
`runQueuedWhatsAppIngestionEvents` claimant with Next.js `after()` so the HTTP response
is not delayed. A failed wake-up must be logged but must not change a successfully
persisted webhook response into a failure; the durable row remains available to the
recovery sweep.

The second integration point is successful AI extraction job creation. Wake the
existing claim-based AI worker without bypassing `claim_ai_extraction_job(s)`, ownership
checks, retry bounds, or idempotent document/transaction handling.

### Delivery Sequence

#### WA-LAT-1: Baseline And Regression Harness

Status (2026-09-12): complete locally. The signed route enqueue, help, unmatched,
matched text, matched media, duplicate, acknowledgment retry/skip, ingestion queue wait,
and AI queue wait paths now have deterministic regression coverage. Opt-in timings reuse
`KHATAONE_PERF_DIAGNOSTICS` and contain stage duration, queue wait, attempt count, and
message type only. Runtime ordering, worker triggering, provider behavior, and scheduler
configuration remain unchanged. The complete local release verifier passes; hosted
provider latency and capacity remain unverified.

- Add deterministic tests for signed webhook enqueue, duplicate delivery, worker claim,
  help response, matched text, matched media, unmatched sender, and acknowledgment retry.
- Record separate timings for webhook persistence, queue wait, acknowledgment, media
  handling, extraction queue wait, and extraction completion.
- Keep payloads, tokens, phone numbers, document contents, and provider response bodies
  out of production timing logs.
- Establish initial engineering targets: webhook response p95 below one second, help or
  receipt acknowledgment p95 below five seconds, and no queued event older than one
  minute while the application is healthy.

Exit gate: existing behavior is covered before runtime ordering changes are made.

#### WA-LAT-2: Immediate Ingestion Wake-Up And Fast Acknowledgment

Status (2026-09-12): implemented, verified locally, enabled in production, and passed the
owner-controlled help-message canary.
The signed webhook schedules the existing skip-locked claimant with Next.js `after()`
only when `WHATSAPP_IMMEDIATE_INGESTION_ENABLED=true` and at least one new event was
inserted. The flag defaults off. Matched non-help acknowledgments now occur after the
durable message row but before media/document/job work, with truthful received/processing
copy. Scheduler recovery and all existing claim, lease, retry, signature, rate-limit,
storage, and review boundaries remain intact. The complete local release verifier passes.
Production deployment `dpl_DHXvqKRt2bap264KmCiurJ1QihH5` claimed the fresh signed help
message in 66 ms, sent its acknowledgment 1.32 seconds after durable enqueue, and completed
the event in 1.40 seconds. Exactly one webhook event and one WhatsApp message were stored,
the event had no error, application liveness returned 200, and the canary window contained
no Vercel error logs. Text, image, PDF, and audio provider canaries remain part of the wider
end-to-end gate; WA-LAT-3 is the next implementation phase for their extraction latency.

- After durable enqueue, use Next.js `after()` to invoke the existing ingestion claimant
  with a small bounded batch. Keep the response schema and signature/rate-limit behavior
  unchanged.
- Preserve the external scheduler temporarily as a recovery path for missed wake-ups,
  abandoned invocations, and pre-existing queue backlog.
- For matched non-help messages, send the tracked acknowledgment after sender matching
  and durable `whatsapp_messages` persistence but before Graph media lookup, download,
  storage upload, document creation, or AI work.
- Make the acknowledgment text truthful at that point: the message has been received
  and processing has started; it must not claim successful extraction or bookkeeping.
- Keep the existing acknowledgment lease and maximum-attempt behavior so duplicate
  webhook deliveries do not intentionally send duplicate replies.
- Preserve current unmatched/help privacy behavior unless a separate product decision
  approves a generic unmatched-sender reply.

Exit gate: controlled text, help, image, PDF, and audio messages receive a prompt single
acknowledgment; webhook responses remain fast; duplicate replay creates no duplicate
message, document, job, or acknowledgment.

#### WA-LAT-3: Immediate AI Worker Wake-Up

Status (2026-09-12): implemented, verified locally, and enabled on production deployment
`dpl_6PbPNa7h4C1sDtYUB9MrmNXmxhj3`; the matched text-invoice canary passed and media
canaries remain pending. The
server-only `WHATSAPP_IMMEDIATE_AI_ENABLED` flag defaults off. The existing webhook
post-response callback now receives whether each extraction job was newly inserted and
uses `runAiExtractionJobNow` to claim only those exact new IDs after ingestion has
committed them. Existing jobs, duplicate deliveries, and the historical failed backlog
are not awakened by this path. The scheduled batch claimant and manual Operations action
remain unchanged. The webhook route has a 300-second execution budget for its bounded
post-response ingestion and provider work. The complete local release verifier passes.
The flag-off deployment and subsequent enabled deployment were healthy with no Vercel
errors. The canary was claimed in 63 ms, acknowledged in 976 ms, created its extraction
job in 1.18 seconds, and completed extraction plus transaction creation in 1.54 seconds.
Exactly one event, message, document, job, extraction, and transaction exist. The job
completed on its first attempt without error; the document and transaction are
`needs_review` with `RULE_BASED_EXTRACTION` and `NEEDS_CA_REVIEW`, and the historical
failed AI count remained 17 after the canary. The extraction recorded no provider
failures, so the evidence indicates that production selected the rule-based provider
directly rather than attempting OpenAI. Image, PDF, and audio extraction therefore
remain unverified until OpenAI is intentionally restored to the provider order with
working quota.

- Wake AI processing when a new extraction job is durably created; do not run OpenAI
  inside the Meta webhook request or before the document/job records commit.
- Continue to claim through the service-role-only AI claim functions. Multiple wake-ups
  must be harmless because only one worker can claim a job.
- Leave failed historical jobs manual until their errors are classified. Do not replay
  all existing failed jobs automatically.
- Keep the scheduled AI worker as recovery until event-driven production evidence is
  stable.

Exit gate: a newly stored text/image/PDF/audio document begins extraction without
waiting for a scheduled GitHub run and still appears as draft or needs-review, never as
automatically approved accounting truth.

#### WA-LAT-4: Provider Bounds And Backoff

Status (2026-09-12): implemented and verified locally; production migration and provider
canaries remain pending. Meta send, media lookup, error-body read, and media download now
share an abortable bounded request lifecycle. Provider errors are size-bounded and stored
as sanitized status/code summaries. Meta and OpenAI transient failures use a capped
exponential delay with jitter and `Retry-After`; invalid configuration, malformed requests,
unsupported media, and exhausted attempts remain terminal. Retryable WhatsApp events and
AI jobs are explicitly returned to `queued` with a future `scheduled_at`; migration
`20260912200000` prevents terminal WhatsApp failures from being claimed automatically.
Outbound Meta message IDs are retained in the existing acknowledgment correlation column.
Focused provider/recovery tests and the complete local release verifier pass with zero
known production dependency vulnerabilities. No migration, deployment, provider call, or
live retry was performed in this step.

- Add abortable deadlines to WhatsApp send, media metadata, and media download requests.
- Bound provider error-body capture and redact credentials and customer content.
- Classify timeout, connection, `429`, and provider `5xx` failures as retryable with
  exponential backoff and jitter. Treat invalid credentials, unsupported media, and
  malformed requests as terminal/manual failures.
- Respect existing media byte/type limits and AI provider execution bounds.
- Persist outbound provider message IDs when Meta returns them so delivery attempts can
  be correlated without storing additional message content.

Exit gate: a stalled provider cannot hold a worker indefinitely, retryable failures are
rescheduled deliberately, and permanent failures remain visible to Operations.

#### WA-LAT-5: Bounded Concurrency And Ordering

Status (2026-09-12): implemented and verified locally; hosted migrations, deployment,
and production concurrency canaries remain pending. A reusable keyed worker pool now runs
at most three independent WhatsApp sender streams and two independent AI client streams,
while processing each sender/client stream sequentially and returning results in original
claim order. The webhook's exact new-job wake-up uses the same two-wide client grouping.
Migration `20260912210000` adds service-only durable ordering leases at the existing
skip-locked claim boundaries, preventing overlapping serverless invocations from claiming
different work for one normalized sender or firm/client. Status-transition triggers release
leases, and abandoned leases can be recovered after the existing ten-minute stale bound.
Focused scheduler and PostgreSQL tests prove concurrency caps, same-key ordering,
independent progress, exact-claim blocking, release, stale-compatible ownership, and browser
denial. Existing retries, idempotency, media/provider bounds, and review-first output remain
unchanged. No migration, deployment, provider request, or live data mutation occurred.

- Replace fully serial batch execution with small bounded concurrency only after the
  event-driven single-message path is stable.
- Preserve ordering for messages from the same sender/client while allowing independent
  clients to progress concurrently.
- Start conservatively at three ingestion/media tasks and two AI tasks per invocation;
  tune only from measured provider limits, memory, and production latency.
- Continue using database skip-locked claims so overlapping invocations cannot own the
  same event or job.

Exit gate: one large media item does not block unrelated clients, and duplicate,
ordering, lease, memory, and provider-rate tests pass.

#### WA-LAT-6: Recovery Scheduling And Operations

- Move the authoritative recovery sweep to a platform with verified minute-level
  execution, or retain the external scheduler only after proving its actual cadence.
- Recovery remains a safety net rather than the normal user-facing path.
- Surface oldest queued age, claim delay, acknowledgment delay, stale leases, retry
  counts, terminal failures, and last successful worker execution in readiness and the
  Operations view.
- Alert when the oldest inbound event exceeds one minute, no worker completes for five
  minutes, or failure/dead-letter counts rise.
- Retain raw webhook events and original documents; cleanup may only target explicitly
  defined operational metadata retention, never financial source records.

Exit gate: event-driven delivery remains within target during normal operation and a
deliberately suppressed wake-up is recovered by the sweep within its documented bound.

Implementation status (2026-09-12): protected recovery routes record service-only run
heartbeats and expose aggregate health through readiness and Operations. Production evidence
showed the external GitHub schedule has multi-hour gaps, so migrations `20260912230000` and
`20260912240000` move authoritative recovery to one-minute Supabase Cron jobs. A locked-down
database dispatcher reads only named Vault configuration and asynchronously calls the two
existing bearer-protected routes through `pg_net`; it cannot target arbitrary URLs or expose
the secret to browser roles. GitHub remains temporary fallback until hosted cadence and the
suppressed-wake-up canary pass. The exit gate remains open until that evidence is collected.

### Verification And Rollout

1. Run focused webhook/worker tests, security-boundary tests, lint, typecheck, and build.
2. Deploy with immediate wake-up behind a server-only environment flag, default off.
3. Send one controlled matched help message and verify one response and timing fields.
4. Send controlled matched text, image, PDF, and audio samples and verify private source
   retention, one extraction job, one reviewable transaction, and no auto-approval.
5. Replay the same provider message IDs and verify all side effects remain singular.
6. Exercise WhatsApp timeout, `429`, `5xx`, invalid media, OpenAI failure, and worker
   interruption paths without exposing secrets or customer data.
7. Enable the flag for production after the controlled canary passes. Because a separate
   staging Supabase project was declined, do not describe this as capacity certification;
   use only low-volume owner-controlled production probes and reconcile every test row.
8. Keep scheduled recovery enabled through an observation window, then remove redundant
   GitHub user-facing scheduling only after wake-up and recovery metrics are proven.

Rollback: disable immediate wake-up and restore the previous scheduler-driven path.
Never roll back by deleting queued events, source media, extraction history, transactions,
or audit records.

## Phase 12B: Dashboard UI Refinement

Refine the existing CA operations console without redesigning it or changing its
Supabase, authorization, accounting, or audit boundaries.

### Delivery Sequence

1. Semantic accuracy: configuration presence, missing values, page-scoped ledger
   totals, operational empty states, and GST preparation boundaries. Completed
   locally on 2026-09-12.
2. Workflow improvements: conditional export fields, explicit queue actions,
   Operations failure navigation, and custom GST period clarity. Completed
   locally on 2026-09-12.
3. Shared component corrections: pagination, pluralization, date formatting,
   accessible row actions, empty-state density, mobile control targets, and
   documented card radius. Completed locally on 2026-09-12.
4. Navigation and shell: keyboard tooltips, stable sidebar controls, scroll
   containment, roadmap placement, and mobile-menu focus behavior. Completed
   locally on 2026-09-12; authenticated viewport verification remains in step 6.
5. Page refinement: concise headers, neutral zero states, clearer work links,
   client count scope, ledger dates, and Platform roadmap density. Completed
   locally on 2026-09-12.
6. Authenticated responsive and accessibility verification across mobile, tablet,
   desktop, keyboard-only, and 200% zoom scenarios. The read-only Playwright
   harness and six-viewport public baseline are complete locally; the authenticated
   run remains blocked by missing `LIVE_DASHBOARD_EMAIL` and
   `LIVE_DASHBOARD_PASSWORD`.

Run the remaining gate with an authorized test account:

```powershell
$env:LIVE_DASHBOARD_BASE_URL='http://127.0.0.1:3000'
$env:LIVE_DASHBOARD_EMAIL='<authorized-test-user>'
$env:LIVE_DASHBOARD_PASSWORD='<test-password>'
npm.cmd run verify:dashboard-responsive
```

The harness performs read-only navigation and stores potentially sensitive
screenshots only under ignored `.codex-tmp/dashboard-accessibility/` by default.

Exit gate: dashboard language describes only verified state, repeated workflows are
efficient, and authenticated viewport checks pass without changing financial or
tenant-isolation behavior.

## Phase 13: Long-Term Platform Extensions

- Direct GST integration through approved provider.
- GSTR comparison workflows.
- Bank statement reconciliation.
- WhatsApp reminders and clarification loops.
- Tally/Zoho/QuickBooks sync.
- Billing and subscriptions.
- Staff analytics.
- Multi-firm admin console.

## Recommended Build Order For AI Agents

1. Read `docs/rules.md`.
2. Read `docs/PRD.md`.
3. Read `docs/TRD.md`.
4. Read `docs/Backend-Schema.md`.
5. Build one phase at a time.
6. Update `docs/Tracker.md` after every meaningful change.
7. Do not skip auditability, firm isolation, or review states.

UI/UX remediation update (2026-09-13): R06A-R06B original evidence and GST provenance is locally verified. Review detail now signs supported private `whatsapp-media-raw` evidence after firm-scoped transaction access and renders image/PDF/text/audio previews or precise fallbacks beside extracted text. GST period detail now separates saved generated totals from live current-period transaction rows and current blockers without changing accounting calculations or source-query semantics. Hosted closure still needs isolated storage/GST fixtures.
UI/UX remediation update (2026-09-13): R07A responsive containment source/build fixes are verified. Review Queue filter density now starts at `2xl`, GST detail table sections have shrink containment before horizontal scrolling, shared `DataTable` regions are max-width constrained, and the mobile sign-out control has a 44px minimum width. Full authenticated browser width verification remains gated on isolated fixtures.

UI/UX remediation update (2026-09-13): Added the isolated browser-matrix verification runner for public landing/auth routes and authenticated dashboard routes. `npm.cmd run verify:ui-ux-browser-matrix` records sanitized viewport measurements, blocked reasons and redacted console entries under the isolated evidence directory; authenticated routes require a disposable Playwright storage state and fixture IDs, and the runner does not consume live credentials.

UI/UX remediation update (2026-09-13): Browser-matrix follow-up fixed remaining public mobile touch targets caught by the new runner. Landing mobile navigation/footer links, auth logo/back links and the login forgot-password link now meet the 44px mobile target while retaining compact desktop density. Local `verify:ui-ux-browser-matrix` passed public `/`, `/login`, `/signup`, `/forgot-password` and `/reset-password` at 390px and 1440px with zero failures; 105 authenticated dashboard route/viewport checks are correctly recorded as blocked until an isolated storage state and fixture IDs exist.

UI/UX remediation update (2026-09-13): Added `npm.cmd run create:ui-ux-auth-state` to capture a Playwright storage state only for a disposable local/staging account. The helper requires `KHATAONE_UI_UX_ISOLATED_AUTH=1`, writes to ignored `.codex-tmp/` by default, refuses ambiguous non-isolated hosts unless explicitly allowed, stores sanitized metadata beside the state file, and keeps live dashboard credential variables out of the UI/UX browser-matrix path.
