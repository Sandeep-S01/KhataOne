import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const baseUrl = new URL(process.env.KHATAONE_UI_UX_BASE_URL ?? "http://localhost:3000");
const email = process.env.KHATAONE_UI_UX_AUTH_EMAIL;
const password = process.env.KHATAONE_UI_UX_AUTH_PASSWORD;
const outputPath = process.env.KHATAONE_UI_UX_STORAGE_STATE_OUTPUT
  ?? ".codex-tmp/ui-ux-isolated-auth/storage-state.json";
const isolatedFlag = process.env.KHATAONE_UI_UX_ISOLATED_AUTH === "1";

function redact(value) {
  return String(value ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[redacted-url]")
    .replace(/(?:token|secret|password|apikey|api_key|authorization|bearer)\s*[:=]\s*[^\s,;}]+/gi, "[redacted-secret]")
    .slice(0, 500);
}

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("Playwright is not available. Install project dependencies and Chromium before capturing an isolated auth state.");
  }
}

function assertIsolatedContract() {
  if (!isolatedFlag) {
    throw new Error("Set KHATAONE_UI_UX_ISOLATED_AUTH=1 only for a disposable local/staging workspace. This helper refuses live-account capture by default.");
  }

  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("KHATAONE_UI_UX_BASE_URL must be http or https.");
  }

  const host = baseUrl.hostname.toLowerCase();
  const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
  const looksIsolatedHost = localHosts.has(host)
    || host.includes("staging")
    || host.includes("preview")
    || host.includes("test")
    || host.includes("localhost");

  if (!looksIsolatedHost && process.env.KHATAONE_UI_UX_ALLOW_NONLOCAL_ISOLATED_HOST !== "1") {
    throw new Error("Base URL does not look local, preview, staging or test. Set KHATAONE_UI_UX_ALLOW_NONLOCAL_ISOLATED_HOST=1 only after confirming the workspace is disposable.");
  }
}

async function run() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log([
      "Capture a Playwright storage-state file for isolated UI/UX dashboard verification.",
      "Required environment:",
      "  KHATAONE_UI_UX_ISOLATED_AUTH=1",
      "  KHATAONE_UI_UX_BASE_URL=http://localhost:3000",
      "  KHATAONE_UI_UX_AUTH_EMAIL=<disposable test account>",
      "  KHATAONE_UI_UX_AUTH_PASSWORD=<disposable test password>",
      "Optional:",
      "  KHATAONE_UI_UX_STORAGE_STATE_OUTPUT=.codex-tmp/ui-ux-isolated-auth/storage-state.json",
      "  KHATAONE_UI_UX_ALLOW_NONLOCAL_ISOLATED_HOST=1 for a confirmed disposable remote test host",
    ].join("\n"));
    return;
  }

  assertIsolatedContract();
  const authEmail = requireEnv("KHATAONE_UI_UX_AUTH_EMAIL", email);
  const authPassword = requireEnv("KHATAONE_UI_UX_AUTH_PASSWORD", password);
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleEntries = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleEntries.push({ type: message.type(), text: redact(message.text()) });
    }
  });

  try {
    await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator('input[name="email"]').fill(authEmail);
    await page.locator('input[name="password"]').fill(authPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard(\/.*)?$|\/onboarding(\/.*)?$/, { timeout: 30000 });

    const finalPath = new URL(page.url()).pathname;
    if (!finalPath.startsWith("/dashboard") && !finalPath.startsWith("/onboarding")) {
      throw new Error(`Login did not reach an authenticated app route; final path was ${finalPath}`);
    }

    mkdirSync(dirname(outputPath), { recursive: true });
    await context.storageState({ path: outputPath });
    writeFileSync(`${outputPath}.meta.json`, `${JSON.stringify({
      created_at: new Date().toISOString(),
      base_url: baseUrl.origin,
      final_path: finalPath,
      isolated_auth_confirmed: true,
      live_credentials_used: false,
      production_data_used: false,
      state_file: outputPath,
      console_entries: consoleEntries,
      next_step: `Set KHATAONE_UI_UX_STORAGE_STATE=${resolve(outputPath)} and run npm.cmd run verify:ui-ux-browser-matrix`,
    }, null, 2)}\n`);

    console.log(JSON.stringify({
      status: "created",
      storage_state: resolve(outputPath),
      metadata: resolve(`${outputPath}.meta.json`),
      final_path: finalPath,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(`FAIL setup: ${redact(error.message)}`);
  process.exit(1);
});
