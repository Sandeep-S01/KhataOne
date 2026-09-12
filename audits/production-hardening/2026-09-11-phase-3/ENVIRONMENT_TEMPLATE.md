# Phase 3 Capacity Environment Template

Use these variables only for an explicitly authorized non-production run. Do not paste secret values into reports.

```text
KHATAONE_PHASE3_RUN_ID=phase3-staging-smoke-YYYYMMDD-HHMM

KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD=true
KHATAONE_PHASE3_CAPACITY_TARGET_LABEL=non-production
KHATAONE_PHASE3_BASE_URL=<staging-url>
KHATAONE_PHASE3_EXPECTED_HOST=<exact-staging-hostname>
KHATAONE_PHASE3_SCENARIO=mixed_10k_dau
KHATAONE_PHASE3_DURATION=5m
KHATAONE_PHASE3_AUTH_COOKIE=<redacted-cookie-header-value>
KHATAONE_PHASE3_ENABLE_WORKER_LOAD=false

KHATAONE_PHASE3_RECONCILE_ALLOW_NON_PROD=true
KHATAONE_PHASE3_RECONCILE_TARGET_LABEL=non-production
KHATAONE_PHASE3_RECONCILE_EXPECTED_HOST=<exact-staging-supabase-hostname>
KHATAONE_PHASE3_RECONCILE_FIRM_ID=<firm-id>
NEXT_PUBLIC_SUPABASE_URL=<staging-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
```

Worker/provider load is disabled by default. Enable it only after dashboard-only load
passes and provider spend is explicitly authorized:

```text
KHATAONE_PHASE3_ENABLE_WORKER_LOAD=true
KHATAONE_PHASE3_ALLOW_PROVIDER_COST=true
JOB_RUNNER_SECRET=<staging-job-secret>
```

Optional k6 sizing controls:

```text
KHATAONE_PHASE3_DASHBOARD_PREALLOCATED_VUS=100
KHATAONE_PHASE3_DASHBOARD_MAX_VUS=1000
KHATAONE_PHASE3_WORKER_PREALLOCATED_VUS=10
KHATAONE_PHASE3_WORKER_MAX_VUS=100
KHATAONE_PHASE3_RECONCILE_MAX_ROWS=100000
```

Recommended local preparation:

```text
npm.cmd run create:phase3-capacity-run
```

This creates a redacted manifest and command file under `audits/production-hardening/2026-09-11-phase-3/evidence/<run-id>/`.
