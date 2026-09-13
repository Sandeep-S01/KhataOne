import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const defaultEvidenceRoot =
  "docs/audits/ui-ux/2026-09-13-diagnosis/evidence/isolated-verification";
const evidenceRoot = process.env.KHATAONE_UI_UX_EVIDENCE_DIR ?? defaultEvidenceRoot;
const baseUrl = new URL(process.env.KHATAONE_UI_UX_BASE_URL ?? "http://localhost:3000");
const storageStatePath = process.env.KHATAONE_UI_UX_STORAGE_STATE;
const runAuthenticated = Boolean(storageStatePath);
const mobileHeight = 844;
const desktopHeight = 900;

const publicWidths = [390, 1440];
const dashboardWidths = [320, 390, 768, 1024, 1280, 1440, 1920];
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
const authenticatedRouteTemplates = [
  "/dashboard",
  "/dashboard/inbox",
  "/dashboard/review-queue",
  "/dashboard/review-queue/[transactionId]",
  "/dashboard/clients",
  "/dashboard/clients/[clientId]",
  "/dashboard/ledger",
  "/dashboard/ledger/[entryId]",
  "/dashboard/gst-summary",
  "/dashboard/gst-summary/[periodId]",
  "/dashboard/reports",
  "/dashboard/exports",
  "/dashboard/audit-logs",
  "/dashboard/operations",
  "/dashboard/settings",
];
const fixtureIds = {
  transactionId: { value: process.env.KHATAONE_UI_UX_TRANSACTION_ID, env: "KHATAONE_UI_UX_TRANSACTION_ID" },
  clientId: { value: process.env.KHATAONE_UI_UX_CLIENT_ID, env: "KHATAONE_UI_UX_CLIENT_ID" },
  entryId: { value: process.env.KHATAONE_UI_UX_LEDGER_ENTRY_ID, env: "KHATAONE_UI_UX_LEDGER_ENTRY_ID" },
  periodId: { value: process.env.KHATAONE_UI_UX_GST_PERIOD_ID, env: "KHATAONE_UI_UX_GST_PERIOD_ID" },
};
const publicClaimChecks = [
  {
    id: "no-direct-gst-ready-claim",
    passWhenAbsent: "India GST Ready",
  },
  {
    id: "gst-prep-boundary-present",
    passWhenPresent: "GST prep only",
  },
  {
    id: "record-level-confidence-present",
    passWhenPresent: "record-level confidence",
  },
];
const sensitivePatterns = [
  /https?:\/\/[^\s"'<>]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\b\+?\d[\d\s().-]{7,}\d\b/g,
  /(?:token|secret|password|apikey|api_key|authorization|bearer)\s*[:=]\s*[^\s,;}]+/gi,
];

function usage() {
  return [
    "UI/UX browser matrix runner",
    "Environment:",
    "  KHATAONE_UI_UX_BASE_URL=http://localhost:3000",
    "  KHATAONE_UI_UX_EVIDENCE_DIR=docs/audits/ui-ux/2026-09-13-diagnosis/evidence/isolated-verification",
    "  KHATAONE_UI_UX_STORAGE_STATE=path/to/playwright-storage-state.json for isolated authenticated checks only",
    "  KHATAONE_UI_UX_TRANSACTION_ID, KHATAONE_UI_UX_CLIENT_ID, KHATAONE_UI_UX_LEDGER_ENTRY_ID, KHATAONE_UI_UX_GST_PERIOD_ID for detail routes",
  ].join("\n");
}

function redact(value) {
  let output = String(value ?? "");
  for (const pattern of sensitivePatterns) {
    output = output.replace(pattern, "[redacted]");
  }
  return output.slice(0, 500);
}


function viewportFor(width) {
  return { width, height: width <= 390 ? mobileHeight : desktopHeight };
}

