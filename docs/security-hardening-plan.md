# Security And Latency Remediation

## Release Boundary

2026-09-12: implementation began after the read-only audit. Live remains commit
`c62e3ef`, deployment `dpl_jkyuKGWc8XiDEyELvAcdefJzsMF9`, with hnd1 functions.
The working tree also contains earlier unreleased performance/recovery changes.
Do not deploy the working tree as an undifferentiated release.

## Phase Status

1. Scope confirmation: source/deployment baseline verified. Live database policies,
   grants, storage configuration and migration state remain unverified. Management
   token/direct database access was not available in the audit environment. Existing
   real-account navigation evidence is not a substitute for two-firm security tests.
2. Immediate security: application guards and dependency fixes implemented locally;
   database restrictions on privileged input fields are prepared and tested in isolated
   PostgreSQL; deployed-policy verification and Supabase staging integration remain pending.
3. Financial integrity: GST summary, ledger correction, approval/review/clarification,
   dashboard audit writers, and direct financial/input write restrictions are prepared
   and tested locally. Live preflights and Supabase staging remain pending. Posted
   records stay immutable; a future reversal model is not implemented.
4. Background processing: AI stale-lease recovery, bounded claims/media/provider
   execution, and a protected five-minute external scheduler are prepared and tested
   locally. Existing failed-job diagnosis and hosted provider/storage/scheduler
   verification remain pending. Automatic failed-job retries stay disabled until
   transient/permanent classification and backoff are designed.
5. Protection/visibility: atomic shared-store rate enforcement and protected deep
   readiness are prepared and tested locally. Migration, production secrets, cross-instance
   staging verification, and any declared external platform/edge enforcement remain release gates.
6. Performance: capacity harness hardened locally; actual independent-network and
   isolated-staging execution remains pending. Single-account samples and static
   harness checks do not establish p95 or target-scale readiness.
7. Release: pending reviewed isolated commits, staged migration verification,
   regression gates and reversible deployment. No deployment in this pass.

The owner declined a separate staging Supabase project. Capacity execution is therefore
waived for the current local release review and remains explicitly unverified; it is not
recorded as a passing performance gate. Continue with local release checks, but retain
target-scale latency/capacity and hosted tenant/migration behavior as accepted release risk.

`npm run verify:release-local` now provides one repeatable local gate. It passed migration/
application coupling, repository hygiene, all Phase 1-3 and capacity-safety checks, isolated
PostgreSQL financial and policy suites, worker recovery and execution bounds, protection,
dashboard regression tests, dependency audit, lint, TypeScript, and the production build.
The production dependency audit reported zero known vulnerabilities. This result does not
replace hosted Supabase migration, provider, tenant-isolation, or capacity evidence.

## Immediate Local Changes

- Next.js and eslint-config-next pinned to 16.3.5. Lockfile resolves Sharp 0.35.4
  and js-yaml 4.3.2. Existing unrelated package changes were preserved.
- Direct extraction POST rejects missing configuration with 503 and invalid or
  absent credentials with 401. Authenticated calls require a UUID document ID.
- Clarification actions require owner/admin/staff before outbound messaging.
- Export download validates the firm/export/file path before service-role storage
  access, rejects traversal/header-unsafe names, hides storage errors and returns
  private/no-store file responses. Existing generated CSV/PDF names are supported.
- Both batch and manual workers pass firm/client ownership to processors. Processors
  scope entity lookup by firm and reject mismatched clients before provider, document,
  export or financial side effects. Rejected extraction jobs can be marked failed,
  restricted to the claimed job ID; the target document is not modified.
- These guards do not replace database integrity constraints. The direct extraction
  endpoint is an explicitly secret-authorized global operator endpoint, not a tenant API.

## Verification

- `npm run verify`: lint, TypeScript and production build passed on Next.js 16.3.5.
- `npm run test:security-boundaries`: synthetic/mocked checks passed for missing/wrong
  secrets, malformed input, denied viewer side effects, permitted reviewer roles,
  foreign/traversal export paths, legitimate CSV/PDF paths, rejected entity ownership,
  and ownership propagation through batch/manual workers.
