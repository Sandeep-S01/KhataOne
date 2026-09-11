# Implementation Tracker

Run: `2026-09-10-phase-0-1`
Source audit: `audits/launch/2026-09-10-e7f0f7a-local`

## Scope

Executed the hardening prompt default scope: Phase 0 baseline plus Phase 1 local security and financial-integrity fixes. Phase 2 media processing, worker reliability, shared rate limits and async large exports remain future work.

| Finding | Change | Implementation | Verification | External prerequisite |
|---|---|---|---|---|
| KO-LAUNCH-002 | Added `approve_transaction_with_handoff` PostgreSQL RPC and unique handoff index | IMPLEMENTED locally | STATIC PASS; DB runtime BLOCKED | Apply migration to authorized staging with duplicate preflight |
| KO-LAUNCH-002 | Switched `approveTransactionAction` to call the RPC instead of sequential app writes | IMPLEMENTED locally | lint/typecheck/build PASS | Staging approval/concurrency test users |
| KO-LAUNCH-002 | Added fail-closed migration preflight and approval RPC concurrency scripts | IMPLEMENTED locally | Refuses safely without non-production target | Authorized staging DB and disposable approvable transaction |
| KO-LAUNCH-004 | Added fail-closed RLS access matrix script | IMPLEMENTED locally | Refused safely without non-production target | Supabase test project, two firms, role users, revoked user, test IDs |
| KO-LAUNCH-006 | Added centralized CSV serializer that neutralizes spreadsheet formula-leading text | IMPLEMENTED locally | STATIC PASS; spreadsheet app round-trip NOT TESTED | Excel/Sheets manual verification if required |
| KO-LAUNCH-006 | Export generation now imports shared CSV serializer | IMPLEMENTED locally | lint/typecheck/build PASS | Staging export fixture verification |
| KO-LAUNCH-001 | Media OCR/PDF/audio path | NOT STARTED | BLOCKED/OUT OF PHASE | Phase 2 |
| KO-LAUNCH-003 | Worker cadence/recovery | NOT STARTED | BLOCKED/OUT OF PHASE | Phase 2 staging scheduler |
| KO-LAUNCH-005 | 10k/20k load proof | NOT STARTED | BLOCKED/OUT OF PHASE | Phase 3 authorized production-like target |
| KO-LAUNCH-007 | Shared rate limits | NOT STARTED | BLOCKED/OUT OF PHASE | Phase 2 |
| KO-LAUNCH-008 | Async large exports | NOT STARTED | BLOCKED/OUT OF PHASE | Phase 2 |

## Remaining Phase 1 Caveat

The app approval path now uses the transactional RPC. Existing RLS policies still allow staff-level direct updates to `transactions`, so a stronger database-enforced approval boundary should be considered after checking all legitimate worker/admin mutation paths. This pass did not add a trigger that blocks direct `status = approved` updates because it could break seed/import/service-role workflows without a full staging migration rehearsal.
