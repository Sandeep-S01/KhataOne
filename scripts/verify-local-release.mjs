import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  console.error("FAIL run this verifier through npm run verify:release-local");
  process.exit(2);
}

const npmCheck = (...args) => [process.execPath, [npmCli, ...args]];
const checks = [
  [process.execPath, ["scripts/preflight-local-release.mjs"]],
  npmCheck("run", "test:hardening"),
  npmCheck("run", "test:phase2-hardening"),
  npmCheck("run", "test:phase3-hardening"),
  npmCheck("run", "test:capacity-safety"),
  npmCheck("run", "test:security-boundaries"),
  npmCheck("run", "test:whatsapp-latency-baseline"),
  npmCheck("run", "test:provider-resilience"),
  npmCheck("run", "test:whatsapp-job-recovery"),
  npmCheck("run", "test:keyed-worker-pool"),
  npmCheck("run", "test:worker-ordering-leases"),
  npmCheck("run", "test:worker-observability"),
  npmCheck("run", "test:recovery-scheduler"),
  npmCheck("run", "test:dashboard-semantics"),
  npmCheck("run", "test:dashboard-workflows"),
  npmCheck("run", "test:dashboard-shared-components"),
  npmCheck("run", "test:dashboard-navigation-shell"),
  npmCheck("run", "test:dashboard-page-refinement"),
  npmCheck("run", "test:dashboard-responsive-harness"),
  [process.execPath, ["scripts/test-worker-input-policies.mjs"]],
  [process.execPath, ["scripts/test-gst-summary-atomic.mjs"]],
  [process.execPath, ["scripts/test-ledger-correction-atomic.mjs"]],
  [process.execPath, ["scripts/test-transaction-review-atomic.mjs"]],
  [process.execPath, ["scripts/test-controlled-audit-writers.mjs"]],
  npmCheck("run", "test:ai-job-recovery"),
  npmCheck("run", "test:ai-execution-bounds"),
  npmCheck("run", "test:protection-readiness"),
  npmCheck("run", "test:shared-rate-limits"),
  npmCheck("run", "test:performance"),
  npmCheck("run", "test:performance-tracing"),
  npmCheck("run", "test:performance-session"),
  [process.execPath, ["scripts/test-firm-context-recovery.mjs"]],
  [process.execPath, ["scripts/test-workspace-error-ui.mjs"]],
  npmCheck("audit", "--omit=dev", "--audit-level=moderate"),
  npmCheck("run", "verify"),
];

for (const [command, args] of checks) {
  console.log(`\nRUN ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    if (result.error) {
      console.error(result.error.message);
    }
    console.error(`FAIL local release verification stopped with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nOK full local release verification passed");
console.log("NOTICE external capacity, hosted migration, provider and tenant tests remain unverified");
