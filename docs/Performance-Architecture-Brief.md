# KhataOne Performance Architecture Brief

Use this brief to ask for an independent performance diagnosis of KhataOne.

## Product Context

KhataOne is a WhatsApp-first accounting and GST preparation platform for Indian CA firms. SMB clients send invoices, receipts, payment proofs, text notes, documents, and audio through WhatsApp. The CA firm works in a protected web dashboard to review AI-extracted data, approve transactions, manage ledger handoff, generate GST summaries, export reports, and audit activity.

Important product constraints:

- The CA dashboard is the professional control layer.
- WhatsApp is the SMB input layer.
- AI extraction creates draft/reviewable records, not final accounting truth.
- GST filing/submission is not live in v1; the app prepares summaries and exports.
- Every firm-owned record must be tenant-isolated by `firm_id`.
- Supabase RLS is part of the data security model.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase RLS
- WhatsApp Cloud API
- OpenAI structured extraction with rule-based fallback
- Vercel deployment

## High-Level Runtime Architecture

1. Public routes render landing, legal, contact, login, signup, reset-password, and related pages.
2. Protected dashboard routes use Supabase Auth through middleware and server-side Supabase helpers.
3. `getFirmContext()` resolves the authenticated user, active firm membership, firm role, and a Supabase server client.
4. Dashboard pages query Supabase Postgres directly from Next.js Server Components.
5. Mutations use Next.js Server Actions or route handlers.
6. WhatsApp webhooks write raw inbound events, then background workers process matching, media, documents, and extraction jobs.
7. AI extraction stores raw and normalized outputs, then creates draft transactions.
8. CA approval creates ledger handoff entries.
9. GST summaries aggregate approved transactions only.
10. Exports generate CSV/PDF files into private Supabase Storage and are downloaded through guarded routes.

## Main Workflow

### 1. Auth And Firm Workspace

- User signs up or logs in through Supabase Auth.
- If authenticated user has no active firm membership, they go to onboarding.
- Firm workspace is stored in `firms`.
- User membership and role are stored in `firm_users`.
- Dashboard layout displays firm name and role.

Performance-sensitive path:

- Protected route request enters middleware.
- Dashboard layout calls `getFirmContext()`.
- Page also calls `getFirmContext()`, now request-cached with React `cache()`.

### 2. Client Management

- CA creates clients with GSTIN, phone, WhatsApp phone, state, filing frequency, and status.
- Client routes list, filter, view, edit, and archive clients.
- Client actions write audit logs.

Core table:

- `clients`

Performance-sensitive routes:

- `/dashboard/clients`
- `/dashboard/clients/[clientId]`
- `/dashboard/clients/[clientId]/edit`

### 3. WhatsApp Ingestion

- Meta calls `GET /api/webhooks/whatsapp` for verification.
- Meta sends signed `POST /api/webhooks/whatsapp` payloads.
- Webhook verifies signature, stores durable raw event, and returns quickly.
- Worker later processes event:
  - stores/updates `whatsapp_messages`
  - matches sender phone to client
  - downloads media when needed
  - stores documents
  - creates processing jobs
  - sends safe acknowledgments/help responses where applicable

Core tables:

- `whatsapp_webhook_events`
- `whatsapp_messages`
- `documents`
- `processing_jobs`

Performance-sensitive routes:

- `/api/webhooks/whatsapp`
- `/api/jobs/whatsapp-ingestion/run-queued`
- `/dashboard/inbox`
- `/dashboard/operations`

### 4. AI Extraction

- Processing job picks up documents.
- OpenAI provider or rule-based fallback extracts structured accounting fields.
- Raw output and normalized output are stored.
- Low confidence or incomplete outputs are marked for review.
- Draft transactions are created.

Core tables:

- `documents`
- `ai_extractions`
- `transactions`
- `processing_jobs`

Performance-sensitive routes:

- `/api/jobs/ai-extraction`
- `/api/jobs/ai-extraction/run-queued`
- `/dashboard/review-queue`
- `/dashboard/operations`

### 5. Review Queue

- CA reviews draft, needs-review, and duplicate transactions.
- Review queue supports filters by client, status, risk, document type, date, and search.
- CA can approve, reject, mark duplicate, edit, or request clarification.
- Approval creates ledger handoff entry.
- Review actions write audit logs.

