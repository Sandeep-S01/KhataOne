type PerformanceMetadata = Record<string, boolean | number | string | null>;

export function isPerformanceDiagnosticsEnabled() {
  return process.env.KHATAONE_PERF_DIAGNOSTICS === "1";
}

export async function withServerTiming<T>(
  name: string,
  operation: () => PromiseLike<T> | Promise<T>,
  metadata: PerformanceMetadata = {},
): Promise<T> {
  if (!isPerformanceDiagnosticsEnabled()) {
    return operation();
  }

  const started = performance.now();

  try {
    return await operation();
  } finally {
    console.info(
      "[khataone-perf]",
      JSON.stringify({
        name,
        duration_ms: Math.round(performance.now() - started),
        metadata,
      }),
    );
  }
}
