import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

function loadLocalEnv() {
  try {
    const env = readFileSync(".env.local", "utf8");

    for (const [key, value] of Object.entries(parseEnv(env))) {
      process.env[key] ??= value;
    }
  } catch {
    // CI and hosted runners can inject credentials directly.
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function slug(value) {
  return value.replace(/^\//, "").replaceAll("/", "-") || "dashboard";
}

async function waitForDashboard(page, route) {
  const response = await page.goto(new URL(route, baseUrl).toString(), {
    waitUntil: "domcontentloaded",
  });
  assert(response?.status() === 200, `${route} returned ${response?.status() ?? "no response"}`);
  assert(new URL(page.url()).pathname === route, `${route} redirected to ${page.url()}`);
  await page.locator("#dashboard-content").waitFor({ state: "visible", timeout: 30000 });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 30000 });
}

async function inspectPage(page, route, viewport) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const unnamed = Array.from(
      document.querySelectorAll("button, a, input, select, textarea"),
    ).filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) {
        return false;
      }

      if (element instanceof HTMLInputElement && element.type === "hidden") {
        return false;
      }

      const explicitName = element.getAttribute("aria-label")
        || element.getAttribute("aria-labelledby")
        || element.getAttribute("title")
        || element.textContent?.trim();
      const inputName = element instanceof HTMLInputElement
        || element instanceof HTMLSelectElement
        || element instanceof HTMLTextAreaElement
        ? element.labels?.length
        : false;

      return !explicitName && !inputName;
    }).map((element) => element.outerHTML.slice(0, 160));

    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      unnamed,
    };
  });

  assert(
    result.scrollWidth <= result.clientWidth + 1,
    `${route} overflows viewport ${viewport.name}: ${result.scrollWidth}px > ${result.clientWidth}px`,
  );
  assert(
    result.unnamed.length === 0,
    `${route} has unnamed controls at ${viewport.name}: ${result.unnamed.join(" | ")}`,
  );

  if (viewport.width <= 390) {
    const undersized = await page.locator("button:visible, input:visible, select:visible, textarea:visible").evaluateAll(
      (elements) => elements
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { label: element.getAttribute("aria-label") || element.textContent?.trim() || element.tagName, width: rect.width, height: rect.height };
        })
        .filter((item) => item.width < 44 || item.height < 44),
    );
    assert(
      undersized.length === 0,
      `${route} has mobile controls below 44px: ${JSON.stringify(undersized)}`,
    );
  }
}

async function verifyKeyboardBehavior(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForDashboard(page, "/dashboard");
  await page.locator("body").press("Home");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to dashboard content" });
  await skipLink.waitFor({ state: "visible" });
  await page.keyboard.press("Enter");
  assert(
    await page.locator("#dashboard-content").evaluate((element) => element === document.activeElement),
    "Skip link did not move focus to dashboard content",
  );

  const collapse = page.getByRole("button", { name: /Collapse sidebar/ });
  await collapse.click();
  const clientsLink = page.getByRole("navigation", { name: "Workspace" })
    .getByRole("link", { name: "Clients" });
  await clientsLink.focus();
  await page.getByRole("tooltip", { name: "Clients" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Expand sidebar/ }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.getByRole("button", { name: "Open workspace navigation" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Workspace navigation" });
  await dialog.waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert(await trigger.evaluate((element) => element === document.activeElement), "Mobile menu did not return focus to its trigger");

  await trigger.click();
  await dialog.click({ position: { x: 378, y: 300 } });
  await dialog.waitFor({ state: "hidden" });
}

loadLocalEnv();

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("FAIL setup: Playwright and Chromium are required");
  process.exit(1);
}

const baseUrl = new URL(requireEnv("LIVE_DASHBOARD_BASE_URL")).origin;
const email = requireEnv("LIVE_DASHBOARD_EMAIL");
const password = requireEnv("LIVE_DASHBOARD_PASSWORD");
const routes = [
  "/dashboard",
  "/dashboard/clients",
  "/dashboard/inbox",
  "/dashboard/review-queue",
  "/dashboard/ledger",
  "/dashboard/gst-summary",
  "/dashboard/reports",
  "/dashboard/exports",
  "/dashboard/audit-logs",
  "/dashboard/operations",
  "/dashboard/platform",
  "/dashboard/settings",
];
const viewports = [
  { name: "320x568", width: 320, height: 568 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
];
const outputDirectory = process.env.DASHBOARD_ACCESSIBILITY_OUTPUT
  ?? join(".codex-tmp", "dashboard-accessibility", new Date().toISOString().replaceAll(":", "-"));
mkdirSync(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: viewports[0] });
const page = await context.newPage();
const failures = [];

page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
page.on("response", (response) => {
  if (new URL(response.url()).origin === baseUrl && response.status() >= 500) {
    failures.push(`HTTP ${response.status()}: ${response.url()}`);
  }
});

try {
  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard(\/.*)?$/, { timeout: 30000 });

  await verifyKeyboardBehavior(page);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const route of routes) {
      await waitForDashboard(page, route);
      await inspectPage(page, route, viewport);
      await page.screenshot({
        path: join(outputDirectory, `${viewport.name}-${slug(route)}.png`),
        fullPage: true,
      });
      console.error(`OK ${viewport.name} ${route}`);
    }
  }

  await page.setViewportSize({ width: 720, height: 450 });
  await waitForDashboard(page, "/dashboard");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await inspectPage(page, "/dashboard at 200% CSS zoom", { name: "200%-zoom", width: 360, height: 225 });
  await page.screenshot({ path: join(outputDirectory, "200-percent-zoom-dashboard.png"), fullPage: true });

  assert(failures.length === 0, failures.join("\n"));
  const report = {
    checked_at: new Date().toISOString(),
    base_url: baseUrl,
    routes,
    viewports,
    keyboard_checks: ["skip_link", "collapsed_tooltip", "mobile_escape", "mobile_focus_return", "mobile_outside_click"],
    zoom_check: "200% CSS zoom stress check; manual browser-zoom confirmation still recommended",
    screenshots: outputDirectory,
  };
  writeFileSync(join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
