import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const secretNamePattern = /(SECRET|KEY|TOKEN|COOKIE|PASSWORD|SERVICE_ROLE)/i;
const baseDir = "audits/production-hardening/2026-09-11-phase-3/evidence";

function sanitizeValue(key, value) {
  if (!value) {
    return null;
  }

  if (secretNamePattern.test(key)) {
    return "<redacted>";
  }

  return value;
}

function envSnapshot(keys) {
  return Object.fromEntries(
    keys.map((key) => [key, sanitizeValue(key, process.env[key])]),
  );
}

const runId =
  process.env.KHATAONE_PHASE3_RUN_ID ||
  `phase3-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const runDir = resolve(process.cwd(), baseDir, runId);
const k6SummaryPath = `audits/production-hardening/2026-09-11-phase-3/evidence/${runId}/k6-summary.json`;
const baselineReconciliationPath = `audits/production-hardening/2026-09-11-phase-3/evidence/${runId}/baseline-reconciliation.json`;
const reconciliationPath = `audits/production-hardening/2026-09-11-phase-3/evidence/${runId}/reconciliation.json`;

mkdirSync(runDir, { recursive: true });

const manifest = {
  run_id: runId,
  created_at: new Date().toISOString(),
  status: "PREPARED_NOT_EXECUTED",
  evidence_directory: runDir,
  workload_manifest:
    "audits/production-hardening/2026-09-11-phase-3/WORKLOAD_MANIFEST.json",
  k6_summary_path: k6SummaryPath,
  baseline_reconciliation_path: baselineReconciliationPath,
  reconciliation_path: reconciliationPath,
  environment: envSnapshot([
    "KHATAONE_PHASE3_BASE_URL",
    "KHATAONE_PHASE3_EXPECTED_HOST",
    "KHATAONE_PHASE3_SCENARIO",
    "KHATAONE_PHASE3_DURATION",
    "KHATAONE_PHASE3_ENABLE_WORKER_LOAD",
    "KHATAONE_PHASE3_ALLOW_PROVIDER_COST",
    "KHATAONE_PHASE3_DASHBOARD_PREALLOCATED_VUS",
    "KHATAONE_PHASE3_DASHBOARD_MAX_VUS",
    "KHATAONE_PHASE3_WORKER_PREALLOCATED_VUS",
    "KHATAONE_PHASE3_WORKER_MAX_VUS",
    "KHATAONE_PHASE3_AUTH_COOKIE",
    "JOB_RUNNER_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "KHATAONE_PHASE3_RECONCILE_FIRM_ID",
    "KHATAONE_PHASE3_RECONCILE_EXPECTED_HOST",
  ]),
  commands: [
    "npm.cmd run preflight:phase3-capacity",
    `npm.cmd run reconcile:phase3-capacity > ${baselineReconciliationPath}`,
    `k6 run --summary-export ${k6SummaryPath} audits/production-hardening/2026-09-11-phase-3/tests/k6/phase3-mixed-load.js`,
    `npm.cmd run reconcile:phase3-capacity > ${reconciliationPath}`,
  ],
  notes: [
    "Secrets are redacted in this manifest.",
    "Do not run load commands without explicit non-production authorization.",
    "Dashboard-only load is the default; worker/provider load requires separate explicit authorization.",
    "Preserve failed run outputs; do not relax thresholds silently.",
  ],
};

writeFileSync(
  resolve(runDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

writeFileSync(
  resolve(runDir, "commands.ps1"),
  [
    "# Phase 3 capacity run commands",
    "# Review environment variables before execution. Do not commit secrets.",
    "npm.cmd run preflight:phase3-capacity",
    `npm.cmd run reconcile:phase3-capacity > ${baselineReconciliationPath}`,
    `k6 run --summary-export ${k6SummaryPath} audits/production-hardening/2026-09-11-phase-3/tests/k6/phase3-mixed-load.js`,
    `npm.cmd run reconcile:phase3-capacity > ${reconciliationPath}`,
    "",
  ].join("\n"),
);

console.log("OK Phase 3 capacity evidence run directory prepared");
console.log(`RUN_ID=${runId}`);
console.log(`EVIDENCE_DIR=${runDir}`);
console.log(`K6_SUMMARY=${k6SummaryPath}`);
console.log(`BASELINE_RECONCILIATION=${baselineReconciliationPath}`);
console.log(`RECONCILIATION=${reconciliationPath}`);