- Existing phase 1/2 hardening checks passed.
- `npm audit --json`: zero reported vulnerabilities in the local resolved tree.
  This is not proof that all application vulnerabilities are resolved.
- No real outbound messages, financial mutations, account creation, database
  migrations, GitHub push or production deployment were performed.

## Next Gate

### Atomic Ledger Correction Slice

`20260912120000_atomic_ledger_correction.sql` and the ledger action replace the
read/update/audit sequence with one RPC. The database verifies active reviewer role,
firm/client/source ownership, locks the ledger row, validates finite nonnegative
amounts (including after numeric rounding), and commits the edit and before/after
audit together. Source transaction fields are not changed. Browser ledger writes
are restricted; existing read policies and SECURITY DEFINER approval remain supported.

`node scripts/test-ledger-correction-atomic.mjs` exercises real isolated PostgreSQL
policies/functions: correction, audit-failure rollback, foreign-firm/viewer/revoked/
anonymous denial, invalid amounts, inconsistent source ownership, denied direct writes
and initial approval compatibility. Mocked action tests cover scoped RPC, role/amount
checks and error privacy. No hosted Supabase or concurrent-session guarantee is implied.

Full lint/typecheck/production build passed after this slice, along with the ledger,
GST, worker-input PostgreSQL suites and application security-boundary tests.

Run `scripts/preflight-ledger-correction.sql` read-only before staging. Coordinate
the migration and action release: the old action cannot write after the restriction;
the new action cannot work before the RPC exists. Do not reopen direct writes as an
automatic rollback. No migration or production financial mutation was performed.

Still open: editing/rejecting approved transactions can leave stale handoffs;
transaction edits and general audit-log permissions need separate hardening. This
slice does not make Phase 3 complete or certify navigation latency. Resolve these
before production release.

### Idempotent Transaction Approval Slice

`20260912130000_preserve_ledger_corrections_on_reapproval.sql` replaces the approval
function without changing its call contract. A repeated approval now returns the
existing handoff unchanged, preserving manual ledger corrections. An approved legacy
transaction missing its handoff can create exactly one handoff and records a distinct
repair audit. First approval remains a locked transaction/ledger/audit operation.

The isolated PostgreSQL suite verifies correction preservation, one approval audit,
audited missing-handoff repair, role isolation, and rollback of first approval and
repair when audit insertion fails. The migration is backward-compatible with the
current action but remains unapplied. Approved-transaction edit/reject/duplicate
lifecycle behavior is the next financial-integrity decision and remains unresolved.

### Posted Transaction Lifecycle Guard

The current schema has no accounting reversal or void entity. To avoid inventing one,
`20260912140000_protect_posted_transaction_lifecycle.sql` makes approved/exported
transactions immutable to authenticated browser roles. The review actions repeat this
check before database or WhatsApp side effects, and the detail page presents posted
records as read-only without edit/reject/duplicate/clarification controls. Draft and
needs-review behavior is unchanged; repeated approval still returns the handoff safely.

This is an interim integrity boundary, not a reversal implementation. Service-role and
SECURITY DEFINER workflows are intentionally outside the browser trigger and must retain
their own authorization/audit rules. Tests verify denied posted mutation, allowed review
edit, no posted clarification send, and approval compatibility. The migration is
unapplied; run the expanded ledger preflight before staging. Atomic transaction edit/
decision audits, direct non-posted write restrictions and a future reversal workflow
remain pending, so Phase 3 is not complete.

### Atomic Transaction Review Slice

`20260912150000_atomic_transaction_review_mutations.sql` adds two scoped functions
without changing the forms or routes. `update_transaction_review` commits field edits
and their before/after audit together. `decide_transaction_review` atomically rejects
or duplicate-marks a transaction and treats a repeated identical decision as a no-op.
Both functions lock the row and revalidate actor role, firm/client ownership, posted
status, transaction type, date, and finite numeric inputs inside PostgreSQL.

