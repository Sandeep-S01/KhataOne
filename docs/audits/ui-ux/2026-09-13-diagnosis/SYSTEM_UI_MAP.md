# System and UI map

Local checkout: main @ 59b903fa696622dc81e5cfb4df9d37042c46fc7d. CODE_INSPECTED unless explicitly marked otherwise. The full import/state/query inventory is included in evidence/source-inventory.json; all paths below are repository-relative.

## Runtime and boundaries

Next.js 16.3.5 App Router, React/React DOM 19.2.8, TypeScript 6.0.3, Tailwind 3.4.17; Node 26.5.1 in this audit, npm/package-lock.json. Supabase SSR 0.12.4 and JS 2.112.2, lucide-react 1.31.0, OpenAI 7.4.0, Zod 4.4.3, Playwright 1.63.0. Resolved package evidence is in evidence/versions.json. Internal React primitives, no installed Radix/shadcn component system and no replacement styling/state framework.

`src/app/layout.tsx` owns metadata, Google font variables and globals.css. Public landing is a Server Component with client navigation/lead form. Auth pages are Server Components wrapping client forms. There is no global client data store. Dashboard layout awaits request-cached getFirmContext, owns the persistent sidebar/topbar and #dashboard-content focus target. `middleware.ts` limits session work to protected/onboarding/login/signup routes; `src/lib/supabase/middleware.ts` handles cookies and transient failures. These are current source contracts, not independently certified hosted policy behavior.

`src/lib/firms.ts:getFirmContext` verifies getUser, then active firm_users membership, returns a firm-scoped Supabase client/context and role. React cache deduplicates within one render request, not across requests or middleware. Missing session goes to login; no active membership goes to onboarding; resolved infrastructure failures throw for recovery. Do not replace fresh role/firm verification with a global cache.

`src/app/(dashboard)/error.tsx` is above dashboard layout, so it can catch firm-loader errors; `dashboard/loading.tsx` is below layout and announces Preparing workspace. It is not proof that data or controls are ready. Detail pages invoke notFound for missing primary rows; no dedicated per-detail not-found screen was found. Public routes rely on framework fallback errors.

## Implemented screens

