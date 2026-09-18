# KhataOne

KhataOne is a WhatsApp-first AI accounting and GST workflow platform for CA
firms serving Indian SMB clients.

Business owners send invoices, receipts, documents, and notes over WhatsApp.
KhataOne stores the raw source material, extracts accounting fields with AI,
routes uncertain records to CA review, creates ledger handoffs, prepares GST
summaries, and generates traceable exports.

## Explain KhataOne Simply

**One sentence:** KhataOne helps CA firms collect client documents through
WhatsApp, turn them into reviewable accounting drafts, and prepare GST summaries
and exports.

**For a customer:** Your clients can send invoices and receipts through WhatsApp.
Your accounting team sees the intake in one web workspace, checks the extracted
details, and decides what enters the books. The client does not need to learn a
new accounting dashboard.

**For a teammate:** The WhatsApp sender belongs to a client record in a CA firm's
workspace. KhataOne keeps the original message/document, creates a draft from
extracted data, and leaves financial decisions to an authorized reviewer.

Think of WhatsApp as the document mailbox, AI as a helper that sorts the papers,
and the CA as the person who checks and signs off on the accounting work.

Use this short explanation in a demo: "Send a document on WhatsApp; your CA team
reviews the extracted information in KhataOne and can prepare reports and GST
summaries from approved records." Describe time savings as a goal, not a
measured result unless you have customer evidence.

## Who Uses Which Part

| Person | What they do |
| --- | --- |
| SMB client | Sends invoices, receipts, PDFs, images, or notes from their registered WhatsApp number. |
| CA owner or staff | Adds clients, checks Inbox and Review Queue, approves or corrects drafts, and prepares ledger, GST summaries, reports, and exports in the web dashboard. |
| Firm viewer | Sees only the pages and actions permitted by their role. |

The **firm contact phone** entered during firm setup is not the client's
WhatsApp sender number. A CA adds that sender number to the **client** record,
including its country code. The current matcher assigns an inbound message only
when that number identifies exactly one non-archived client across all firms. An
unmatched message is retained for investigation but has no firm assignment, so
it does not appear in that firm's Inbox. A reply to `hi` alone does not prove a
document was assigned to the correct client.

## The Workflow To Remember

1. A CA signs in, creates a firm workspace, and adds a client with the number
   the client will send from.
2. Meta sends a signed WhatsApp webhook to KhataOne. The app stores the raw
   event and matches the sender to one client and firm.
3. For a matched document, the app keeps the original in private storage and
   queues extraction. Successful extraction creates a **draft**, with confidence
   and risk information for review.
4. An authorized CA user checks, corrects, approves, rejects, or requests
   clarification. Important actions are recorded for traceability.
5. The team uses reviewed records for ledger work, GST preparation, reports,
   and exports. KhataOne does **not** submit GST filings.

If a message is missing from Inbox, check these in order: whether it reached
the webhook, whether the sender matches one client number with country code,
whether the message has a `firm_id` and `client_id`, and whether document and
extraction jobs completed. See the [production runbook](docs/Production-Runbook.md)
for operational checks.

## What We Can And Cannot Promise

- Explain the current product as a **CA-controlled workflow**. AI helps extract
  information; it does not make final accounting decisions or guarantee that an
  invoice is correct.
- Say **GST summaries, readiness, and exports**, not direct GST filing. Direct
  filing, bank/GSTR reconciliation, Tally sync, billing, and a platform-admin
  console are future work unless the [tracker](docs/Tracker.md) says otherwise.
- Workspace Help accepts issue reports, but a platform-admin triage and reply
  interface is not yet implemented. Do not promise an in-app support response.
- WhatsApp business-number rollout and client-number matching are separate.
  The app currently uses a configured business phone ID for outbound messages;
  adding a firm or client in the web app does not create a Meta business number.
  Check the [environment map](docs/Environment-Mapping.md) and
  [tracker](docs/Tracker.md) before promising that a new number is ready.

## Developer's Quick Map

| If you need to understand... | Start here |
| --- | --- |
| Product users, scope, and honest claims | [PRD](docs/PRD.md), [BRD](docs/BRD.md), [tracker](docs/Tracker.md) |
| Stack and security boundaries | [TRD](docs/TRD.md), [backend schema](docs/Backend-Schema.md), [agent rules](AGENTS.md) |
| Firm and client creation | `src/app/actions/auth.ts`, `src/app/actions/clients.ts`, `src/lib/firms.ts` |
| WhatsApp delivery and sender matching | `src/app/api/webhooks/whatsapp/route.ts`, `src/lib/whatsapp/ingestion.ts`, `src/lib/whatsapp/phone.ts` |
| AI draft creation and review | `src/lib/ai/`, `src/app/actions/review.ts`, `src/app/(dashboard)/dashboard/review-queue/` |
| Ledger, GST, and exports | `src/app/actions/ledger.ts`, `src/app/actions/gst.ts`, `src/app/actions/exports.ts` |
| Database ownership and audit rules | `supabase/migrations/`, [backend schema](docs/Backend-Schema.md) |
| Deployment, secrets, and recovery | [production runbook](docs/Production-Runbook.md), [environment map](docs/Environment-Mapping.md) |