Core tables:

- `transactions`
- `ai_extractions`
- `documents`
- `ledger_entries`
- `audit_logs`

Performance-sensitive routes:

- `/dashboard/review-queue`
- `/dashboard/review-queue/[transactionId]`

### 6. Ledger

- Approved transactions create ledger handoff records.
- CA can filter ledger entries by client, date, and account.
- Corrections update ledger handoff only; source transaction and AI output remain intact.
- Corrections write audit logs.

Core tables:

- `ledger_entries`
- `transactions`
- `clients`
- `audit_logs`

Performance-sensitive routes:

- `/dashboard/ledger`
- `/dashboard/ledger/[entryId]`
- `/dashboard/ledger/[entryId]/edit`

### 7. GST Summary

- GST summaries are generated from approved transactions.
- Readiness shows missing documents, mismatches, invalid GST fields, and review blockers.
- The app prepares export-ready data only; it does not file GST directly.

Core tables:

- `gst_periods`
- `gst_summaries`
- `transactions`
- `clients`
- `audit_logs`

Performance-sensitive routes:

- `/dashboard/gst-summary`
- `/dashboard/gst-summary/[periodId]`

### 8. Reports And Exports

- Reports summarize clients, GST periods, export readiness, and recent exports.
- Export actions generate CSV/PDF files.
- Files are stored in private Supabase Storage.
- Download route checks active firm membership and firm ownership.

Core tables:

- `exports`
- `gst_periods`
- `gst_summaries`
- `transactions`
- `clients`

Performance-sensitive routes:

- `/dashboard/reports`
- `/dashboard/exports`
- `/api/exports/[exportId]/download`

### 9. Audit And Operations

- Audit logs record client changes, review decisions, ledger corrections, GST generation, exports, and other sensitive actions.
- Operations page shows processing job health and queue/failure counts.

Core tables:

- `audit_logs`
- `processing_jobs`

Performance-sensitive routes:

- `/dashboard/audit-logs`
- `/dashboard/operations`

## Current Dashboard Data Access Pattern

Most dashboard pages are dynamic Server Components:

- `export const dynamic = "force-dynamic"`
- They read authenticated cookies/session.
- They query Supabase Postgres from the server.
- They render dense tables and operational cards.

Current shared auth/firm helper:

- `src/lib/firms.ts`
- `getFirmContext()` is wrapped in React `cache()` so duplicate calls inside one request reuse the result.
- It calls Supabase Auth `getUser()`.
- It looks up active membership in `firm_users`.
- It returns `firm`, `user`, `userId`, and `supabase`.

Current middleware:

- `middleware.ts`
- Only matches:
  - `/dashboard/:path*`
  - `/onboarding/:path*`
  - `/login`
  - `/signup`
- This avoids unnecessary Supabase auth work on public pages and API routes.

## Recent Performance Fixes Already Implemented

### Pass 1

- Cached `getFirmContext()` per server render request.
- Removed duplicate page-level Supabase client creation in dashboard pages.
- Parallelized independent page reads with `Promise.all()`.
- Pushed status filters into Supabase queries on hot pages.
- Added dashboard `loading.tsx` skeleton for instant loading feedback.
- Added composite tenant-scoped Supabase index migration.

### Pass 2

- Added shared `PaginationControls`.
- Changed hot list pages to fetch only visible page plus one lookahead row.
- Applied bounded pagination to:
  - `/dashboard/clients`
  - `/dashboard/inbox`
  - `/dashboard/review-queue`
  - `/dashboard/ledger`

### Pass 3

- Narrowed middleware matcher to protected/auth routes only.
- Removed Supabase Auth middleware work from public pages and API endpoints.

### Pass 4

- Added live dashboard performance timing script:
  - `npm run perf:live-dashboard`
- Script uses normal live dashboard credentials through:
  - `LIVE_DASHBOARD_EMAIL`
  - `LIVE_DASHBOARD_PASSWORD`
  - optional `LIVE_DASHBOARD_BASE_URL`

## Supabase Performance Index Migration

Migration file:

