# KhataOne

KhataOne is a WhatsApp-first AI accounting and GST workflow platform for CA
firms serving Indian SMB clients.

Business owners send invoices, receipts, documents, and notes over WhatsApp.
KhataOne stores the raw source material, extracts accounting fields with AI,
routes uncertain records to CA review, creates ledger handoffs, prepares GST
summaries, and generates traceable exports.

## Current Scope

- Next.js App Router dashboard and landing page
- Supabase Auth, Postgres, Storage, and RLS-ready schema
- WhatsApp Cloud API webhook ingestion
- OpenAI structured extraction pipeline
- Review queue, ledger, GST summaries, reports, exports, audit logs, and
  operations views
- Production health endpoint, smoke runner, demo seed script, and runbooks
- Future integration scaffolding for GST providers, accounting sync, banking,
  billing, and analytics

Production v1 prepares GST summaries and exports. It does not submit GST
filings.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- WhatsApp Cloud API
- OpenAI API

## Setup

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Fill in the Supabase, WhatsApp, and OpenAI values. See
`docs/Environment-Mapping.md` and `docs/Production-Runbook.md`.

Run the app:

```bash
npm run dev -- -p 3001
```

Check health:

```txt
http://localhost:3001/api/health
```

## Verification

```bash
npm run verify
npm run smoke:local
```

## Supabase

Apply migrations from `supabase/migrations/` in chronological order.

After migrations and at least one Supabase Auth user exist, demo data can be
seeded with:

```bash
npm run seed:demo
```

## Documentation

Important project docs live in `docs/`:

- `Implementation-Plan.md`
- `Backend-Schema.md`
- `Production-Runbook.md`
- `Production-Smoke-Test-Checklist.md`
- `RLS-Verification-Plan.md`
- `Platform-Extensions-Roadmap.md`

## Security

Do not commit `.env.local` or old credential files. The repo intentionally
tracks `.env.example` only.
