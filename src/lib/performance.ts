type PerformanceMetadata = Record<string, boolean | number | string | null>;

export type PerformanceContext = {
  requestId: string;
  requestKind: string;
  sampled: boolean;
  calls: number;
};

export function classifyRequest(headers: Headers, method = "GET") {
  if (method !== "GET" || headers.has("next-action")) return "mutation";
  if (headers.get("next-router-prefetch") === "1") {
    return headers.get("next-router-segment-prefetch") === "/_tree"
      ? "rsc_tree_prefetch" : "rsc_prefetch";
  }
  if (headers.get("rsc") === "1") return "client_navigation";
  // Framework-normalized requests may no longer carry the flight headers.
  return headers.get("accept")?.includes("text/html") ? "html_navigation" : "unclassified_get";
}

export function createPerformanceContext(headers: Headers, method = "GET"): PerformanceContext {
  const configured = Number(process.env.KHATAONE_PERF_SAMPLE_RATE ?? "0.1");
  const rate = Number.isFinite(configured) ? Math.max(0, Math.min(1, configured)) : 0.1;
  return {
    requestId: crypto.randomUUID(),
    requestKind: classifyRequest(headers, method),
    sampled: isPerformanceDiagnosticsEnabled() && Math.random() < rate,
    calls: 0,
  };
}

export function isPerformanceDiagnosticsEnabled() {
  return process.env.KHATAONE_PERF_DIAGNOSTICS === "1";
}

export async function withServerTiming<T>(
  name: string,
  operation: () => PromiseLike<T> | Promise<T>,
  metadata: PerformanceMetadata = {},
  context?: PerformanceContext,
): Promise<T> {
  if (!isPerformanceDiagnosticsEnabled() || (context && (!context.sampled || context.calls >= 64))) {
    return operation();
  }

  const started = performance.now();
  const startUnixMs = Date.now();
  const call = context ? ++context.calls : 1;
  let status = "exception";

  try {
    const result = await operation();
    status = result && typeof result === "object" && "error" in result && result.error
      ? "error" : "ok";
    return result;
  } finally {
    console.info(
      "[khataone-perf]",
      JSON.stringify({
        name,
        duration_ms: Math.round(performance.now() - started),
        start_unix_ms: startUnixMs,
        end_unix_ms: Date.now(),
        status,
        call,
        request_id: context?.requestId ?? null,
        request_kind: context?.requestKind ?? "unclassified",
        region: process.env.VERCEL_REGION ?? "local",
        runtime: process.env.NEXT_RUNTIME ?? "unknown",
        deployment: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        metadata,
      }),
    );
  }
}
