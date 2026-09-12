# Production Hardening Phase 3 Implementation Tracker

Date: 2026-09-11

## Scope Started

Phase 3 begins capacity and release-preparation evidence scaffolding. No staging load test was executed in this pass.

## Added

- `WORKLOAD_MANIFEST.json`: versioned mixed-10k, mixed-20k, CA-heavy-10k, and CA-heavy-20k workload definitions, with measured and separately unmeasured gates distinguished.
- `tests/k6/phase3-mixed-load.js`: fail-closed k6 open-arrival scaffold with exact-host production denial, redirect rejection, route-specific thresholds, dashboard-only default, and separately authorized worker/provider load.
- `scripts/preflight-phase3-capacity.mjs`: refuses without explicit non-production flags, required staging auth, selected scenario, and k6 on PATH.
- `scripts/reconcile-phase3-capacity-run.mjs`: fail-closed paginated before/after business-state reconciliation for queue/document/extraction/transaction/export/audit counts and duplicate handoffs.
- `scripts/test-phase3-hardening.mjs`: local static regression check for Phase 3 scaffolding.
- `DEPLOYMENT_AND_RECOVERY_RUNBOOK.md`: staging execution sequence, stop conditions, recovery notes, and release interpretation.
- `ENVIRONMENT_TEMPLATE.md`: redacted operator variable template for authorized staging runs.
- `scripts/create-phase3-capacity-run.mjs`: local evidence-directory preparation with redacted manifest and command file.

## Current Status

Implementation: `HARDENED LOCALLY`

Verification: `LOCAL_EXECUTED` for static checks, native k6 parsing/preflight, and `LOCAL APP AGAINST NON-PROD DB` for baseline reconciliation; `BLOCKED` for staging capacity evidence.

## External Prerequisites

- Authenticated dashboard test cookie or equivalent controlled test session.
- `JOB_RUNNER_SECRET` for staging.
- Non-production Supabase service role for reconciliation.
- k6 installed on the load-generator host. Version 2.2.0 is available locally.
- Owner-approved duration, spend, and provider mode.

## Verification Notes From Current Pass

- Authorized non-production Supabase verification is now available.
- Baseline reconciliation was captured for firm `e5fc7ea3-548c-475b-baf8-7e485b24adfe` with duplicate logical handoffs `0`.
- Native k6 2.2.0 parsed the dashboard-only workload and the synthetic exact-host preflight passed. Its install directory was added to the user PATH; restart terminals to inherit it.
- Vercel configuration inspection shows each Supabase URL/anonymous/service-role secret is one binding shared by Preview and Production. Existing Preview deployments are therefore not an isolated database target and must not be used for this capacity run.
- Capacity execution remains blocked until Vercel Preview is connected to a separate staging Supabase project and a controlled staging dashboard cookie is available.
- Phase 3 should not run until Phase 2 PDF/media extraction failure is diagnosed and deployed worker routes are current.

## Capacity Harness V2 Review

- Production is denied by hostname; a non-production label alone is no longer trusted.
- The expected staging hostname must exactly match the load target.
- Dashboard redirects are not followed, so a login response cannot be counted as a successful dashboard request.
- Dashboard route p95/p99 and dropped-iteration thresholds are explicit.
- Worker/provider load is disabled by default and requires separate cost authorization.
- Reconciliation requires an exact staging Supabase hostname, is paginated, fails rather than silently truncating, and captures before/after queue, workflow, audit, export, and duplicate-handoff state.
- Webhook, approval, end-to-end extraction, export acceptance, loss, and cross-tenant checks remain separate release gates; this dashboard harness does not certify them.
