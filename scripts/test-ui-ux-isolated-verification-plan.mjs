import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const plan = readFileSync(
  "docs/audits/ui-ux/2026-09-13-diagnosis/ISOLATED_VERIFICATION_PLAN.md",
  "utf8",
);
const remediation = readFileSync("docs/UI-UX-Remediation-Plan.md", "utf8");
const runnerPath = "scripts/check-ui-ux-browser-matrix.mjs";
const runner = readFileSync(runnerPath, "utf8");
const findingIds = Array.from({ length: 27 }, (_, index) =>
  `KO-UX-${String(index + 1).padStart(3, "0")}`,
);

assert(existsSync(runnerPath), "Browser matrix runner must exist.");

for (const findingId of findingIds) {
  assert(
    plan.includes(`| ${findingId} |`),
    `Isolated verification plan must include ${findingId}.`,
  );
}

for (const required of [
  "two firms",
  "owner, admin, staff, viewer",
  "more than 50",
  "Asia/Kolkata",
  "320",
  "390",
  "768",
  "1024",
  "1280",
  "1440",
  "1920",
  "screen-reader",
  "foreign-firm evidence is denied",
  "no production mutations authorized",
  "no direct GST filing claim",
  "20260913110000_complete_dashboard_filtered_results.sql",
  "npm.cmd run verify:ui-ux-browser-matrix",
  "KHATAONE_UI_UX_STORAGE_STATE",
]) {
  assert(
    plan.includes(required),
    `Isolated verification plan is missing required gate: ${required}.`,
  );
}

for (const requiredRunnerContract of [
  "KHATAONE_UI_UX_BASE_URL",
  "KHATAONE_UI_UX_STORAGE_STATE",
  "Missing KHATAONE_UI_UX_STORAGE_STATE",
  "live_credentials_used: false",
  "production_data_used: false",
  "redaction_required",
]) {
  assert(
    runner.includes(requiredRunnerContract),
    `Browser matrix runner is missing safe contract: ${requiredRunnerContract}.`,
  );
}

assert(
  !runner.includes("LIVE_DASHBOARD_EMAIL") && !runner.includes("LIVE_DASHBOARD_PASSWORD"),
  "Runner must refuse live credential-based verification.",
);

assert(
  remediation.includes("Hosted verification") ||
    remediation.includes("hosted verification") ||
    remediation.includes("isolated fixtures"),
  "Remediation plan must keep hosted/isolated verification gates visible.",
);

const tempOutput = mkdtempSync(join(tmpdir(), "khataone-ui-ux-evidence-"));
const prepareResult = spawnSync(
  process.execPath,
  ["scripts/prepare-ui-ux-isolated-evidence.mjs", tempOutput],
  {
    cwd: process.cwd(),
    encoding: "utf8",
  },
);

try {
  assert(
    prepareResult.status === 0,
    `Evidence template initializer failed.\n${prepareResult.stderr}`,
  );

  const runSummary = JSON.parse(readFileSync(join(tempOutput, "run-summary.json"), "utf8"));
  const fixtureManifest = JSON.parse(
    readFileSync(join(tempOutput, "fixture-manifest.json"), "utf8"),
  );
  const browserMatrix = JSON.parse(readFileSync(join(tempOutput, "browser-matrix.json"), "utf8"));
  const consoleErrors = JSON.parse(readFileSync(join(tempOutput, "console-errors.json"), "utf8"));
  const findingResults = readFileSync(join(tempOutput, "finding-results.csv"), "utf8");

  assert(runSummary.environment.production_data_used === false, "Run summary must default away from production data.");
  assert(runSummary.environment.live_credentials_used === false, "Run summary must default away from live credentials.");
  assert(fixtureManifest.fixture_groups.length >= 9, "Fixture manifest must include all required fixture groups.");
  assert(browserMatrix.viewports.includes(1280), "Browser matrix must include the 1280px regression width.");
  assert(browserMatrix.authenticated_routes.includes("/dashboard/review-queue/[transactionId]"), "Browser matrix must include review detail.");
  assert(consoleErrors.redaction_required === true, "Console-error evidence must require redaction.");

  for (const findingId of findingIds) {
    assert(
      findingResults.includes(`"${findingId}","pending"`),
      `Finding CSV template must initialize ${findingId} as pending.`,
    );
  }
} finally {
  rmSync(tempOutput, { recursive: true, force: true });
}

console.log("UI/UX isolated verification plan contracts passed.");