The review actions now call these functions and return generic database errors. Isolated
PostgreSQL tests passed for edit/decision success, tenant and role denial, posted-record
denial, invalid status/numeric inputs, repeated decisions, and audit-failure rollback.
Mocked action tests verify scoped arguments and private errors. Run
`scripts/preflight-transaction-review.sql` before staging; no migration was applied.

At this slice boundary, clarification and direct transaction writes were the next
implementation target. Direct audit-log permissions and a dedicated reversal model
remain separate boundaries after the clarification work below.

### Controlled Clarification And Transaction Writes

`20260912160000_control_transaction_clarification_and_writes.sql` records and authorizes
the clarification request before any WhatsApp call, returns a linked request audit ID,
and exposes a second function for delivery success/failure audit. The action requires a
nonempty bounded note, sends only after the first transaction commits, records delivery,
and reports outbound failure without undoing the valid needs-review transition. If the
delivery-audit call fails after an external send, operational logging captures the gap;
no database transaction can make an external provider call atomic.

With all browser transaction mutation paths now using controlled functions, restrictive
INSERT/UPDATE/DELETE policies deny direct authenticated/anonymous writes. Service-role AI
processing and SECURITY DEFINER review workflows remain operational. Isolated PostgreSQL
tests cover request/delivery linking, invalid/posted/foreign requests, audit rollback,
direct-write denial, and service-role compatibility. The application security test also
confirms posted records cause no database or WhatsApp side effect.

The migration is local and unapplied. At this boundary, other browser audit actions
still needed conversion; the following slice closes them. Reversal design and Supabase
staging validation remain separate pending work.

### Controlled Dashboard Audit Writers

`20260912170000_control_dashboard_audit_writers.sql` moves the remaining browser audit
callers behind purpose-built functions. Client create/update/archive now derive their
before/after audits inside the mutation transaction. Export enqueue creates the export,
generation job and audit atomically, eliminating the action's compensation path. Manual
AI/export job requests validate the queued/failed job and target ownership before writing
the request audit, then return the verified job to the service worker caller.

Restrictive policies deny authenticated/anonymous direct writes to clients, exports,
processing jobs and audit logs. Existing service-role workers and SECURITY DEFINER
functions remain supported. `node scripts/test-controlled-audit-writers.mjs` passed in
isolated PostgreSQL for two-firm roles, ownership, idempotent archive, atomic rollback,
direct-write denial, export/job creation, manual-run validation and service-role access.
The application build and existing security suite also pass.

Run `scripts/preflight-controlled-audit-writers.sql` read-only and investigate nonzero
counts before staging. This migration must ship with the client/export/operations action
changes and all prior prepared function migrations; applying only the restrictions will
break existing dashboard writes. No production migration, push or deployment occurred.
With this slice, local Phase 3 implementation boundaries are complete under the chosen
posted-record immutability policy; hosted staging verification remains the completion gate.

### Phase 4: AI Job Lease Recovery

`20260912180000_recover_ai_extraction_jobs.sql` aligns AI claim behavior with the
existing export worker. Batch claims include due queued jobs and processing leases
abandoned for ten minutes, remain capped at 20 rows and three attempts, and use locked
row skipping. Stale processing jobs already at the retry limit become terminal failed
instead of remaining permanently active. Manual claims can also recover a stale lease.

`node scripts/test-ai-job-recovery.mjs` passed in isolated PostgreSQL for queued claims,
failed-job isolation, stale locked and lockless recovery, fresh-worker isolation, future schedule
isolation, wrong job-type isolation, terminal exhaustion and manual reclaim. Run
`scripts/preflight-ai-job-recovery.sql` read-only before staging. This migration is
backward-compatible with the existing worker RPC arguments and remains unapplied.

Failed jobs remain manual until transient/permanent failure classification and retry
backoff are implemented. Existing production failed jobs must be diagnosed before enabling
broader retry. No live job was claimed or modified.