| Route | Boundary/state | Direct reads | Important components / imports | Existing states |
| --- | --- | --- | --- | --- |
| /forgot-password | Root; public/auth server page | Through action/component; no direct table read | brand-logo, password-reset-form | Component form/loading behavior |
| /login | Root; public/auth server page | Through action/component; no direct table read | auth-form, brand-logo | Component form/loading behavior |
| /reset-password | Root; public/auth server page | Through action/component; no direct table read | brand-logo, update-password-form | Component form/loading behavior |
| /signup | Root; public/auth server page | Through action/component; no direct table read | auth-form, brand-logo | Component form/loading behavior |
| /dashboard/audit-logs | Root → Dashboard layout; active membership; server page | audit_logs, audit_logs | design-system, status-chip | SetupRequired, QueryError, EmptyState |
| /dashboard/clients/new | Root → Dashboard layout; active membership; server page | Through action/component; no direct table read | client-form, design-system | Component form/loading behavior |
| /dashboard/clients | Root → Dashboard layout; active membership; server page | clients | design-system, status-chip | SetupRequired, QueryError, EmptyState, PaginationControls |
| /dashboard/clients/[clientId]/edit | Root → Dashboard layout; active membership; server page | clients | client-form, design-system | notFound(, SetupRequired |
| /dashboard/clients/[clientId] | Root → Dashboard layout; active membership; server page | clients, documents, transactions, transactions, gst_periods, audit_logs | design-system, status-chip | notFound(, SetupRequired, EmptyState |
| /dashboard/exports | Root → Dashboard layout; active membership; server page | clients, gst_periods, exports | export-form, design-system, status-chip | SetupRequired, QueryError, EmptyState |
| /dashboard/gst-summary | Root → Dashboard layout; active membership; server page | clients, gst_periods | gst-summary-form, design-system, status-chip | SetupRequired, QueryError, EmptyState |
| /dashboard/gst-summary/[periodId] | Root → Dashboard layout; active membership; server page | gst_periods, transactions, audit_logs | design-system, status-chip | notFound(, SetupRequired, EmptyState |
| /dashboard/inbox | Root → Dashboard layout; active membership; server page | whatsapp_messages | design-system, status-chip | SetupRequired, QueryError, EmptyState, PaginationControls |
| /dashboard/ledger | Root → Dashboard layout; active membership; server page | clients, ledger_entries | design-system | SetupRequired, QueryError, EmptyState, PaginationControls |
| /dashboard/ledger/[entryId]/edit | Root → Dashboard layout; active membership; server page | ledger_entries | ledger-entry-form, design-system | notFound(, SetupRequired |
| /dashboard/ledger/[entryId] | Root → Dashboard layout; active membership; server page | ledger_entries, audit_logs | design-system | notFound(, SetupRequired, EmptyState |
| /dashboard/operations | Root → Dashboard layout; active membership; server page | processing_jobs, processing_jobs, processing_jobs, processing_jobs, processing_jobs, processing_jobs | design-system, status-chip | SetupRequired, QueryError, EmptyState |
| /dashboard | Root → Dashboard layout; active membership; server page | transactions, gst_periods, gst_periods, whatsapp_messages, exports, exports, transactions | design-system, status-chip | SetupRequired, QueryError, EmptyState |
| /dashboard/platform | Root → Dashboard layout; active membership; server page | gst_integrations, external_integrations, integration_events | design-system, status-chip | SetupRequired |
| /dashboard/reports | Root → Dashboard layout; active membership; server page | gst_periods, transactions, transactions, exports | design-system, status-chip | SetupRequired, QueryError, EmptyState |
| /dashboard/review-queue | Root → Dashboard layout; active membership; server page | clients, transactions | status-chip, design-system | SetupRequired, QueryError, EmptyState, PaginationControls |
| /dashboard/review-queue/[transactionId] | Root → Dashboard layout; active membership; server page | transactions | transaction-review-form, design-system, status-chip | notFound(, SetupRequired |
| /dashboard/settings | Root → Dashboard layout; active membership; server page | firms, firm_users | design-system, status-chip | SetupRequired, EmptyState |
| /contact | Root; public/auth server page | Through action/component; no direct table read | lead-capture-form, public-page-shell | Component form/loading behavior |
| /onboarding | Root; verified user; no active firm | firm_users | brand-logo, design-system, firm-onboarding-form | SetupRequired |
| / | Root; public/auth server page | Through action/component; no direct table read | brand-logo, design-system, landing-navigation, lead-capture-form, status-chip | Component form/loading behavior |
| /privacy | Root; public/auth server page | Through action/component; no direct table read | public-page-shell | Component form/loading behavior |
| /terms | Root; public/auth server page | Through action/component; no direct table read | public-page-shell | Component form/loading behavior |

## Server-authoritative state versus browser state

| Owner | State and lifetime | Important consumers |
| --- | --- | --- |
| Supabase/RPC | membership, firm, client profile/status, raw inbound/document/extraction, transaction decisions, ledger, GST snapshot, export/job/audit | Every protected route; firm filters and RLS stay authoritative |
| URL searchParams | page, q, status, client, risk, document type, date, account, actor/entity/action | Clients/Inbox/Review/Ledger/Audit/Operations; exact supported keys differ by page |
| useActionState | field errors, message, pending; server result is authoritative | Auth, onboarding, ClientForm, review edit, ledger edit, GST, export, lead |
| Local React state | password visibility, public nav active section, selected export type | No accounting truth stored here |
| localStorage + useSyncExternalStore | sidebar collapse preference only | DashboardSidebar; request server snapshot expanded |
| Native dialog | mobile navigation open/focus lifecycle | DashboardMobileMenu; no business-data drawer |

## Action/API contracts to preserve

| UI trigger | Handler / dependency | Guard and data contract | Feedback/invalidation |
| --- | --- | --- | --- |
| Sign in/up/reset | src/app/actions/auth.ts; AuthForm/PasswordResetForm; UpdatePasswordForm browser SDK | Supabase Auth; create firm only after authenticated onboarding | useActionState or local status; redirects; reset success concern KO-UX-021 |
| Lead capture | actions/lead-request.ts; LeadCaptureForm | validated lead + honeypot/rate limits | field errors/live message; no accounting write |
| Client create/edit/archive | actions/clients.ts → create_dashboard_client/update_dashboard_client/archive_dashboard_client | owner/admin/staff; firm/client validation and atomic audit RPC | create/edit redirect detail; archive error gap KO-UX-007 |
| Save review | actions/review.ts → update_transaction_review | role, firm, posted guard; before/after audit | stateful field errors; same-detail redirect |
| Approve | actions/review.ts → approve_transaction_with_handoff RPC | atomic/idempotent ledger handoff, active reviewer, audit; preserve corrected handoff | revalidate review/ledger; bare Ledger redirect |
| Reject/duplicate | actions/review.ts → decide_transaction_review | posted guard, scoped mutation/audit; repeat decision no-op | plain form, queue redirect |
| Clarify | actions/review.ts; controlled request/delivery audit; WhatsApp client | role/posted check before provider call; request audited before send | provider delivery failure surfaced; no test messages sent |
| Correct handoff | actions/ledger.ts → correct_ledger_entry | scoped role, finite nonnegative amounts, before/after audit; source unchanged | form state, revalidation/redirect |
| Generate GST | actions/gst.ts → generate_gst_summary | approved transaction aggregate, client/period scope, atomic period/summary/audit | pending/errors, reports/GST invalidation; filing remains external |
| Queue export | actions/exports.ts → queue_dashboard_export | reviewer, active selector validation, atomic export/job/audit | queued message; worker completes later |
| Download export | api/exports/[exportId]/download/route.ts | verified membership/firm, completed artifact, validated firm/export/file path, private storage response | private no-store; no public bucket URLs |
| Run job | actions/operations.ts → request_manual_job_run + scoped worker | owner/admin/staff; allowed AI/export queued/failed jobs only | revalidate Operations and destination module; result feedback gap |

Backend worker/API route inventory (not interactive screens):

- `src/app/api/exports/[exportId]/download/route.ts`
- `src/app/api/health/live/route.ts`
- `src/app/api/health/ready/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/jobs/ai-extraction/route.ts`
- `src/app/api/jobs/ai-extraction/run-queued/route.ts`
- `src/app/api/jobs/exports/run-queued/route.ts`
- `src/app/api/jobs/whatsapp-ingestion/run-queued/route.ts`
- `src/app/api/webhooks/whatsapp/route.ts`

Webhooks, workers and deep readiness have separate signature/secret/session checks; a UI audit does not certify their security. No API jobs, downloads, webhook messages or paid provider actions were triggered.

## Feature and route gaps

Documented or reference-only: global search/command palette, notifications, help center, profile menu, firm switcher, staff assignment UI, direct original-media review, field-level confidence, audit metadata exploration, client document library, full split-pane queue. There are no dedicated corresponding routes in this checkout. Do not invent them as decorative controls. Platform page is implemented as explicit future/gated GST/sync/banking/billing/analytics information. It is not live filing or integration capability.

## Existing verification hooks

Seven dashboard test scripts were inspected and executed; evidence/checks.json records exits. Most are source assertions, with limited formatting execution. Existing responsive harness is read-only but its h1 readiness could match the loading heading; this audit’s standalone harness explicitly excludes aria-busy ancestors. Existing action/RLS/PostgreSQL security suites are retained, not all rerun for an audit-only change. Hosted one-account reads do not replace two-firm role/mutation tests.
