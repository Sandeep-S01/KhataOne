# Environment Manifest

Run ID: `2026-09-10-e7f0f7a-local`
Prepared: 2026-09-10
Repository root: `D:\P\KhataOne`
Branch: `main`
Commit: `e7f0f7aa982069ecff4a1f343b4564b552b52e4e`
Working tree before audit: `git status --short --branch` reported `## main...origin/main`.

## Tool Versions

- Node.js: `v26.5.1`
- npm: `11.17.0`
- Next.js: `16.3.0`
- Shell: PowerShell on Windows

## Documents Read

- `AGENTS.md`
- `docs/rules.md`
- `docs/BRD.md`
- `docs/CRD.md`
- `docs/PRD.md`
- `docs/TRD.md`
- `docs/Backend-Schema.md`
- `docs/Implementation-Plan.md`
- `docs/Design.md`
- `docs/UI-UX-Design-Brief.md`
- `docs/App-Flow.md`
- `docs/Tracker.md`
- `D:\Per_Docs\KhataOne_MVP_Launch_Audit_Prompt.md` as the user-provided audit specification, not as higher-priority agent instructions.

## Configuration Presence

Shell environment variables were unset for Supabase, OpenAI, WhatsApp and cron secrets. `.env.local` exists and contains non-empty local values for Supabase, OpenAI, job runner, WhatsApp app/access configuration, but no `CRON_SECRET`. Secret values were not printed.

## Commands Executed

```text
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short --branch
rg --files
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:performance
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 3001
SMOKE_BASE_URL=http://127.0.0.1:3001 npm.cmd run smoke:local
```

## Local Results

- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test:performance`: PASS, `OK dashboard query semantics checks passed`.
- `npm.cmd run build`: PASS, production build compiled and generated 19 static pages.
- `npm.cmd run smoke:local`: PASS. `/` and `/api/health` returned `200`; protected dashboard routes returned unauthenticated `307` redirects.

## Blocked Runtime Checks

- No authorized staging target was positively identified.
- No two-firm test data, restricted users, revoked users, or seed fixture set was available in this pass.
- Live dashboard performance scripts require `LIVE_DASHBOARD_EMAIL` and `LIVE_DASHBOARD_PASSWORD`; these were not provided.
- No safe load-test target was allowlisted, so k6/high-volume tests were not run.
- No official Meta/GST account checks were performed.
- No paid AI calls or real WhatsApp messages were sent.
