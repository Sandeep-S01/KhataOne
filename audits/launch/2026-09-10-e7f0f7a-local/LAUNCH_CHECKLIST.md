# Launch Checklist

| Gate | Status | Evidence | Owner |
|---|---|---|---|
| Production build passes | PASS | `npm.cmd run build` | Engineering |
| Protected routes require auth locally | PASS | local smoke returned dashboard `307` redirects | Engineering |
| WhatsApp webhook signature verification exists | PASS by code | `src/app/api/webhooks/whatsapp/route.ts:72` | Backend |
| Media inputs become reviewable drafts | FAIL | KO-LAUNCH-001 | AI/Backend |
| CA approval creates one durable handoff atomically | NOT TESTED/PARTIAL | KO-LAUNCH-002 | Backend |
| RLS and service-role isolation verified with two firms | BLOCKED | KO-LAUNCH-004 | Security |
| GST summaries are preparation-only and approved-source scoped | PASS by code / NOT TESTED runtime | `src/app/actions/gst.ts:240` | Backend |
| CSV/PDF exports are private and audited | PARTIAL | KO-LAUNCH-006 and download route inspection | Backend |
| 10k DAU capacity tested | BLOCKED | KO-LAUNCH-005 | Performance |
| 20k DAU capacity tested | BLOCKED | KO-LAUNCH-005 | Performance |
| Backup/restore drill | BLOCKED | no target or backup access | Platform |
| Current Meta/GST official-account verification | BLOCKED | no account target | Product/Compliance |

## Decision Gates

- Controlled pilot: `NO-GO` until KO-LAUNCH-001, KO-LAUNCH-002, KO-LAUNCH-004 and CSV export safety are resolved or explicitly scoped out with controlled pilot limits.
- 10k/20k launch: `INSUFFICIENT EVIDENCE` until production-like load and recovery tests are run.
