import { existsSync, readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  }
}

function read(path) {
  return readFileSync(path, "utf8");
}

const manifestPath =
  "audits/production-hardening/2026-09-11-phase-3/WORKLOAD_MANIFEST.json";
const k6Path =
  "audits/production-hardening/2026-09-11-phase-3/tests/k6/phase3-mixed-load.js";

assert(existsSync(manifestPath), "Phase 3 workload manifest must exist");
assert(existsSync(k6Path), "Phase 3 k6 workload script must exist");

const manifest = JSON.parse(read(manifestPath));
const k6 = read(k6Path);
const packageJson = JSON.parse(read("package.json"));
const preflight = read("scripts/preflight-phase3-capacity.mjs");
const reconcile = read("scripts/reconcile-phase3-capacity-run.mjs");
const runbook = read(
  "audits/production-hardening/2026-09-11-phase-3/DEPLOYMENT_AND_RECOVERY_RUNBOOK.md",
);
const environmentTemplate = read(
  "audits/production-hardening/2026-09-11-phase-3/ENVIRONMENT_TEMPLATE.md",
);
const evidenceRunCreator = read("scripts/create-phase3-capacity-run.mjs");

assert(
  manifest.status === "NOT_EXECUTED" &&
    manifest.manifest_version === "phase3-capacity-v2" &&
    manifest.scenarios.some((scenario) => scenario.id === "mixed_10k_dau") &&
    manifest.scenarios.some((scenario) => scenario.id === "mixed_20k_dau") &&
    manifest.scenarios.some((scenario) => scenario.id === "ca_heavy_20k_dashboard_dau") &&
    manifest.measured_gates &&
    manifest.separate_unmeasured_release_gates,
  "Phase 3 manifest must define mixed and CA-heavy workloads without claiming execution",
);

assert(
  k6.includes("constant-arrival-rate") &&
    k6.includes("khataone_dashboard_duration_ms") &&
    k6.includes("KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD") &&
    k6.includes("non-production") &&
    k6.includes("KHATAONE_PHASE3_EXPECTED_HOST") &&
    k6.includes("KHATAONE_PHASE3_ENABLE_WORKER_LOAD") &&
    k6.includes("KHATAONE_PHASE3_ALLOW_PROVIDER_COST") &&
    k6.includes("const expectedOrigin") &&
    k6.includes("productionHosts") &&
    k6.includes("redirects: 0") &&
    k6.includes("dropped_iterations") &&
    k6.includes("khataone_route:/dashboard/clients") &&
    k6.includes("khataone_route:/dashboard/review-queue") &&
    k6.includes("khataone_route:/dashboard/ledger"),
  "Phase 3 k6 script must use open-arrival load and fail-closed non-production controls",
);

assert(
    preflight.includes("k6") &&
    preflight.includes("KHATAONE_PHASE3_AUTH_COOKIE") &&
    preflight.includes("KHATAONE_PHASE3_SCENARIO") &&
    preflight.includes("KHATAONE_PHASE3_EXPECTED_HOST") &&
    preflight.includes("production hostname") &&
    !preflight.includes("shell: true"),
  "Phase 3 preflight must require k6, staging auth, and selected scenario",
);

assert(
    reconcile.includes("duplicate_logical_handoffs") &&
    reconcile.includes("processing_jobs") &&
    reconcile.includes("KHATAONE_PHASE3_RECONCILE_ALLOW_NON_PROD") &&
    reconcile.includes("KHATAONE_PHASE3_RECONCILE_EXPECTED_HOST") &&
    reconcile.includes(".range(") &&
    reconcile.includes("row_counts_complete") &&
    reconcile.includes("processing_jobs_by_type_and_status") &&
    reconcile.includes("audit_logs_by_action"),
  "Phase 3 reconciliation must check business-state counts and fail closed",
);

assert(
  packageJson.scripts["test:phase3-hardening"] &&
    packageJson.scripts["create:phase3-capacity-run"] &&
    packageJson.scripts["preflight:phase3-capacity"] &&
    packageJson.scripts["load:phase3-capacity"] &&
    packageJson.scripts["reconcile:phase3-capacity"],
  "package scripts must expose Phase 3 static, preflight, load, and reconciliation checks",
);

assert(
  runbook.includes("Stop Conditions") &&
    runbook.includes("mixed_10k_dau") &&
    runbook.includes("load:phase3-capacity") &&
    runbook.includes("reconcile:phase3-capacity"),
  "Phase 3 runbook must document staged workload execution, stop conditions, and reconciliation",
);

assert(
  environmentTemplate.includes("KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD=true") &&
    environmentTemplate.includes("KHATAONE_PHASE3_EXPECTED_HOST") &&
    environmentTemplate.includes("KHATAONE_PHASE3_ENABLE_WORKER_LOAD=false") &&
    environmentTemplate.includes("KHATAONE_PHASE3_AUTH_COOKIE") &&
    environmentTemplate.includes("SUPABASE_SERVICE_ROLE_KEY"),
  "Phase 3 environment template must document required staging variables without values",
);

assert(
  evidenceRunCreator.includes("secretNamePattern") &&
    evidenceRunCreator.includes("<redacted>") &&
    evidenceRunCreator.includes("k6-summary.json") &&
    evidenceRunCreator.includes("commands.ps1") &&
    evidenceRunCreator.includes("KHATAONE_PHASE3_EXPECTED_HOST") &&
    evidenceRunCreator.includes("KHATAONE_PHASE3_RECONCILE_EXPECTED_HOST") &&
    evidenceRunCreator.includes("baseline-reconciliation.json") &&
    evidenceRunCreator.includes("reconciliation.json"),
  "Phase 3 evidence run creator must redact secrets and prepare result paths",
);

if (!process.exitCode) {
  console.log("OK phase 3 hardening checks passed");
}
