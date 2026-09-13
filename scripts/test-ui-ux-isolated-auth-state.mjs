import { existsSync, readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const helperPath = "scripts/create-ui-ux-isolated-auth-state.mjs";
const matrixPath = "scripts/check-ui-ux-browser-matrix.mjs";
const planPath = "docs/audits/ui-ux/2026-09-13-diagnosis/ISOLATED_VERIFICATION_PLAN.md";
const gitignore = readFileSync(".gitignore", "utf8");
const helper = readFileSync(helperPath, "utf8");
const matrix = readFileSync(matrixPath, "utf8");
const plan = readFileSync(planPath, "utf8");

assert(existsSync(helperPath), "Isolated auth-state helper must exist.");
assert(gitignore.includes(".codex-tmp/"), "Storage-state default output must remain ignored.");

for (const required of [
  "KHATAONE_UI_UX_ISOLATED_AUTH",
  "KHATAONE_UI_UX_AUTH_EMAIL",
  "KHATAONE_UI_UX_AUTH_PASSWORD",
  "KHATAONE_UI_UX_STORAGE_STATE_OUTPUT",
  "KHATAONE_UI_UX_ALLOW_NONLOCAL_ISOLATED_HOST",
  ".codex-tmp/ui-ux-isolated-auth/storage-state.json",
  "This helper refuses live-account capture by default",
  "live_credentials_used: false",
  "production_data_used: false",
  "context.storageState",
]) {
  assert(helper.includes(required), `Auth-state helper is missing safe contract: ${required}.`);
}

for (const forbidden of ["LIVE_DASHBOARD_EMAIL", "LIVE_DASHBOARD_PASSWORD"]) {
  assert(!helper.includes(forbidden), `Auth-state helper must not use ${forbidden}.`);
  assert(!matrix.includes(forbidden), `Browser matrix runner must not use ${forbidden}.`);
}

for (const documented of [
  "npm.cmd run create:ui-ux-auth-state",
  "KHATAONE_UI_UX_ISOLATED_AUTH",
  "KHATAONE_UI_UX_AUTH_EMAIL",
  "KHATAONE_UI_UX_AUTH_PASSWORD",
  "KHATAONE_UI_UX_STORAGE_STATE_OUTPUT",
]) {
  assert(plan.includes(documented), `Verification plan must document ${documented}.`);
}

console.log("UI/UX isolated auth-state helper contracts passed.");