The bounded-execution slice now streams private media through a byte-limited reader,
rejects unsupported MIME types before storage I/O, cancels downloads as soon as the
configured limit is exceeded, and aborts storage requests after 15 seconds by default.
The shared OpenAI client now uses a 45-second per-request timeout and one SDK retry by
default. Optional `MEDIA_DOWNLOAD_TIMEOUT_MS`, `OPENAI_REQUEST_TIMEOUT_MS`, and
`OPENAI_MAX_RETRIES` overrides are clamped to conservative ranges. Existing image/PDF
and audio byte-limit variables remain unchanged.

`node scripts/test-ai-execution-bounds.mjs` verifies stream assembly, early cancellation,
pre-download media validation, and provider bound wiring. `npm run typecheck` also covers
the Supabase streaming API contract. Provider calls and private storage were not exercised;
that remains a staging verification gate, and no production configuration was changed.

Because the Vercel Hobby cron remains daily, the existing protected external-scheduler
pattern is reused in `.github/workflows/ai-extraction-scheduler.yml` to request a bounded
batch every five minutes. It uses the existing repository `CRON_SECRET`, serializes runs,
and has a five-minute workflow timeout. It will not run until committed to GitHub; after
release, a controlled queued document and Actions history must verify invocation and cost.

### Phase 5: Shared Protection And Readiness

`20260912190000_add_shared_rate_limits.sql` adds an infrastructure-owned fixed-window
counter and service-role-only `consume_rate_limit` function. Browser roles have no table
or function access. Application keys are HMAC-SHA-256 digests using a dedicated secret
before leaving the server, count
updates are atomic, limits/windows are bounded, and expired counters are removed in small
locked batches. The existing process-local limiter remains the first guard.

When `RATE_LIMIT_SHARED_ENFORCEMENT=shared-store`, every existing sensitive limiter uses
the shared function and returns a generic `503` if it cannot enforce the limit. Setting
`RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT=true` without a shared-store or independently
verified `platform`/`edge` declaration also fails closed. Do not enable shared-store mode
before the migration is applied or before a random 32-character-or-longer
`RATE_LIMIT_KEY_SECRET` is configured. Run `scripts/preflight-shared-rate-limits.sql` first.

Production `/api/health` and `/api/health/ready` now require
`Authorization: Bearer <READINESS_CHECK_SECRET>`, require at least 32 characters, use
timing-safe comparison, and return
private/no-store responses. `/api/health/live` remains public and database-free. Deep
readiness checks the selected shared table directly, while authenticated Settings shows
whether the shared mode and readiness credential are configured without exposing values.

`node scripts/test-shared-rate-limits.mjs` passed against isolated PostgreSQL for counting,
key isolation, rollover, validation, bounded expiry cleanup, and browser denial.
`node scripts/test-protection-readiness.mjs` passed for hashed adapter calls, local/shared
modes, fail-closed requirements, readiness authentication, route denial, and smoke-header
wiring. No migration, environment change, push, deployment, or production request occurred.

### Phase 6: Capacity Validation Harness

The existing Phase 3 k6 scaffold was hardened before any load execution. It now denies
the production hostname, requires an exact expected staging hostname, rejects dashboard
redirects instead of treating the login page as success, and has route-specific p95/p99
plus dropped-iteration gates. Worker/provider traffic is disabled by default and requires
separate explicit provider-cost authorization.

Evidence preparation now records baseline and post-run reconciliation paths. Reconciliation
requires an exact staging Supabase hostname, paginates deterministically, and fails at a configured safety ceiling instead of silently
accepting PostgREST truncation, and reports job type/status, audit action, export, document,
extraction, transaction and duplicate ledger-handoff state. The workload manifest clearly
separates measured dashboard/optional-worker gates from unmeasured webhook, approval,
end-to-end extraction, export, message-loss and cross-tenant release gates.

No load was executed. Native `k6` 2.2.0 now parses the workload and passes the synthetic
preflight, but an isolated staging hostname/database and controlled staging session are
not currently available. Production was not targeted. This phase prepares
trustworthy capacity evidence; it does not claim target-scale readiness.

