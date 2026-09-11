# Production Hardening Phase 3 Deployment And Recovery Runbook

Date: 2026-09-11

## Purpose

This runbook prepares an authorized non-production capacity run. It does not certify production readiness by itself. All workload runs must use synthetic or approved staging data and must keep provider spend limits explicit.

## Preconditions

- Phase 2 staging verification has passed for queued exports and media extraction.
- Target environment is explicitly labeled non-production.
- k6 is installed on the load-generator host.
- Staging app URL is available.
- A controlled authenticated dashboard session is available as `KHATAONE_PHASE3_AUTH_COOKIE`.
- `JOB_RUNNER_SECRET` is configured for the staging worker routes.
- Supabase staging credentials are available for post-run reconciliation.
- Operator has selected one scenario from `WORKLOAD_MANIFEST.json`.
- Operator has approved duration, provider mode, and spend caps.

## Recommended First Smoke

Start with the smallest mixed workload and a short duration:

```text
KHATAONE_PHASE3_RUN_ID=phase3-staging-smoke-YYYYMMDD-HHMM
KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD=true
KHATAONE_PHASE3_CAPACITY_TARGET_LABEL=non-production
KHATAONE_PHASE3_BASE_URL=<staging-url>
KHATAONE_PHASE3_SCENARIO=mixed_10k_dau
KHATAONE_PHASE3_AUTH_COOKIE=<redacted-cookie-header-value>
JOB_RUNNER_SECRET=<staging-job-secret>
KHATAONE_PHASE3_DURATION=5m
npm.cmd run create:phase3-capacity-run
npm.cmd run preflight:phase3-capacity
npm.cmd run load:phase3-capacity
```

Then reconcile business state:

```text
KHATAONE_PHASE3_RECONCILE_ALLOW_NON_PROD=true
KHATAONE_PHASE3_RECONCILE_TARGET_LABEL=non-production
KHATAONE_PHASE3_RECONCILE_FIRM_ID=<firm-id>
npm.cmd run reconcile:phase3-capacity
```

## Full Scenario Progression

Run scenarios only after the previous one has passed latency, error-rate, queue-stability, and reconciliation gates:

1. `mixed_10k_dau`
2. `mixed_20k_dau`
3. `ca_heavy_10k_dashboard_dau`
4. `ca_heavy_20k_dashboard_dau`

For each scenario, preserve:

- k6 summary output.
- Selected environment shape and regions.
- Queue depth/oldest age before and after.
- Reconciliation JSON.
- Provider mode and quota observations.
- Any app/database/storage errors.

## Stop Conditions

Stop the run if any of these occur:

- Cross-tenant access is observed.
- Duplicate logical handoff count is non-zero.
- Accepted business input is lost.
- Unexpected failure rate exceeds the frozen threshold.
- Queue age grows without recovery.
- Provider spend, quota, or error limits are reached.
- Database, storage, or worker pressure threatens the staging environment.

## Recovery Notes

- Preserve logs and reconciliation output before cleanup.
- Clean only attributed Phase 2 fixture data with `cleanup:phase2-staging-fixtures`.
- Do not delete audit or financial records outside synthetic fixture labels.
- If workers are stuck, inspect `processing_jobs` by `status`, `locked_at`, `locked_by`, and `last_error` before manually changing state.
- Failed capacity runs remain evidence; record them rather than rerunning silently with looser thresholds.

## Release Interpretation

A passing short smoke is not a target-capacity verdict. A target-capacity verdict needs the selected scenario, duration, offered/achieved load, p95/p99, failures, queue behavior, provider mode, business reconciliation, and remaining headroom.
