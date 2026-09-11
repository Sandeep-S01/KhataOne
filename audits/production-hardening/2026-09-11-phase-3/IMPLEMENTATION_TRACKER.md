# Production Hardening Phase 3 Implementation Tracker

Date: 2026-09-11

## Scope Started

Phase 3 begins capacity and release-preparation evidence scaffolding. No staging load test was executed in this pass.

## Added

- `WORKLOAD_MANIFEST.json`: versioned mixed-10k, mixed-20k, CA-heavy-10k, and CA-heavy-20k workload definitions.
- `tests/k6/phase3-mixed-load.js`: fail-closed k6 open-arrival scaffold for authenticated dashboard reads and worker ticks.
- `scripts/preflight-phase3-capacity.mjs`: refuses without explicit non-production flags, required staging auth, selected scenario, and k6 on PATH.
- `scripts/reconcile-phase3-capacity-run.mjs`: fail-closed post-run business-state reconciliation for queue/document/extraction/transaction/export counts and duplicate handoffs.
- `scripts/test-phase3-hardening.mjs`: local static regression check for Phase 3 scaffolding.
- `DEPLOYMENT_AND_RECOVERY_RUNBOOK.md`: staging execution sequence, stop conditions, recovery notes, and release interpretation.
- `ENVIRONMENT_TEMPLATE.md`: redacted operator variable template for authorized staging runs.
- `scripts/create-phase3-capacity-run.mjs`: local evidence-directory preparation with redacted manifest and command file.

## Current Status

Implementation: `PARTIAL`

Verification: `LOCAL_EXECUTED` for static checks and `LOCAL APP AGAINST NON-PROD DB` for baseline reconciliation; `BLOCKED` for k6 capacity evidence.

## External Prerequisites

- Authenticated dashboard test cookie or equivalent controlled test session.
- `JOB_RUNNER_SECRET` for staging.
- Non-production Supabase service role for reconciliation.
- k6 installed on the load-generator host.
- Owner-approved duration, spend, and provider mode.

## Verification Notes From Current Pass

- Authorized non-production Supabase verification is now available.
- Baseline reconciliation was captured for firm `e5fc7ea3-548c-475b-baf8-7e485b24adfe` with duplicate logical handoffs `0`.
- Capacity preflight remains blocked because native `k6` is not on `PATH` and no signed-in dashboard test cookie is available.
- Phase 3 should not run until Phase 2 PDF/media extraction failure is diagnosed and deployed worker routes are current.