Vercel inspection found that the Supabase URL, anonymous key, and service-role key are
single secret bindings scoped jointly to Preview and Production. A Preview deployment
therefore does not provide database isolation and must not be capacity tested. Create a
separate staging Supabase project and replace those three values for the Vercel Preview
scope before generating a controlled staging session or running reconciliation/load.

### Atomic GST Summary Slice

`20260912110000_atomic_gst_summary.sql` replaces row transfer with a scoped SQL
aggregate and writes the period, summary and before/after audit in one transaction.
It verifies active owner/admin/staff membership and client ownership, serializes
regeneration on the client, and rejects inconsistent historical summary ownership.
Direct browser writes/deletes to GST period/summary tables are restricted; read
policies are unchanged. The action calls the RPC once and does not fall back to
the prior non-atomic flow if the migration is absent. Reports are invalidated too.

The migration preserves existing transaction-type mapping and mismatch/readiness
rules. It is not a review of GST law: zero-rated/exempt supplies, GSTIN correctness,
undated records, cess and broader reconciliation rules still need separate product
and accounting validation. Generated summaries remain snapshots, not live totals.

`node scripts/test-gst-summary-atomic.mjs` passed in isolated PGlite PostgreSQL:
1501 approved sales rows, input/output amounts, foreign-firm exclusion, role denial,
direct-write denial, empty/unresolved/missing-document states, regeneration, rejected
historical ownership, and rollback on audit failure. Action tests cover role/date
validation, RPC scoping and error privacy. This single-connection test does not
certify concurrent-worker behavior, hosted query plans or production latency.

Run `scripts/preflight-gst-summary.sql` read-only against the intended database and
resolve incompatible schema/ownership before rollout. This migration and action
require a coordinated release/maintenance window: the old action is rejected by
the new write policies, while the new action requires the RPC. Do not independently
deploy either side or silently reopen direct writes during rollback. No migration,
real summary regeneration, push or deployment has been performed.

### Prepared Database Boundary

`20260912100000_protect_worker_inputs.sql` adds restrictive policies and an invoker
trigger rather than relying on removal of a known permissive policy. It protects
document originals, export request/artifact fields and job ownership/state. It does
not modify existing rows or change service-role worker permissions. Export enqueue
failure compensation remains supported. Inactive form selectors are normalized by
the action to avoid stale selector values becoming unrelated ownership inputs.

`scripts/preflight-worker-input-policies.sql` is read-only: inspect live policies,
triggers, grants, bucket privacy and aggregate ownership mismatches. Nonzero mismatch
counts need investigation, not automatic deletion or reassignment. This migration
does not remediate already-tampered rows, broad transaction/audit writes or GST totals.

Verification passed using PGlite 0.5.8 in-memory PostgreSQL with the repository's
firm/ingestion/export/worker migrations and synthetic auth/client/period fixtures.
Tests exercise RLS and triggers with real SQL roles, not source-string checks. Docker
was unavailable and psql absent. This does not emulate Supabase Auth, PostgREST,
Storage, all production extensions, concurrent workers or legacy policy drift.

Reproduce without changing application dependencies:

```powershell
npm.cmd install --prefix .codex-tmp/db-policy-test --no-save --ignore-scripts @electric-sql/pglite@0.5.8
node scripts/test-worker-input-policies.mjs
npm.cmd run test:security-boundaries
```

The full lint/typecheck/build and existing phase 1/2 checks passed after the action
change. Migration application, GitHub push and deployment were not performed.

Deployment order: inspect preflight results; verify migration and current action in
authorized Supabase staging; deploy selector normalization before applying the database
restriction. Keep the restriction during application rollback when possible. Rolling
back to the old action can reject requests containing stale inactive selectors. Removing
the new policies/trigger reopens audited write paths and requires explicit review; never
reset the database or delete historical records as rollback.

Verify deployed policy/grant/migration metadata read-only, then use an explicitly
authorized non-production database and isolated actors for mutation/tenant tests.
Never run the existing RLS approval harness against real financial records or
relabel production as non-production. Prepare database restrictions only after
checking current action/worker write contracts and rollback compatibility.
