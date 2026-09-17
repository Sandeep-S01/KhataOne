// Read-only list/detail measurements on any configured dashboard. A save is
// allowed only against a loopback URL with an explicit disposable-fixture flag.
// Reports contain timings and outcomes, never record IDs, values or credentials.
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { parseEnv } from "node:util";
import { chromium } from "playwright";

try {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(".env.local", "utf8")))) {
    process.env[key] ??= value;
  }
} catch {
  // An isolated runner can supply all settings through its process environment.
}

const required = ["LIVE_DASHBOARD_BASE_URL", "LIVE_DASHBOARD_EMAIL", "LIVE_DASHBOARD_PASSWORD"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing workflow benchmark settings: ${missing.join(", ")}`);

const baseUrl = new URL(process.env.LIVE_DASHBOARD_BASE_URL).origin;
const sampleCount = Number(process.env.DASHBOARD_WORKFLOW_SAMPLE_COUNT ?? 3);
if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 30) {
  throw new Error("DASHBOARD_WORKFLOW_SAMPLE_COUNT must be an integer from 1 to 30");
}
const profile = process.env.DASHBOARD_WORKFLOW_PROFILE ?? "mobile-constrained";
if (!["desktop", "mobile-constrained"].includes(profile)) {
  throw new Error("DASHBOARD_WORKFLOW_PROFILE must be desktop or mobile-constrained");
}
const includeSave = process.env.DASHBOARD_WORKFLOW_DISPOSABLE_SAVE === "1";
if (includeSave && (!["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname) ||
  !process.env.LIVE_DASHBOARD_EMAIL.toLowerCase().endsWith("@example.test"))) {
  throw new Error("A save measurement requires a loopback URL and synthetic fixture user");
}
const listPath = "/dashboard/review-queue";
const tableName = "Review queue transactions";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage(profile === "desktop"
  ? { viewport: { width: 1440, height: 900 } }
  : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
if (profile === "mobile-constrained") {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}
const captureCpuTrace = process.env.DASHBOARD_WORKFLOW_CPU_TRACE === "1";
const traceSession = captureCpuTrace ? await page.context().newCDPSession(page) : null;
await page.addInitScript(() => {
  window.__khataonePerfLongTasks = [];
  if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
    new PerformanceObserver((list) => {
      window.__khataonePerfLongTasks.push(...list.getEntries().map((entry) => ({
        unix_ms: performance.timeOrigin + entry.startTime, duration_ms: entry.duration,
      })));
    }).observe({ type: "longtask", buffered: true });
  }
});

const requests = [];
const requestRecords = new WeakMap();
const pendingRequestSizes = [];
let activePhase = null;
page.on("request", (request) => {
  if (!activePhase || new URL(request.url()).origin !== baseUrl) return;
  const path = new URL(request.url()).pathname;
  if (path !== listPath && !/^\/dashboard\/review-queue\/[0-9a-f-]{36}$/i.test(path)) return;
  const record = {
    phase: activePhase.phase,
    sample: activePhase.sample,
    route: path === listPath ? "review_list" : "review_detail",
    is_target: path === activePhase.targetPath,
    kind: request.headers().rsc === "1" ? "rsc" : request.isNavigationRequest() ? "document" : "other",
    is_prefetch: request.headers()["next-router-prefetch"] === "1",
  };
  requests.push(record);
  requestRecords.set(request, record);
});
page.on("requestfinished", (request) => {
  const record = requestRecords.get(request);
  if (!record) return;
  const timing = request.timing();
  record.network = {
    start_unix_ms: timing.startTime,
    response_start_ms: timing.responseStart,
    response_end_ms: timing.responseEnd,
  };
  pendingRequestSizes.push(request.sizes().then((sizes) => {
    record.encoded_response_body_bytes = sizes.responseBodySize;
  }).catch(() => null));
});
page.on("requestfailed", (request) => {
  const record = requestRecords.get(request);
  if (record) record.failed = true;
});

function classify(error) {
  return error?.name === "TimeoutError" ? "timeout" : "interaction_or_navigation_error";
}

function installNavigationProbe({ href, selector, text }) {
  const target = new URL(href, location.href);
  window.__khataoneWorkflowDocument = true;
  window.__khataoneWorkflowProbe = null;
  let observer;
  let timer;
  const stop = () => {
    observer?.disconnect();
    clearTimeout(timer);
    document.removeEventListener("click", onClick, true);
  };
  const inspect = () => {
    if (!window.__khataoneWorkflowProbe || location.pathname !== target.pathname ||
      location.search !== target.search) return;
    const element = [...document.querySelectorAll(selector)]
      .find((candidate) => candidate.textContent?.trim() === text);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || getComputedStyle(element).visibility !== "visible") return;
    window.__khataoneWorkflowProbe.visible_dom_unix_ms = performance.timeOrigin + performance.now();
    stop();
    requestAnimationFrame(() => {
      window.__khataoneWorkflowProbe.next_frame_unix_ms = performance.timeOrigin + performance.now();
    });
  };
  function onClick(event) {
    const anchor = event.target.closest?.("a");
    if (!anchor || new URL(anchor.href).href !== target.href) return;
    window.__khataoneWorkflowProbe = {
      click_unix_ms: performance.timeOrigin + performance.now(),
      visible_dom_unix_ms: null,
      next_frame_unix_ms: null,
    };
    document.removeEventListener("click", onClick, true);
    observer = new MutationObserver(inspect);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    inspect();
  }
  document.addEventListener("click", onClick, true);
  timer = setTimeout(stop, 30000);
}

async function prepareList() {
  await page.goto(new URL(listPath, baseUrl).toString());
  await page.getByRole("region", { name: tableName, exact: true })
    .locator("tbody tr").first().waitFor({ timeout: 30000 });
}

async function measureLink(phase, sample, link, targetSelector, targetText, waitForTarget) {
  const href = await link.getAttribute("href");
  if (!href) throw new Error("Expected a navigable link");
  await page.evaluate(installNavigationProbe, { href, selector: targetSelector, text: targetText });
  const traceEvents = [];
  const traceOneDetail = traceSession && phase === "detail" && sample === 1;
  const collectTrace = ({ value }) => traceEvents.push(...value);
  if (traceOneDetail) {
    traceSession.on("Tracing.dataCollected", collectTrace);
    await traceSession.send("Tracing.start", {
      categories: "devtools.timeline", transferMode: "ReportEvents",
    });
  }
  activePhase = { phase, sample, targetPath: new URL(href, baseUrl).pathname };
  const started = performance.now();
  let result;
  try {
    await link.click();
    await waitForTarget();
    const automationMs = Math.round(performance.now() - started);
    const documentPreserved = await page.evaluate(() => Boolean(window.__khataoneWorkflowDocument));
    if (documentPreserved) {
      await page.waitForFunction(() => window.__khataoneWorkflowProbe?.next_frame_unix_ms, null,
        { timeout: 2000 }).catch(() => null);
    }
    const probe = await page.evaluate(() => window.__khataoneWorkflowProbe ?? null);
    const longTaskMs = probe ? await page.evaluate(({ start, end }) =>
      Math.round(window.__khataonePerfLongTasks
        .filter((task) => task.unix_ms >= start && task.unix_ms <= end)
        .reduce((sum, task) => sum + task.duration_ms, 0)), {
      start: probe.click_unix_ms, end: probe.next_frame_unix_ms ?? probe.visible_dom_unix_ms,
    }) : null;
    result = { sample, status: "completed", automation_ms: automationMs,
      document_preserved: documentPreserved, probe, long_task_ms: longTaskMs };
    return result;
  } finally {
    activePhase = null;
    if (traceOneDetail) {
      const completed = new Promise((resolve) => traceSession.once("Tracing.tracingComplete", resolve));
      await traceSession.send("Tracing.end");
      await completed;
      traceSession.off("Tracing.dataCollected", collectTrace);
      if (result) result.cpu_trace = summarizeCpuTrace(traceEvents);
    }
  }
}

function summarizeCpuTrace(events) {
  const mainThreads = new Set(events.filter((event) => event.ph === "M" &&
    event.name === "thread_name" && event.args?.name === "CrRendererMain")
    .map((event) => `${event.pid}:${event.tid}`));
  const allowed = new Set(["RunTask", "EvaluateScript", "FunctionCall", "Layout", "UpdateLayoutTree", "Paint"]);
  const groups = {};
  for (const event of events) {
    if (event.ph !== "X" || !allowed.has(event.name) ||
      (mainThreads.size && !mainThreads.has(`${event.pid}:${event.tid}`))) continue;
    const group = groups[event.name] ??= { count: 0, total_ms: 0, max_ms: 0, over_50ms: 0 };
    const ms = event.dur / 1000;
    group.count += 1;
    group.total_ms += ms;
    group.max_ms = Math.max(group.max_ms, ms);
    if (ms > 50) group.over_50ms += 1;
  }
  for (const group of Object.values(groups)) {
    group.total_ms = Math.round(group.total_ms);
    group.max_ms = Math.round(group.max_ms);
  }
  return { renderer_main_thread_identified: mainThreads.size > 0, groups,
    note: "Chrome duration events can nest; their totals are not elapsed time. No URLs, stacks or event args retained." };
}

function phaseSplit(phase, item) {
  const probe = item.probe;
  if (!probe?.visible_dom_unix_ms) return { status: "unavailable_no_browser_probe" };
  const phaseRequests = requests.filter((entry) => entry.phase === phase && entry.sample === item.sample &&
    entry.kind === "rsc" && !entry.failed && entry.network?.response_start_ms >= 0 &&
    entry.network.start_unix_ms >= probe.click_unix_ms - 100)
    .sort((left, right) => left.network.start_unix_ms - right.network.start_unix_ms);
  const request = phaseRequests.find((entry) => entry.is_target && !entry.is_prefetch);
  if (!request) return { status: "unavailable_prefetch_cache_or_uncaptured_request",
    captured_rsc_requests: phaseRequests.length };
  const firstByte = request.network.start_unix_ms + request.network.response_start_ms;
  const responseEnd = request.network.start_unix_ms + request.network.response_end_ms;
  const untilByte = firstByte - probe.click_unix_ms;
  const afterByte = probe.visible_dom_unix_ms - firstByte;
  if (untilByte < 0 || afterByte < 0) return { status: "unavailable_streaming_or_clock_order" };
  return { status: "observed", click_to_first_byte_ms: Math.round(untilByte),
    first_byte_to_visible_dom_ms: Math.round(afterByte),
    first_byte_to_response_end_ms: Math.round(responseEnd - firstByte),
    response_end_to_visible_dom_ms: Math.round(probe.visible_dom_unix_ms - responseEnd),
    encoded_response_body_bytes: request.encoded_response_body_bytes ?? null,
    captured_rsc_requests: phaseRequests.length,
    captured_prefetch_requests: phaseRequests.filter((entry) => entry.is_prefetch).length,
    note: "First-byte wait includes network and server; response end may occur after early streamed DOM. The remaining interval includes scheduling and rendering." };
}

const report = {
  measured_at_utc: new Date().toISOString(),
  target: ["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname) ? "loopback fixture" : "hosted",
  profile,
  sample_count: sampleCount,
  navigation: { pagination: { status: "not_started" }, detail: { status: "not_started" } },
  save: { status: includeSave ? "not_started" : "not_requested" },
  timing_note: "DOM and next-frame timestamps are browser observations, not actual paint or INP.",
  cpu_trace_requested: captureCpuTrace,
};

let setupPhase = "login_page";
try {
  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "domcontentloaded" });
  setupPhase = "submit_login";
  await page.locator('input[name="email"]').fill(process.env.LIVE_DASHBOARD_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.LIVE_DASHBOARD_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  setupPhase = "dashboard_redirect";
  await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), { timeout: 30000 });
  setupPhase = "review_list_ready";
  await prepareList();
  setupPhase = "measurements";

  const next = page.getByRole("link", { name: "Next", exact: true });
  if (await next.count() === 0) {
    report.navigation.pagination = { status: "unavailable_fewer_than_one_full_page" };
  } else {
    const attempts = [];
    for (let sample = 1; sample <= sampleCount; sample += 1) {
      try {
        await prepareList();
        const item = await measureLink("pagination", sample, page.getByRole("link", { name: "Next", exact: true }),
          "span", "Page 2 - review records", async () => {
            await page.waitForURL((url) => url.pathname === listPath && url.searchParams.get("page") === "2");
            await page.getByText("Page 2 - review records", { exact: true }).waitFor();
            await page.getByRole("region", { name: tableName, exact: true })
              .locator("tbody tr").first().waitFor();
          });
        attempts.push(item);
      } catch (error) {
        attempts.push({ sample, status: "failed", failure_kind: classify(error) });
      }
    }
    report.navigation.pagination = { status: attempts.every((item) => item.status === "completed")
      ? "completed" : "incomplete", attempts };
  }

  const detailAttempts = [];
  for (let sample = 1; sample <= sampleCount; sample += 1) {
    try {
      await prepareList();
      const link = page.getByRole("region", { name: tableName, exact: true })
        .locator('tbody a[aria-label^="Review "]').first();
      const item = await measureLink("detail", sample, link, "h1", "Review transaction", async () => {
        await page.waitForURL((url) => /^\/dashboard\/review-queue\/[0-9a-f-]{36}$/i.test(url.pathname));
        await page.getByRole("heading", { name: "Review transaction", exact: true }).waitFor();
      });
      detailAttempts.push(item);
    } catch (error) {
      detailAttempts.push({ sample, status: "failed", failure_kind: classify(error) });
    }
  }
  report.navigation.detail = { status: detailAttempts.every((item) => item.status === "completed")
    ? "completed" : "incomplete", attempts: detailAttempts };

  if (includeSave && report.navigation.detail.status === "completed") {
    // This is permitted only for the disposable loopback fixture above.
    const marker = `Disposable benchmark edit ${Date.now()}`;
    const field = page.locator('textarea[name="description"]');
    await field.fill(marker);
    const submit = page.getByRole("button", { name: "Save review edits", exact: true });
    try {
      await page.evaluate(() => {
        const form = document.querySelector('textarea[name="description"]')?.closest("form");
        if (!form) return;
        const probe = { click_unix_ms: null, pending_dom_unix_ms: null, ready_dom_unix_ms: null };
        window.__khataoneSaveProbe = probe;
        const inspect = () => {
          if (!probe.click_unix_ms) return;
          const label = document.querySelector('textarea[name="description"]')
            ?.closest("form")?.querySelector('button[type="submit"]')?.textContent?.trim();
          const now = performance.timeOrigin + performance.now();
          if (label === "Saving..." && !probe.pending_dom_unix_ms) probe.pending_dom_unix_ms = now;
          if (label === "Save review edits" && probe.pending_dom_unix_ms &&
            !probe.ready_dom_unix_ms) probe.ready_dom_unix_ms = now;
        };
        form.addEventListener("click", (event) => {
          if (!event.target.closest?.('button[type="submit"]')) return;
          probe.click_unix_ms = performance.timeOrigin + performance.now();
        }, { capture: true, once: true });
        new MutationObserver(inspect).observe(document.documentElement,
          { childList: true, subtree: true, characterData: true });
      });
      const responsePromise = page.waitForResponse((response) =>
        response.request().method() === "POST" && Boolean(response.request().headers()["next-action"]),
      { timeout: 30000 });
      const started = performance.now();
      await submit.click();
      const response = await responsePromise;
      await response.finished();
      await submit.waitFor({ state: "visible", timeout: 30000 });
      const uiMs = Math.round(performance.now() - started);
      await page.waitForFunction(() => window.__khataoneSaveProbe?.ready_dom_unix_ms,
        null, { timeout: 2000 }).catch(() => null);
      const saveProbe = await page.evaluate(() => window.__khataoneSaveProbe ?? null);
      const timing = response.request().timing();
      const actionTiming = saveProbe?.click_unix_ms && timing.startTime >= 0 && timing.responseStart >= 0 &&
        timing.responseEnd >= 0 ? {
        click_to_request_start_ms: Math.max(0, Math.round(timing.startTime - saveProbe.click_unix_ms)),
        request_to_first_byte_ms: Math.round(timing.responseStart),
        first_byte_to_response_end_ms: Math.round(timing.responseEnd - timing.responseStart),
      } : null;
      await page.reload();
      await page.locator('textarea[name="description"]').waitFor();
      const persisted = await page.locator('textarea[name="description"]').inputValue() === marker;
      report.save = { status: persisted && response.ok() ? "completed" : "failed_confirmation",
        click_to_action_response_and_ui_ms: uiMs, persisted_after_reload: persisted,
        response_status: response.status(), action_network_timing: actionTiming,
        click_to_pending_dom_ms: saveProbe?.pending_dom_unix_ms
          ? Math.round(saveProbe.pending_dom_unix_ms - saveProbe.click_unix_ms) : null,
        click_to_button_ready_dom_ms: saveProbe?.ready_dom_unix_ms
          ? Math.round(saveProbe.ready_dom_unix_ms - saveProbe.click_unix_ms) : null };
    } catch (error) {
      report.save = { status: "failed", failure_kind: classify(error) };
    }
  }

  await page.waitForTimeout(150);
  await Promise.allSettled(pendingRequestSizes);
  for (const phase of ["pagination", "detail"]) {
    for (const item of report.navigation[phase].attempts ?? []) {
      if (item.status === "completed") item.phase_split = phaseSplit(phase, item);
    }
  }
} catch (error) {
  report.setup_failure = classify(error);
  report.setup_failure_phase = setupPhase;
  const setupPath = new URL(page.url()).pathname;
  report.setup_failure_path = ["/login", "/dashboard", listPath].includes(setupPath)
    ? setupPath : "other";
} finally {
  await browser.close();
}

report.outcome = !report.setup_failure && report.navigation.pagination.status === "completed" &&
  report.navigation.detail.status === "completed" &&
  (!includeSave || report.save.status === "completed") ? "completed" : "incomplete";
if (process.env.DASHBOARD_WORKFLOW_OUTPUT) {
  writeFileSync(process.env.DASHBOARD_WORKFLOW_OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));
if (report.outcome !== "completed") process.exitCode = 1;