- `supabase/migrations/20260909153000_add_dashboard_performance_indexes.sql`

Indexes added:

- `clients (firm_id, status, created_at desc)`
- `clients (firm_id, created_at desc)`
- `whatsapp_messages (firm_id, processing_status, received_at desc)`
- `whatsapp_messages (firm_id, received_at desc)`
- `transactions (firm_id, status, created_at desc)`
- `transactions (firm_id, client_id, status, created_at desc)`
- `ledger_entries (firm_id, entry_date desc, created_at desc)`
- `ledger_entries (firm_id, client_id, entry_date desc)`
- `gst_periods (firm_id, status, period_start desc)`
- `exports (firm_id, status, created_at desc)`
- `processing_jobs (firm_id, status, scheduled_at desc)`
- `audit_logs (firm_id, created_at desc)`

Pending:

- This migration must be applied to production Supabase for live dashboard performance to benefit fully.

## Observed Performance Symptom

User-observed issue:

- In local and production, moving between dashboard pages such as:
  - `/dashboard/clients`
  - `/dashboard/ledger`
  - `/dashboard/review-queue`
- feels slow and can take about 2-4 seconds before the next page/data is visible.

Likely causes before the recent fixes:

- Dynamic server-rendered pages block on Supabase auth and database queries.
- Dashboard layout and pages were repeating firm/auth work.
- Multiple dashboard pages had sequential independent queries.
- Hot tables were using unpaginated or broad list fetches.
- Production DB likely lacked composite indexes matching firm-scoped filters/orders.
- No route-level loading skeleton existed previously, so waits felt blank/heavy.

Remaining likely causes:

- Production Supabase index migration may not be applied yet.
- Authenticated live timings need to be measured with valid live credentials.
- Some dashboard pages still use fixed `.limit()` without full pagination:
  - audit logs
  - operations
  - exports
  - reports
  - GST summary
- Some filters/search still happen in memory after fetching a page.
- App Router Server Components still require server round trips for each dynamic navigation.
- The dashboard layout itself still needs firm context before rendering protected UI.
- Vercel region and Supabase region latency may add round-trip time if not colocated.

## Current Verification State

Recently passed locally:

- `npm.cmd run verify`
- `git diff --check`
- `SMOKE_BASE_URL=http://localhost:3000 npm.cmd run smoke:local`

Blocked/pending:

- Apply production Supabase migration.
- Run `npm run perf:live-dashboard` with valid live credentials.
- Compare before/after timings for Clients, Ledger, Review Queue, Inbox, GST Summary.

## Specific Diagnosis Questions For ChatGPT

Ask ChatGPT to diagnose:

1. Is the current Next.js App Router architecture appropriate for a Supabase-backed authenticated dashboard?
2. Which remaining dashboard pages should be paginated or split into smaller Suspense boundaries first?
3. Should firm context move out of the dashboard layout, or should the layout be redesigned to avoid blocking page transitions?
4. Should the app use route-level `loading.tsx`, nested route groups, or manual Suspense boundaries for better perceived performance?
5. Which Supabase indexes are still missing based on the dashboard queries?
6. Which filters should move from in-memory filtering to SQL/PostgREST filters?
7. Should some dashboard summary counts be denormalized or moved to RPC/database views?
8. Should the app introduce client-side data fetching/caching for dashboard routes, or stay server-rendered?
9. Are Vercel/Supabase regions likely a major source of the 2-4 second delay?
10. What measurement plan should be used before making more changes?

## Recommended External Diagnosis Prompt

You can paste this after the brief:

```text
Please act as a senior Next.js/Supabase performance architect. Review the KhataOne architecture and workflow above. The main production symptom is slow authenticated dashboard navigation, especially between /dashboard/clients, /dashboard/ledger, and /dashboard/review-queue, sometimes 2-4 seconds.

Give a final diagnosis of the most likely root causes, ranked by impact and confidence. Then propose a professional implementation plan that preserves tenant isolation, Supabase RLS, auditability, and CA-controlled accounting review. Separate quick wins from deeper architecture changes. Be specific about Next.js App Router, Supabase query/index design, server component streaming/loading, middleware/auth costs, region latency, and measurement strategy.
```
