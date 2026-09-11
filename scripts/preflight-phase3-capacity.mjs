import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

function requireEnv(key) {
  const value = process.env[key];

  if (!value) {
    console.error(`FAIL setup: Missing ${key}`);
    process.exitCode = 2;
  }

  return value;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  }
}

if (
  process.env.KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_PHASE3_CAPACITY_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Set KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD=true and KHATAONE_PHASE3_CAPACITY_TARGET_LABEL=non-production for an authorized staging capacity test.",
  );
  process.exit(2);
}

const manifestPath =
  "audits/production-hardening/2026-09-11-phase-3/WORKLOAD_MANIFEST.json";
const k6ScriptPath =
  "audits/production-hardening/2026-09-11-phase-3/tests/k6/phase3-mixed-load.js";

assert(existsSync(manifestPath), "Phase 3 workload manifest must exist");
assert(existsSync(k6ScriptPath), "Phase 3 k6 load script must exist");

requireEnv("KHATAONE_PHASE3_BASE_URL");
requireEnv("KHATAONE_PHASE3_SCENARIO");
requireEnv("KHATAONE_PHASE3_AUTH_COOKIE");
requireEnv("JOB_RUNNER_SECRET");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const scenario = manifest.scenarios.find(
  (candidate) => candidate.id === process.env.KHATAONE_PHASE3_SCENARIO,
);

assert(Boolean(scenario), "KHATAONE_PHASE3_SCENARIO must exist in workload manifest");

const k6Check = spawnSync("k6", ["version"], {
  encoding: "utf8",
  shell: true,
});

assert(k6Check.status === 0, "k6 must be installed and available on PATH");

if (!process.exitCode) {
  console.log("OK Phase 3 capacity preflight passed");
  console.log(`SCENARIO=${scenario.id}`);
  console.log(`BASE_URL=${process.env.KHATAONE_PHASE3_BASE_URL}`);
}
