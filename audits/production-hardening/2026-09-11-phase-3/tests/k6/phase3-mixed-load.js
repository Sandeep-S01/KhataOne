import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const allowed =
  __ENV.KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD === "true" &&
  __ENV.KHATAONE_PHASE3_CAPACITY_TARGET_LABEL === "non-production";

if (!allowed) {
  throw new Error(
    "Refusing to run. Set KHATAONE_PHASE3_CAPACITY_ALLOW_NON_PROD=true and KHATAONE_PHASE3_CAPACITY_TARGET_LABEL=non-production.",
  );
}

const baseUrl = (__ENV.KHATAONE_PHASE3_BASE_URL || "").replace(/\/$/, "");
const scenario = __ENV.KHATAONE_PHASE3_SCENARIO || "mixed_10k_dau";
const jobRunnerSecret = __ENV.JOB_RUNNER_SECRET || "";
const authCookie = __ENV.KHATAONE_PHASE3_AUTH_COOKIE || "";

if (!baseUrl || !jobRunnerSecret || !authCookie) {
  throw new Error(
    "KHATAONE_PHASE3_BASE_URL, JOB_RUNNER_SECRET, and KHATAONE_PHASE3_AUTH_COOKIE are required.",
  );
}

const scenarioRates = {
  mixed_10k_dau: { dashboardRps: 30, workerRps: 1 },
  mixed_20k_dau: { dashboardRps: 60, workerRps: 2 },
  ca_heavy_10k_dashboard_dau: { dashboardRps: 300, workerRps: 1 },
  ca_heavy_20k_dashboard_dau: { dashboardRps: 600, workerRps: 2 },
};

const selected = scenarioRates[scenario];

if (!selected) {
  throw new Error(`Unsupported KHATAONE_PHASE3_SCENARIO: ${scenario}`);
}

const dashboardFailureRate = new Rate("khataone_dashboard_failures");
const workerFailureRate = new Rate("khataone_worker_failures");
const dashboardDuration = new Trend("khataone_dashboard_duration_ms");
const workerDuration = new Trend("khataone_worker_duration_ms");

const dashboardRoutes = [
  "/dashboard",
  "/dashboard/clients",
  "/dashboard/review-queue",
  "/dashboard/ledger",
  "/dashboard/gst-summary",
  "/dashboard/exports",
  "/dashboard/operations",
];

const workerRoutes = [
  "/api/jobs/ai-extraction/run-queued?batch_size=10",
  "/api/jobs/exports/run-queued?batch_size=10",
  "/api/jobs/whatsapp-ingestion/run-queued?batch_size=10",
];

export const options = {
  scenarios: {
    dashboard_reads: {
      executor: "constant-arrival-rate",
      rate: selected.dashboardRps,
      timeUnit: "1s",
      duration: __ENV.KHATAONE_PHASE3_DURATION || "15m",
      preAllocatedVUs: Number(__ENV.KHATAONE_PHASE3_DASHBOARD_PREALLOCATED_VUS || 100),
      maxVUs: Number(__ENV.KHATAONE_PHASE3_DASHBOARD_MAX_VUS || 1000),
      exec: "dashboardReads",
    },
    worker_ticks: {
      executor: "constant-arrival-rate",
      rate: selected.workerRps,
      timeUnit: "1s",
      duration: __ENV.KHATAONE_PHASE3_DURATION || "15m",
      preAllocatedVUs: Number(__ENV.KHATAONE_PHASE3_WORKER_PREALLOCATED_VUS || 10),
      maxVUs: Number(__ENV.KHATAONE_PHASE3_WORKER_MAX_VUS || 100),
      exec: "workerTicks",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.005"],
    khataone_dashboard_failures: ["rate<0.005"],
    khataone_worker_failures: ["rate<0.005"],
    khataone_dashboard_duration_ms: ["p(95)<500", "p(99)<1000"],
    khataone_worker_duration_ms: ["p(95)<1000"],
  },
};

function headers(extra = {}) {
  return {
    Cookie: authCookie,
    "x-job-runner-secret": jobRunnerSecret,
    "x-khataone-load-test": "phase3-capacity",
    ...extra,
  };
}

export function dashboardReads() {
  const route = dashboardRoutes[Math.floor(Math.random() * dashboardRoutes.length)];
  const response = http.get(`${baseUrl}${route}`, {
    headers: headers(),
    tags: { khataone_route: route, khataone_workload: scenario },
  });

  dashboardDuration.add(response.timings.duration);
  dashboardFailureRate.add(
    !check(response, {
      "dashboard status is 2xx or auth redirect": (res) =>
        (res.status >= 200 && res.status < 300) || res.status === 302,
    }),
  );

  sleep(Math.random() * 0.5);
}

export function workerTicks() {
  const route = workerRoutes[Math.floor(Math.random() * workerRoutes.length)];
  const response = http.get(`${baseUrl}${route}`, {
    headers: headers(),
    tags: { khataone_route: route, khataone_workload: scenario },
  });

  workerDuration.add(response.timings.duration);
  workerFailureRate.add(
    !check(response, {
      "worker status is accepted": (res) => res.status === 200 || res.status === 207,
    }),
  );
}
