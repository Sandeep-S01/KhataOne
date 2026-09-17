import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { parseEnv } from "node:util";
import { captureRequestTiming, captureResponseEvidence } from "./dashboard-response-evidence.mjs";
import { installRowProbe } from "./dashboard-row-probe.mjs";
import { installFeedbackProbe } from "./dashboard-feedback-probe.mjs";

function loadLocalEnv() {
  try {
    const env = readFileSync(".env.local", "utf8");

    for (const [key, value] of Object.entries(parseEnv(env))) process.env[key] ??= value;
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

const tableNames = {
  "/dashboard/clients": "Client workspaces",
  "/dashboard/ledger": "Ledger handoff entries",
  "/dashboard/review-queue": "Review queue transactions",
  "/dashboard/inbox": "WhatsApp inbox records",
  "/dashboard": "Latest review queue records",
};

async function waitForListReady(page, route) {
  // Populated-data benchmark: an old table, skeleton or query error cannot pass.
  await page
    .getByRole("region", { name: tableNames[route], exact: true })
    .locator("tbody tr")
    .first()
    .waitFor({ timeout: 30000 });
}

async function measureNavigation(page, href) {
  const mobileMenu = page.getByRole("button", { name: "Open workspace navigation", exact: true });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  await page.evaluate(installRowProbe, { href, tableName: tableNames[href] });
  const started = performance.now();
  const startedUnixMs = Date.now();
  await page.getByRole("navigation", { name: "Workspace", exact: true })
    .locator(`a[href="${href}"]`).first().click();
  await page.waitForURL(new RegExp(`${href.replaceAll("/", "\\/")}(\\?.*)?$`), {
    timeout: 30000,
  });
  await waitForListReady(page, href);

  return {
    started_unix_ms: startedUnixMs,
    rows_observed_unix_ms: Date.now(),
    automation_ms: Math.round(performance.now() - started),
    visible_dom: await page.evaluate(() => window.__khataoneRowProbe ?? null),
    browser_click_ms: await page.evaluate(() => window.__khataoneClickTime === null
      ? null : Math.round(performance.now() - window.__khataoneClickTime)),
  };
}

loadLocalEnv();

const { chromium } = await loadPlaywright();
const baseUrl = new URL(requireEnv("LIVE_DASHBOARD_BASE_URL")).origin;
const email = requireEnv("LIVE_DASHBOARD_EMAIL");
const password = requireEnv("LIVE_DASHBOARD_PASSWORD");
const sampleCount = Number(process.env.DASHBOARD_BROWSER_SAMPLE_COUNT ?? 3);
if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 100) {
  throw new Error("DASHBOARD_BROWSER_SAMPLE_COUNT must be an integer from 1 to 100");
}
const routes = (process.env.DASHBOARD_BROWSER_ROUTES ?? "/dashboard/review-queue").split(",");
if (routes.some((route) => !(route in tableNames) || route === "/dashboard")) {
  throw new Error("Routes must be supported dashboard list paths, excluding the overview");
}
const sourceRoute = process.env.DASHBOARD_BROWSER_SOURCE_ROUTE ?? "/dashboard";
if (!(sourceRoute in tableNames) || routes.includes(sourceRoute)) {
  throw new Error("Source must be a supported route distinct from each destination");
}
const includeFilters = process.env.DASHBOARD_BROWSER_INCLUDE_FILTERS === "1";
if (includeFilters && !routes.includes("/dashboard/review-queue")) {
  throw new Error("Filter timing currently requires /dashboard/review-queue in DASHBOARD_BROWSER_ROUTES");
}

function summarize(samples) {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  return { samples_ms: samples, p50_ms: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95_ms: sorted[Math.ceil(sorted.length * 0.95) - 1], max_ms: sorted.at(-1) };
}

function classifyFailure(error) {
  if (error?.name === "TimeoutError") return "timeout";
  if (error?.name === "TargetClosedError") return "browser_closed";
  if (error?.message === "Dashboard request failed or redirected; refusing to record a latency sample") {
    return "response_or_redirect";
  }
  return "other";
}

async function measureReviewFilters(page) {
  const result = { status: "failed", failure_phase: "prepare", failure_kind: "other" };
  try {
    await page.goto(new URL("/dashboard/review-queue", baseUrl).toString());
    await waitForListReady(page, "/dashboard/review-queue");
    // This impossible fixture term exercises the empty result without recording
    // client names or sending private search text to the diagnostic report.
    const term = `khataone_perf_nomatch_${Date.now()}`;
    await page.getByLabel("Search", { exact: true }).fill(term);
    await page.evaluate(installFeedbackProbe, { tagName: "button", label: "Apply" });
    result.failure_phase = "apply";
    activeTrial = { destination: "/dashboard/review-queue", sample: 0, phase: "filter_apply" };
    const applyStarted = performance.now();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    result.failure_step = "apply_url";
    await page.waitForURL((url) => url.pathname === "/dashboard/review-queue" && url.searchParams.get("q") === term);
    result.failure_step = "apply_empty_state";
    // The existing page can use either empty copy after a successful zero-row query.
    const emptyTitle = page.getByRole("heading", { name: /No review items (match these filters|yet)/ });
    await emptyTitle.waitFor();
    result.empty_state_kind = await emptyTitle.textContent() === "No review items yet"
      ? "generic" : "filtered";
    result.apply_to_empty_ms = Math.round(performance.now() - applyStarted);
    result.apply_feedback_ms = await page.evaluate(() => window.__khataoneFeedbackProbe?.feedback_ms ?? null);

    await page.evaluate(installFeedbackProbe, { tagName: "a", label: "Clear" });
    result.failure_phase = "clear";
    activeTrial = { destination: "/dashboard/review-queue", sample: 0, phase: "filter_clear" };
    const clearStarted = performance.now();
    await page.getByRole("link", { name: "Clear", exact: true }).click();
    result.failure_step = "clear_url";
    await page.waitForURL((url) => url.pathname === "/dashboard/review-queue" && !url.search);
    result.failure_step = "clear_rows";
    await waitForListReady(page, "/dashboard/review-queue");
    result.clear_to_rows_ms = Math.round(performance.now() - clearStarted);
    result.clear_feedback_ms = await page.evaluate(() => window.__khataoneFeedbackProbe?.feedback_ms ?? null);
    result.status = "completed";
    delete result.failure_phase;
    delete result.failure_kind;
    delete result.failure_step;
  } catch (error) {
    result.failure_kind = classifyFailure(error);
  }
  return result;
}

const browser = await chromium.launch({ headless: true });
const profileName = process.env.DASHBOARD_BROWSER_PROFILE ?? "desktop";
const profiles = {
  desktop: { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  "mobile-constrained": { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};
if (!Object.hasOwn(profiles, profileName)) {
  await browser.close();
  throw new Error("DASHBOARD_BROWSER_PROFILE must be desktop, mobile, or mobile-constrained");
}
const page = await browser.newPage(profiles[profileName]);
if (profileName === "mobile-constrained") {
  const networkSession = await page.context().newCDPSession(page);
  await networkSession.send("Network.enable");
  await networkSession.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
  });
  await networkSession.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}
const protectionCookieFile = process.env.DASHBOARD_PROTECTION_COOKIE_FILE;
if (protectionCookieFile) {
  const cookies = readFileSync(protectionCookieFile, "utf8").split(/\r?\n/)
    .filter((line) => line && (!line.startsWith("#") || line.startsWith("#HttpOnly_")))
    .map((line) => line.replace(/^#HttpOnly_/, "").split("\t"))
    .filter(([domain, , , , , name]) => domain === new URL(baseUrl).hostname && name === "_vercel_jwt")
    .map(([, , , , , name, value]) => ({ name, value, url: baseUrl, httpOnly: true, secure: true }));
  if (!cookies.length) throw new Error("No matching Vercel protection cookie in supplied cookie file");
  await page.context().addCookies(cookies);
}
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
if (bypass) {
  // Restrict deployment-protection credentials to this exact origin.
  await page.route(`${baseUrl}/**`, (route) => route.continue({
    headers: { ...route.request().headers(), "x-vercel-protection-bypass": bypass },
  }));
}
await page.addInitScript(() => {
  window.__khataoneLongTasks = [];
  if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
    new PerformanceObserver((list) => {
      window.__khataoneLongTasks.push(...list.getEntries().map(({ startTime, duration }) => ({ startTime, duration })));
    }).observe({ type: "longtask", buffered: true });
  }
});
const requests = [];
const requestRecords = new WeakMap();
const pendingResponseEvidence = new Set();
let activeTrial = null;
let measuring = false;
page.on("request", (request) => {
  if (!measuring || new URL(request.url()).origin !== baseUrl) return;
  const path = new URL(request.url()).pathname;
  if (!(path in tableNames)) return;
  const headers = request.headers();
  const record = { sequence: requests.length + 1, observed_unix_ms: Date.now(), trial: activeTrial, route: path, kind: headers["next-router-prefetch"] === "1"
    ? headers["next-router-segment-prefetch"] === "/_tree" ? "tree_prefetch" : "prefetch"
    : headers.rsc === "1" ? "client_navigation" : "document", method: request.method() };
  requests.push(record);
  requestRecords.set(request, record);
});
page.on("response", (response) => {
  captureResponseEvidence(response, requestRecords.get(response.request()), pendingResponseEvidence);
});
page.on("requestfinished", (request) => {
  captureRequestTiming(request, requestRecords.get(request));
});
page.on("requestfailed", (request) => {
  const record = requestRecords.get(request);
  if (record) {
    record.network_failed = true;
    captureRequestTiming(request, record);
  }
});

try {
  await page.goto(new URL("/login", baseUrl).toString(), {
    waitUntil: "domcontentloaded",
  });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await waitForShellReady(page);

  const results = [];
  const cpuEvents = [];
  const cdp = process.env.DASHBOARD_BROWSER_CPU_TRACE === "1"
    ? await page.context().newCDPSession(page) : null;
  if (cdp) {
    cdp.on("Tracing.dataCollected", ({ value }) => {
      for (const event of value) {
        if (event.ph === "X" && ["RunTask", "EvaluateScript", "FunctionCall", "Layout", "UpdateLayoutTree", "Paint"].includes(event.name)) {
          // Deliberately exclude event args, URLs, stacks and document content.
          cpuEvents.push({ name: event.name, ts: event.ts, dur: event.dur, pid: event.pid, tid: event.tid, ph: "X" });
        }
      }
    });
    await cdp.send("Tracing.start", { categories: "devtools.timeline", transferMode: "ReportEvents" });
  }

  for (const route of routes) {
    const durations = [];
    const actualClicks = [];
    const documents = [];
    const useful = [];
    const responseEvidence = [];
    const longTasks = [];
    const trials = [];
    const attempts = [];

    // Warm the destination; first access is not included in warm percentiles.
    // Record setup failures rather than silently producing a successful report.
    try {
      await page.goto(new URL(route, baseUrl).toString());
      await waitForListReady(page, route);
    } catch (error) {
      results.push({ route, source_route: sourceRoute, warmup: {
        status: "failed", failure_kind: classifyFailure(error),
      }, attempted_samples: 0, completed_samples: 0, failed_samples: 0,
        attempts: [], trials: [], click_to_rows: null, hard_navigation_to_rows: null,
        filter_interactions: null });
      continue;
    }
    measuring = true;

    for (let index = 0; index < sampleCount; index += 1) {
      const attempt = { sample: index + 1, status: "failed", failure_phase: "hard_navigation", failure_kind: "other" };
      attempts.push(attempt);
      try {
        activeTrial = { destination: route, sample: index + 1, phase: "hard_navigation" };
        await page.waitForTimeout(2000);
        await page.evaluate(() => { window.__khataonePreviousDocument = true; });
        const started = performance.now();
        const hardStartedUnixMs = Date.now();
        const response = await page.goto(new URL(route, baseUrl).toString(), { waitUntil: "commit" });
        if (!response || response.status() !== 200 || new URL(page.url()).pathname !== route) {
          throw new Error("Dashboard request failed or redirected; refusing to record a latency sample");
        }
        await page.waitForFunction(() => !window.__khataonePreviousDocument);
        await waitForListReady(page, route);
        const hardDuration = Math.round(performance.now() - started);
        const hardRowsUnixMs = Date.now();
        const navigation = await page.evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0];
          const finalHeaders = nav.finalResponseHeadersStart || nav.responseStart;
          return { waiting: finalHeaders - nav.requestStart,
            ttfb: finalHeaders - nav.startTime,
            first_response_start: nav.responseStart,
            final_response_headers_start: nav.finalResponseHeadersStart ?? null,
            first_interim_response_start: nav.firstInterimResponseStart ?? null,
            long_tasks: window.__khataoneLongTasks };
        });
        const headers = await response.allHeaders();
        const responseRecord = { vercel_id: headers["x-vercel-id"] ?? null,
          request_id: headers["x-khataone-perf-id"] ?? null,
          cache_control: headers["cache-control"] ?? null,
          server_timing: headers["server-timing"] ?? null };
        activeTrial = { destination: route, sample: index + 1, phase: "source_navigation" };
        await page.goto(new URL(sourceRoute, baseUrl).toString(), {
          waitUntil: "domcontentloaded",
        });
        await waitForShellReady(page);
        await waitForListReady(page, sourceRoute);
        await page.waitForTimeout(2000);
        const browserStart = await page.evaluate(() => performance.now());
        activeTrial = { destination: route, sample: index + 1, phase: "click_navigation" };
        const click = await measureNavigation(page, route);
        const clickLongTasks = await page.evaluate((start) => window.__khataoneLongTasks.filter((task) => task.startTime >= start), browserStart);

        // A sample is complete only when both navigations reach current rows.
        useful.push(hardDuration);
        documents.push(navigation);
        responseEvidence.push(responseRecord);
        trials.push({ sample: index + 1, hard_started_unix_ms: hardStartedUnixMs,
          hard_rows_observed_unix_ms: hardRowsUnixMs, click });
        durations.push(click.automation_ms);
        actualClicks.push(click.browser_click_ms);
        longTasks.push(clickLongTasks);
        attempt.status = "completed";
        delete attempt.failure_phase;
        delete attempt.failure_kind;
        console.error(`Measured ${route}: sample ${index + 1}/${sampleCount}`);
      } catch (error) {
        attempt.failure_phase = activeTrial?.phase ?? "unknown";
        attempt.failure_kind = classifyFailure(error);
        console.error(`Failed ${route}: sample ${index + 1}/${sampleCount} (${attempt.failure_phase}, ${attempt.failure_kind})`);
      }
    }

    measuring = false;
    activeTrial = null;
    let filterInteractions = null;
    if (includeFilters && route === "/dashboard/review-queue") {
      measuring = true;
      activeTrial = { destination: route, sample: 0, phase: "filter_prepare" };
      filterInteractions = await measureReviewFilters(page);
      measuring = false;
      activeTrial = null;
    }
    results.push({
      route,
      source_route: sourceRoute,
      warmup: { status: "completed" },
      attempted_samples: attempts.length,
      completed_samples: trials.length,
      failed_samples: attempts.length - trials.length,
      attempts,
      trials,
      click_to_rows: summarize(durations),
      dispatched_click_to_rows_ms: actualClicks,
      hard_navigation_to_rows: summarize(useful),
      document_waiting: summarize(documents.map((value) => value.waiting)),
      document_ttfb: summarize(documents.map((value) => value.ttfb)),
      document_timing_evidence: documents.map((timing) => ({
        first_response_start: timing.first_response_start,
        final_response_headers_start: timing.final_response_headers_start,
        first_interim_response_start: timing.first_interim_response_start,
      })),
      response_evidence: responseEvidence,
      document_long_tasks: documents.map((value) => value.long_tasks),
      client_navigation_long_tasks: longTasks,
      filter_interactions: filterInteractions,
    });
  }

  if (cdp) {
    const completed = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
    await cdp.send("Tracing.end");
    await completed;
    await cdp.detach();
  }
  await Promise.all([...pendingResponseEvidence]);
  const report = {
        base_url: baseUrl,
        sample_count: sampleCount,
        measured_at: new Date().toISOString(),
        browser_version: browser.version(),
        browser_location: process.env.DASHBOARD_BROWSER_LOCATION ?? "unverified",
        browser_profile: profileName,
        viewport: profiles[profileName].viewport,
        network_conditions: profileName === "mobile-constrained"
          ? "CDP requested: 150 ms latency, 200000 B/s down, 93750 B/s up; 4x CPU slowdown (not a real phone)"
          : "runner network; no throttling",
        population: "requires at least one row on overview and each measured route",
        warm_state: "destination warmed; function cold state unverified",
        percentile_status: "preliminary estimates, not release or capacity certification",
        cpu_trace: cdp ? { note: "Sanitized Chrome duration events; microseconds. Nested events overlap; do not sum as wall time.", traceEvents: cpuEvents } : null,
        requests,
        results,
        outcome: results.every((value) => value.warmup.status === "completed" &&
          value.failed_samples === 0 && value.filter_interactions?.status !== "failed")
          ? "completed" : "incomplete",
      };
  const json = JSON.stringify(report, null, 2);
  if (process.env.DASHBOARD_BROWSER_OUTPUT) writeFileSync(process.env.DASHBOARD_BROWSER_OUTPUT, `${json}\n`);
  console.log(json);
  if (report.outcome !== "completed") process.exitCode = 1;
} catch (error) {
  // Playwright errors can include filled field values; never echo raw errors.
  console.error(`Dashboard timing run failed before a complete report (${classifyFailure(error)}).`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
