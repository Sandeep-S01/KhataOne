# Phase 3 capacity run commands
# Review environment variables before execution. Do not commit secrets.
npm.cmd run preflight:phase3-capacity
k6 run --summary-export audits/production-hardening/2026-09-11-phase-3/evidence/phase3-2026-09-10T19-09-45-297Z/k6-summary.json audits/production-hardening/2026-09-11-phase-3/tests/k6/phase3-mixed-load.js
npm.cmd run reconcile:phase3-capacity > audits/production-hardening/2026-09-11-phase-3/evidence/phase3-2026-09-10T19-09-45-297Z/reconciliation.json
