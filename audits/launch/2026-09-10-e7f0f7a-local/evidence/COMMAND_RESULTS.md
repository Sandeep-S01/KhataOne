# Command Results

## Repository Discovery

```text
Repository root: D:\P\KhataOne
Branch: main
Commit: e7f0f7aa982069ecff4a1f343b4564b552b52e4e
Status: ## main...origin/main
```

## Static And Build Checks

```text
npm.cmd run lint
Result: PASS
Output summary: eslint . completed with exit code 0.

npm.cmd run typecheck
Result: PASS
Output summary: tsc --noEmit completed with exit code 0.

npm.cmd run test:performance
Result: PASS
Output summary: OK dashboard query semantics checks passed.

npm.cmd run build
Result: PASS
Output summary: Next.js 16.3.0 production build compiled successfully, generated 19 static pages, dashboard routes dynamic.
```

## Local Smoke

Started with:

```text
npm.cmd run start -- --hostname 127.0.0.1 --port 3001
```

Smoke command:

```text
SMOKE_BASE_URL=http://127.0.0.1:3001 npm.cmd run smoke:local
```

Result:

```text
OK   /: 200
OK   /api/health: 200
OK   /dashboard: 307
OK   /dashboard/clients: 307
OK   /dashboard/review-queue: 307
OK   /dashboard/ledger: 307
OK   /dashboard/gst-summary: 307
OK   /dashboard/reports: 307
OK   /dashboard/exports: 307
OK   /dashboard/audit-logs: 307
OK   /dashboard/operations: 307
OK   /dashboard/platform: 307
OK   /dashboard/settings: 307
```

## Blocked Commands

The following were not executed because required authorization or credentials were absent:

```text
npm.cmd run perf:live-dashboard
npm.cmd run perf:browser-dashboard
k6 load tests against webhook/dashboard workflows
real Meta WhatsApp canary
real OpenAI extraction evaluation
Supabase RLS restricted-principal test suite
```
