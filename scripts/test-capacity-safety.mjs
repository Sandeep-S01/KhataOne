import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const commonEnvironment = {
  ...process.env,
  KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD: "true",
  KHATAONE_PHASE3_CAPACITY_TARGET_LABEL: "non-production",
  KHATAONE_PHASE3_SCENARIO: "mixed_10k_dau",
  KHATAONE_PHASE3_AUTH_COOKIE: "synthetic-cookie",
};

function runPreflight(environment) {
  const result = spawnSync(
    process.execPath,
    ["scripts/preflight-phase3-capacity.mjs"],
    {
      cwd: process.cwd(),
      env: { ...commonEnvironment, ...environment },
      encoding: "utf8",
    },
  );

  return {
    status: result.status,
    output: `${result.stdout}\n${result.stderr}`,
  };
}

const production = runPreflight({
  KHATAONE_PHASE3_BASE_URL: "https://khataone.vercel.app",
  KHATAONE_PHASE3_EXPECTED_HOST: "khataone.vercel.app",
  KHATAONE_PHASE3_ENABLE_WORKER_LOAD: "false",
});
assert.notEqual(production.status, 0);
assert.match(production.output, /must not target the production hostname/);

const unauthorizedProviderLoad = runPreflight({
  KHATAONE_PHASE3_BASE_URL: "https://staging.example.test",
  KHATAONE_PHASE3_EXPECTED_HOST: "staging.example.test",
  KHATAONE_PHASE3_ENABLE_WORKER_LOAD: "true",
  KHATAONE_PHASE3_ALLOW_PROVIDER_COST: "false",
  JOB_RUNNER_SECRET: "synthetic-secret",
});
assert.notEqual(unauthorizedProviderLoad.status, 0);
assert.match(
  unauthorizedProviderLoad.output,
  /Worker load requires explicit provider-cost authorization/,
);

const reconciliationHostMismatch = spawnSync(
  process.execPath,
  ["scripts/reconcile-phase3-capacity-run.mjs"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      KHATAONE_PHASE3_RECONCILE_ALLOW_NON_PROD: "true",
      KHATAONE_PHASE3_RECONCILE_TARGET_LABEL: "non-production",
      KHATAONE_PHASE3_RECONCILE_EXPECTED_HOST: "staging-project.supabase.co",
      KHATAONE_PHASE3_RECONCILE_FIRM_ID:
        "00000000-0000-4000-8000-000000000000",
      NEXT_PUBLIC_SUPABASE_URL: "https://production-project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role-key",
    },
    encoding: "utf8",
  },
);
assert.notEqual(reconciliationHostMismatch.status, 0);
assert.match(
  `${reconciliationHostMismatch.stdout}\n${reconciliationHostMismatch.stderr}`,
  /Supabase URL hostname must exactly match/,
);

const k6Source = readFileSync(
  "audits/production-hardening/2026-09-11-phase-3/tests/k6/phase3-mixed-load.js",
  "utf8",
);
assert.match(k6Source, /redirects: 0/);
assert.match(k6Source, /dropped_iterations/);
assert.match(k6Source, /if \(enableWorkerLoad\)/);
assert.match(k6Source, /productionHosts\.has/);
assert.match(k6Source, /const expectedOrigin = `https:\/\//);
assert.doesNotMatch(k6Source, /new URL\(/);

const manifest = JSON.parse(
  readFileSync(
    "audits/production-hardening/2026-09-11-phase-3/WORKLOAD_MANIFEST.json",
    "utf8",
  ),
);
assert.equal(manifest.manifest_version, "phase3-capacity-v2");
assert.ok(manifest.measured_gates);
assert.ok(manifest.separate_unmeasured_release_gates);

const reconciliationSource = readFileSync(
  "scripts/reconcile-phase3-capacity-run.mjs",
  "utf8",
);
assert.match(reconciliationSource, /\.order\("id"/);
assert.match(reconciliationSource, /\.range\(/);
assert.match(reconciliationSource, /row_counts_complete/);
assert.match(reconciliationSource, /audit_logs_by_action/);

console.log(
  "OK capacity production denial, provider-cost gate, redirect detection, reconciliation host isolation and complete scans",
);
