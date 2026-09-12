import { cache } from "react";
import { headers } from "next/headers";
import {
  createPerformanceContext,
  isPerformanceDiagnosticsEnabled,
  withServerTiming as measure,
} from "./performance";

const getContext = cache(async () => {
  const incoming = await headers();
  const context = createPerformanceContext(new Headers(incoming));
  const requestId = incoming.get("x-khataone-perf-id");
  if (requestId && /^[a-f0-9-]{36}$/.test(requestId)) {
    context.requestId = requestId;
    context.sampled = incoming.get("x-khataone-perf-sampled") === "1";
  }
  return context;
});

export async function withServerTiming<T>(
  name: string,
  operation: () => PromiseLike<T> | Promise<T>,
  metadata: Record<string, boolean | number | string | null> = {},
) {
  if (!isPerformanceDiagnosticsEnabled()) return operation();
  return measure(name, operation, metadata, await getContext());
}
