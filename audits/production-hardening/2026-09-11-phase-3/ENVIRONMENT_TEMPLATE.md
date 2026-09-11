# Phase 3 Capacity Environment Template

Use these variables only for an explicitly authorized non-production run. Do not paste secret values into reports.

```text
KHATAONE_PHASE3_RUN_ID=phase3-staging-smoke-YYYYMMDD-HHMM

KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD=true
KHATAONE_PHASE3_CAPACITY_TARGET_LABEL=non-production
KHATAONE_PHASE3_BASE_URL=<staging-url>
KHATAONE_PHASE3_SCENARIO=mixed_10k_dau
KHATAONE_PHASE3_DURATION=5m
KHATAONE_PHASE3_AUTH_COOKIE=<redacted-cookie-header-value>
JOB_RUNNER_SECRET=<staging-job-secret>

KHATAONE_PHASE3_RECONCILE_ALLOW_NON_PROD=true
KHATAONE_PHASE3_RECONCILE_TARGET_LABEL=non-production
KHATAONE_PHASE3_RECONCILE_FIRM_ID=<firm-id>
NEXT_PUBLIC_SUPABASE_URL=<staging-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
```

Optional k6 sizing controls:

```text
KHATAONE_PHASE3_DASHBOARD_PREALLOCATED_VUS=100
KHATAONE_PHASE3_DASHBOARD_MAX_VUS=1000
KHATAONE_PHASE3_WORKER_PREALLOCATED_VUS=10
KHATAONE_PHASE3_WORKER_MAX_VUS=100
```

Recommended local preparation:

```text
npm.cmd run create:phase3-capacity-run
```

This creates a redacted manifest and command file under `audits/production-hardening/2026-09-11-phase-3/evidence/<run-id>/`.