function resolveRoute(template) {
  let resolved = template;
  for (const [key, fixture] of Object.entries(fixtureIds)) {
    if (resolved.includes(`[${key}]`)) {
      if (!fixture.value) {
        return {
          route: template,
          resolvedRoute: null,
          blockedReason: `Missing isolated fixture env var ${fixture.env}`,
        };
      }
      resolved = resolved.replace(`[${key}]`, encodeURIComponent(fixture.value));
    }
  }
  return { route: template, resolvedRoute: resolved, blockedReason: null };
}

function writeJson(relativePath, data) {
  const path = join(evidenceRoot, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error(
      "Playwright is not available. Install project dependencies and Chromium before running this matrix.",
    );
  }
}

async function inspectPage(page, { authRequired, route, resolvedRoute, width }) {
  const consoleEntries = [];
  const errors = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleEntries.push({
        type: message.type(),
        route,
        viewport: width,
        text: redact(message.text()),
      });
    }
  });
  page.on("pageerror", (error) => {
    errors.push(redact(error.message));
    consoleEntries.push({ type: "pageerror", route, viewport: width, text: redact(error.message) });
  });

  const target = new URL(resolvedRoute, baseUrl).toString();
  const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("body").waitFor({ timeout: 30000 });

  const metrics = await page.evaluate(({ mobileWidth, route, checks }) => {
    const root = document.documentElement;
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < window.innerWidth && rect.top < window.innerHeight;
    };
    const nameFor = (element) => {
      const ariaLabel = element.getAttribute("aria-label");
      const ariaLabelledBy = element.getAttribute("aria-labelledby");
      const title = element.getAttribute("title");
      const text = element.textContent?.trim();
      const labelledInput = element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement
        ? Array.from(element.labels ?? []).some((label) => label.textContent?.trim())
        : false;
      return ariaLabel || ariaLabelledBy || title || text || (labelledInput ? "labelled-field" : "");
    };
    const interactive = Array.from(document.querySelectorAll("button, a, input, select, textarea, [role='button'], [role='link']"))
      .filter((element) => visible(element) && !(element instanceof HTMLInputElement && element.type === "hidden"));
    const unnamedInteractiveControls = interactive
      .filter((element) => !nameFor(element))
      .map((element) => ({ tag: element.tagName.toLowerCase(), inputType: element.getAttribute("type") ?? null }));
    const controlsBelow44px = mobileWidth
      ? interactive
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            role: element.getAttribute("role"),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            hasName: Boolean(nameFor(element)),
          };
        })
        .filter((item) => item.width < 44 || item.height < 44)
      : [];
    const bodyText = document.body.innerText;
    const publicClaims = route === "/" ? checks.map((check) => {
      if (check.passWhenAbsent) {
        return { id: check.id, passed: !bodyText.includes(check.passWhenAbsent) };
      }
      return { id: check.id, passed: bodyText.includes(check.passWhenPresent) };
    }) : [];

    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      unnamedInteractiveControls,
      controlsBelow44px,
      publicClaims,
      headingCount: document.querySelectorAll("h1").length,
    };
  }, { mobileWidth: width <= 390, route, checks: authRequired ? [] : publicClaimChecks });

  const statusCode = response?.status() ?? null;
  const redirectedPath = new URL(page.url()).pathname;
  const publicClaimFailed = metrics.publicClaims.some((check) => !check.passed);
  const failed = statusCode === null || statusCode >= 500 || metrics.horizontalOverflow || metrics.unnamedInteractiveControls.length > 0 || metrics.controlsBelow44px.length > 0 || publicClaimFailed || errors.length > 0;

  return {
    result: {
      route,
      resolvedRoute,
      viewport: width,
      authRequired,
      status: failed ? "fail" : "pass",
      statusCode,
      finalPath: redirectedPath,
      measurements: metrics,
      notes: authRequired ? ["Authenticated route checked with supplied isolated storage state."] : [],
    },
    consoleEntries,
  };
}

