# KhataOne Platform Extensions Roadmap

This roadmap separates production v1 from long-term platform capabilities.
Production v1 prepares accounting, GST summaries, and exports. It does not
submit GST filings or sync accounting systems.

## Extension Gates

Every platform extension must pass these gates before release:

- Product scope and user story approved.
- Provider/API behavior verified against official or contracted provider docs.
- Tenant isolation and RLS verified.
- Audit log behavior implemented.
- Failure and retry states visible in Operations.
- Production smoke test added.
- CA/user-facing copy avoids unsupported claims.

## Direct GST Integration

Target persona: CA firm owner and senior GST operator.

Business goal: reduce manual GST portal work while preserving CA control and
traceability.

In scope for future release:

- GST provider connection records.
- GSTR-1 and GSTR-2B comparison workflows.
- Filing preparation using approved KhataOne summaries.
- Filing submission only after provider integration, compliance, and production
  verification are complete.
- External request/response logging where provider terms allow it.

Out of scope until verified:

- Claiming KhataOne has filed a return.
- Direct GST portal behavior not backed by a verified provider.
- Automatic filing without CA review.

## Bank Reconciliation

Target persona: CA staff and accounting operator.

Business goal: match bank statement lines to approved transactions and surface
exceptions.

Future scope:

- Bank statement document parsing.
- Bank account records per client.
- Matching suggestions with confidence.
- Review queue for unmatched or ambiguous lines.
- Audit logs for reconciliation decisions.

## WhatsApp Reminders

Target persona: CA staff and SMB owner.

Business goal: reduce missing documents and clarification delays.

Future scope:

- Missing document reminder schedule.
- WhatsApp clarification loops linked to transactions/documents.
- Client confirmation messages for review questions.
- Rate limits and opt-out handling.

## Accounting Software Sync

Target persona: CA owner and operations lead.

Business goal: move approved KhataOne data into existing accounting systems.

Future scope:

- Tally-ready mapping.
- Zoho Books and QuickBooks provider boundaries.
- Integration events table for queued/success/failed sync attempts.
- Reconciliation between KhataOne exports and downstream system acknowledgments.

## Billing And Subscriptions

Target persona: KhataOne admin and CA firm owner.

Business goal: monetize firms by plan, usage, and document volume.

Future scope:

- Subscription customer records.
- Plan limits by firm.
- Usage counters for documents, AI extraction, exports, and users.
- Stripe or equivalent billing provider integration.

## Staff Analytics And Multi-Firm Admin

Target persona: CA firm owner and KhataOne internal admin.

Business goal: understand throughput, bottlenecks, and support needs.

Future scope:

- Staff activity metrics.
- Review queue SLA reporting.
- Firm-level admin console.
- Cross-firm administration only for explicitly authorized KhataOne internal
  roles, never through normal firm membership.
