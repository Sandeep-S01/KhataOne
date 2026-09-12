import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function requireFile(path) {
  if (!existsSync(path)) {
    fail(`missing release file: ${path}`);
    return "";
  }

  return readFileSync(path, "utf8");
}

function requireText(path, expected) {
  const source = requireFile(path);
  if (source && !source.includes(expected)) {
    fail(`${path} must reference ${expected}`);
  }
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });
}

const orderedMigrations = [
  "20260912100000_protect_worker_inputs.sql",
  "20260912110000_atomic_gst_summary.sql",
  "20260912120000_atomic_ledger_correction.sql",
  "20260912125000_restore_legacy_approval_metadata.sql",
  "20260912130000_preserve_ledger_corrections_on_reapproval.sql",
  "20260912135000_backfill_missing_ledger_handoffs.sql",
  "20260912140000_protect_posted_transaction_lifecycle.sql",
  "20260912150000_atomic_transaction_review_mutations.sql",
  "20260912160000_control_transaction_clarification_and_writes.sql",
  "20260912170000_control_dashboard_audit_writers.sql",
  "20260912180000_recover_ai_extraction_jobs.sql",
  "20260912190000_add_shared_rate_limits.sql",
];

for (const migration of orderedMigrations) {
  requireFile(`supabase/migrations/${migration}`);
}

const sortedMigrations = [...orderedMigrations].sort();
if (orderedMigrations.join("\n") !== sortedMigrations.join("\n")) {
  fail("prepared hardening migrations must remain in chronological order");
}

const rpcCouplings = [
  ["src/app/actions/gst.ts", "generate_gst_summary"],
  ["src/app/actions/ledger.ts", "correct_ledger_entry"],
  ["src/app/actions/review.ts", "update_transaction_review"],
  ["src/app/actions/review.ts", "decide_transaction_review"],
  ["src/app/actions/review.ts", "request_transaction_clarification"],
  ["src/app/actions/review.ts", "record_transaction_clarification_delivery"],
  ["src/app/actions/clients.ts", "create_dashboard_client"],
  ["src/app/actions/clients.ts", "update_dashboard_client"],
  ["src/app/actions/clients.ts", "archive_dashboard_client"],
  ["src/app/actions/exports.ts", "queue_dashboard_export"],
  ["src/app/actions/operations.ts", "request_manual_job_run"],
  ["src/lib/rate-limit.ts", "consume_rate_limit"],
];

for (const [path, rpc] of rpcCouplings) {
  requireText(path, rpc);
}

const vercelConfig = JSON.parse(requireFile("vercel.json") || "{}");
if (!Array.isArray(vercelConfig.regions) || !vercelConfig.regions.includes("hnd1")) {
  fail("vercel.json must retain the hnd1 runtime region");
}

const expectedCronPaths = [
  "/api/jobs/ai-extraction/run-queued",
  "/api/jobs/exports/run-queued",
  "/api/jobs/whatsapp-ingestion/run-queued",
];
const actualCronPaths = (vercelConfig.crons || []).map((cron) => cron.path).sort();
if (actualCronPaths.join("\n") !== expectedCronPaths.sort().join("\n")) {
  fail("vercel.json must retain all three protected worker cron routes");
}

const packageJson = JSON.parse(requireFile("package.json") || "{}");
for (const script of [
  "verify",
  "test:hardening",
  "test:phase2-hardening",
  "test:phase3-hardening",
  "test:capacity-safety",
  "test:security-boundaries",
  "test:protection-readiness",
  "test:shared-rate-limits",
]) {
  if (!packageJson.scripts?.[script]) {
    fail(`package.json is missing ${script}`);
  }
}

const trackedSecrets = run("git", [
  "ls-files",
  ".env",
  ".env.local",
  "*.pem",
  "*.key",
]);
if (trackedSecrets.status !== 0) {
  fail("unable to inspect tracked secret files");
} else if (trackedSecrets.stdout.trim()) {
  fail("a local environment or private-key file is tracked by Git");
}

const whitespace = run("git", ["diff", "--check"]);
if (whitespace.status !== 0) {
  process.stderr.write(whitespace.stdout);
  process.stderr.write(whitespace.stderr);
  fail("git diff contains whitespace errors");
}

const conflicts = run("rg", [
  "-n",
  "^(<<<<<<<|=======|>>>>>>>)",
  "src",
  "scripts",
  "supabase",
  ".github",
  "docs",
  "--glob",
  "!docs/performance/*.json",
]);
if (conflicts.status === 0) {
  process.stderr.write(conflicts.stdout);
  fail("unresolved conflict markers found");
} else if (conflicts.status !== 1) {
  process.stderr.write(conflicts.stderr);
  fail("unable to scan for conflict markers");
}

if (!process.exitCode) {
  console.log("OK local release structure, migration coupling, deployment config and repository hygiene");
  console.log("NOTICE capacity certification remains waived/unverified for this release review");
}