async function run() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
    return;
  }

  mkdirSync(evidenceRoot, { recursive: true });
  if (storageStatePath && !existsSync(storageStatePath)) {
    throw new Error(`KHATAONE_UI_UX_STORAGE_STATE does not exist: ${storageStatePath}`);
  }

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const consoleEntries = [];
  let browserVersion = null;

  try {
    browserVersion = browser.version();

    for (const route of publicRoutes) {
      for (const width of publicWidths) {
        const context = await browser.newContext({ viewport: viewportFor(width) });
        const page = await context.newPage();
        try {
          const inspected = await inspectPage(page, {
            authRequired: false,
            route,
            resolvedRoute: route,
            width,
          });
          results.push(inspected.result);
          consoleEntries.push(...inspected.consoleEntries);
          console.error(`${inspected.result.status.toUpperCase()} ${width}px ${route}`);
        } catch (error) {
          results.push({
            route,
            resolvedRoute: route,
            viewport: width,
            authRequired: false,
            status: "fail",
            failure: redact(error.message),
          });
          console.error(`FAIL ${width}px ${route}: ${redact(error.message)}`);
        } finally {
          await context.close();
        }
      }
    }

    for (const template of authenticatedRouteTemplates) {
      const resolved = resolveRoute(template);
      for (const width of dashboardWidths) {
        if (!runAuthenticated || resolved.blockedReason) {
          results.push({
            route: template,
            resolvedRoute: resolved.resolvedRoute,
            viewport: width,
            authRequired: true,
            status: "blocked",
            blockedReason: !runAuthenticated
              ? "Missing KHATAONE_UI_UX_STORAGE_STATE for an isolated authenticated workspace. Live credentials are not used by this runner."
              : resolved.blockedReason,
          });
          continue;
        }

        const context = await browser.newContext({
          viewport: viewportFor(width),
          storageState: resolve(storageStatePath),
        });
        const page = await context.newPage();
        try {
          const inspected = await inspectPage(page, {
            authRequired: true,
            route: template,
            resolvedRoute: resolved.resolvedRoute,
            width,
          });
          results.push(inspected.result);
          consoleEntries.push(...inspected.consoleEntries);
          console.error(`${inspected.result.status.toUpperCase()} ${width}px ${template}`);
        } catch (error) {
          results.push({
            route: template,
            resolvedRoute: resolved.resolvedRoute,
            viewport: width,
            authRequired: true,
            status: "fail",
            failure: redact(error.message),
          });
          console.error(`FAIL ${width}px ${template}: ${redact(error.message)}`);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  const summary = {
    status: results.some((result) => result.status === "fail") ? "failed" : results.some((result) => result.status === "blocked") ? "blocked" : "passed",
    checked_at: new Date().toISOString(),
    base_url: baseUrl.origin,
    browser: "chromium",
    browser_version: browserVersion,
    authenticated_checks: runAuthenticated ? "attempted-with-storage-state" : "blocked-missing-isolated-storage-state",
    production_data_used: false,
    live_credentials_used: false,
    route_count: results.length,
    passed: results.filter((result) => result.status === "pass").length,
    failed: results.filter((result) => result.status === "fail").length,
    blocked: results.filter((result) => result.status === "blocked").length,
    public_routes: publicRoutes,
    authenticated_routes: authenticatedRouteTemplates,
    viewports: dashboardWidths,
    results,
    safety_notes: [
      "This runner records measurements, counts and redacted console messages only.",
      "Authenticated checks require a Playwright storage-state file from an isolated workspace.",
      "Do not pass live user credentials or production fixture identifiers to this script.",
    ],
  };

  writeJson("browser-matrix.json", summary);
  writeJson("console-errors.json", {
    status: consoleEntries.length > 0 ? "review" : "pass",
    redaction_required: true,
    entries: consoleEntries,
  });

  console.log(JSON.stringify({
    evidence_dir: evidenceRoot,
    status: summary.status,
    passed: summary.passed,
    failed: summary.failed,
    blocked: summary.blocked,
  }, null, 2));

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(`FAIL setup: ${redact(error.message)}`);
  process.exit(1);
});
