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

const baseUrl = requireEnv("KHATAONE_PHASE3_BASE_URL");
const expectedHost = requireEnv("KHATAONE_PHASE3_EXPECTED_HOST");
requireEnv("KHATAONE_PHASE3_SCENARIO");
requireEnv("KHATAONE_PHASE3_AUTH_COOKIE");

const productionHosts = new Set(["khataone.vercel.app"]);
let parsedBaseUrl;

try {
  parsedBaseUrl = new URL(baseUrl);
} catch {
  assert(false, "KHATAONE_PHASE3_BASE_URL must be a valid URL");
}

if (parsedBaseUrl) {
  assert(
    parsedBaseUrl.hostname === expectedHost,
    "Capacity URL hostname must exactly match KHATAONE_PHASE3_EXPECTED_HOST",
  );
  assert(
    parsedBaseUrl.protocol === "https:" &&
      parsedBaseUrl.origin === baseUrl.replace(/\/$/, ""),
    "Capacity URL must be the exact HTTPS origin without credentials, path, query, or fragment",
  );
  assert(
    !productionHosts.has(parsedBaseUrl.hostname),
    "Capacity tests must not target the production hostname",
  );
}

if (process.env.KHATAONE_PHASE3_ENABLE_WORKER_LOAD === "true") {
  requireEnv("JOB_RUNNER_SECRET");
  assert(
    process.env.KHATAONE_PHASE3_ALLOW_PROVIDER_COST === "true",
    "Worker load requires explicit provider-cost authorization",
  );
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const scenario = manifest.scenarios.find(
  (candidate) => candidate.id === process.env.KHATAONE_PHASE3_SCENARIO,
);

assert(Boolean(scenario), "KHATAONE_PHASE3_SCENARIO must exist in workload manifest");

const k6Check = spawnSync("k6", ["version"], {
  encoding: "utf8",
});

assert(k6Check.status === 0, "k6 must be installed and available on PATH");

if (!process.exitCode) {
  console.log("OK Phase 3 capacity preflight passed");
  console.log(`SCENARIO=${scenario.id}`);
  console.log(`TARGET_HOST=${expectedHost}`);
  console.log(
    `WORKER_LOAD=${process.env.KHATAONE_PHASE3_ENABLE_WORKER_LOAD === "true" ? "enabled" : "disabled"}`,
  );
}
