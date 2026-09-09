import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

function loadLocalEnv() {
  try {
    const env = readFileSync(".env.local", "utf8");

    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      process.env[key] ??= valueParts.join("=");
    }
  } catch {
    // CI and live runners can inject environment variables directly.
  }
}

function requireEnv(key) {
  const value = process.env[key];

  if (!value) {
    console.error(`FAIL setup: Missing required environment variable: ${key}`);
    process.exit(1);
  }

  return value;
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    console.error(
      "FAIL setup: Playwright is not installed. Install it in the runner with `npm install -D playwright` and `npx playwright install chromium`.",
    );
    process.exit(1);
  }
}

async function waitForShellReady(page) {
  await page.waitForURL(/\/dashboard(\/.*)?$/, { timeout: 30000 });
  await page.locator("body").waitFor({ timeout: 30000 });
}

async function waitForListReady(page) {
  await page
    .locator("table, [data-dashboard-ready], text=/No .* yet|No .* match/i")
    .first()
    .waitFor({ timeout: 30000 });
}

async function measureNavigation(page, href) {
  const started = performance.now();
  await page.click(`a[href="${href}"]`);
  await page.waitForURL(new RegExp(`${href.replaceAll("/", "\\/")}(\\?.*)?$`), {
    timeout: 30000,
  });
  await waitForListReady(page);

  return Math.round(performance.now() - started);
}

loadLocalEnv();

const { chromium } = await loadPlaywright();
const baseUrl =
  process.env.LIVE_DASHBOARD_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://khataone.vercel.app";
const email = requireEnv("LIVE_DASHBOARD_EMAIL");
const password = requireEnv("LIVE_DASHBOARD_PASSWORD");
const sampleCount = Number(process.env.DASHBOARD_BROWSER_SAMPLE_COUNT ?? 3);
const routes = [
  "/dashboard/clients",
  "/dashboard/ledger",
  "/dashboard/review-queue",
  "/dashboard/inbox",
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(new URL("/login", baseUrl).toString(), {
    waitUntil: "domcontentloaded",
  });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await waitForShellReady(page);

  const results = [];

  for (const route of routes) {
    const durations = [];

    for (let index = 0; index < sampleCount; index += 1) {
      await page.goto(new URL("/dashboard", baseUrl).toString(), {
        waitUntil: "domcontentloaded",
      });
      await waitForShellReady(page);
      durations.push(await measureNavigation(page, route));
    }

    durations.sort((a, b) => a - b);
    results.push({
      route,
      samples_ms: durations,
      p50_ms: durations[Math.floor(durations.length / 2)],
      max_ms: durations.at(-1),
    });
  }

  console.log(
    JSON.stringify(
      {
        base_url: baseUrl,
        sample_count: sampleCount,
        measured_at: new Date().toISOString(),
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