Keep `firm_id` and role checks in every firm-owned flow; RLS is another boundary,
not a substitute for checking the action's permissions. Keep raw WhatsApp input,
private source documents, AI output, and review/audit history. Store secrets only
in environment variables. After a focused change, run the relevant tests and
`npm run verify`; use `npm run verify:release-local` for a release candidate.

## Current Scope

- Next.js App Router dashboard and landing page
- Supabase Auth, Postgres, Storage, and firm-scoped RLS
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

## Running Costs And Scaling

KhataOne uses several hosted services. The repository shows which services the
application integrates with, but it does **not** show which paid plans are active
in the owner's accounts. Check each provider's billing and usage dashboard before
buying a plan. Prices and free allowances change; the figures below were checked
on **18 September 2026** and are planning references, not a cost forecast.

| Service | What KhataOne uses | Payment model and upgrade trigger |
| --- | --- | --- |
| [Vercel](https://vercel.com/pricing) | Hosts the Next.js site and server functions. The [runbook](docs/Production-Runbook.md) describes the current Hobby cron fallback. | Hobby is free for personal, non-commercial use. Budget for Pro before commercial customer use; its listed starting price is **US$20/month per developer seat**, with usage beyond included credit billed separately. The authoritative one-minute recovery schedule already uses Supabase Cron; a Vercel upgrade alone is not a recovery-plan change. |
| [Supabase](https://supabase.com/pricing) | Auth, Postgres, private document storage, RLS, and scheduled recovery. | Free has database, storage, bandwidth, and auth allowances, but no automatic backups and may pause after inactivity. Pro starts at **US$25/month** for the first project and includes daily backups; additional compute, projects, storage, bandwidth, or auth usage may cost more. Check backup and restore requirements before putting customer financial data into production. |
| [OpenAI API](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform) | AI extraction of supported documents when the OpenAI provider is configured and selected. | **Usage-based API billing**, depending on model and processing volume; a ChatGPT subscription does not include API usage. The `rule_based_text` provider can process limited simple text invoices without OpenAI credits, but it is not a replacement for image, PDF, or audio extraction. See [API pricing](https://developers.openai.com/api/docs/pricing) before estimating per-document cost. |
| [WhatsApp Business Platform](https://whatsappbusiness.com/products/platform-pricing/) | Inbound client messages, document intake, acknowledgments, and replies through Meta Cloud API. | There is no separate KhataOne license to buy for each client sender. Meta charges for applicable **delivered outbound messages** by recipient market and message category. Its published pricing currently lists service replies within the customer-service window as free; check the current rate card and the production WhatsApp account's payment setup before launch. A business phone-number/provider charge, if any, is separate. A new firm or client in KhataOne does not automatically register a Meta business number. |
| [Transactional email / custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) | Supabase Auth signup, confirmation, and password-reset email. No email provider is selected in this repository. | Supabase's built-in sender is for testing, restricts recipients, and is not suitable for production. Choose and configure an SMTP provider before broad onboarding; the provider may have a free allowance and then charge by plan or email volume. |
| Custom domain | A branded address instead of the current `vercel.app` address. | Optional for functionality, but useful for customer trust and branded email. Domain registration normally has an annual renewal cost that depends on the name and registrar. |
| [GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions) | CI workflows; recovery workflows exist as a fallback and are gated while Supabase Cron is authoritative. | The repository is currently public, so standard GitHub-hosted Actions minutes are free. Recheck costs if the repository becomes private, uses larger runners, or exceeds included storage. No paid GitHub plan is required for the current workflows. |

For an initial paid-hosting estimate, **Vercel Pro plus Supabase Pro starts at about
US$45/month** at the listed one-seat/one-project rates, before taxes and usage.
OpenAI processing, chargeable WhatsApp messages, email delivery, a domain, and
overages are separate. Use actual monthly traffic, document counts, storage,
and provider invoices to build a real budget. Do not purchase a separate queue,
database, mobile app-store account, or GST-filing integration for the current
web workflow; those are not current dependencies. Next.js, React, TypeScript,
Tailwind CSS, and lucide-react do not require paid licenses for this stack.

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

- `rules.md`
- `BRD.md`
- `PRD.md`
- `TRD.md`
- `Implementation-Plan.md`
- `Backend-Schema.md`
- `Design.md`
- `UI-UX-Design-Brief.md`
- `UI-UX-Remediation-Plan.md`
- `UI-Consistency-Implementation-Plan.md`
- `Production-Runbook.md`
- `Environment-Mapping.md`
- `security-hardening-plan.md`
- `Tracker.md`

## Security

Do not commit `.env.local` or old credential files. The repo intentionally
tracks `.env.example` only.
