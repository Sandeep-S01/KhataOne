import type { Route } from "next";

type SearchValue = string | string[] | undefined;
export type SearchParamSnapshot = Record<string, SearchValue>;

export const returnContextParam = "return_to";

export const clientReturnKeys = ["page", "status", "q"] as const;
export const reviewQueueReturnKeys = [
  "client",
  "document_type",
  "from",
  "page",
  "q",
  "risk",
  "status",
  "to",
] as const;
export const ledgerReturnKeys = ["account", "client", "from", "page", "to"] as const;
export const gstSummaryReturnKeys = [] as const;

const maxValueLength = 160;

function allowedSet(keys: readonly string[]) {
  return new Set(keys);
}

function appendParam(params: URLSearchParams, key: string, value: SearchValue) {
  if (Array.isArray(value)) {
    for (const item of value) {
      appendParam(params, key, item);
    }
    return;
  }

  if (typeof value !== "string") {
    return;
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > maxValueLength) {
    return;
  }

  params.append(key, normalized);
}

export function sanitizeReturnContext(
  rawContext: string | undefined,
  allowedKeys: readonly string[],
) {
  if (!rawContext || rawContext.length > 2000) {
    return "";
  }

  const allowed = allowedSet(allowedKeys);
  const input = rawContext.startsWith("?") ? rawContext.slice(1) : rawContext;
  const output = new URLSearchParams();

  for (const [key, value] of new URLSearchParams(input).entries()) {
    if (!allowed.has(key) || key === returnContextParam) {
      continue;
    }

    appendParam(output, key, value);
  }

  return output.toString();
}

export function buildReturnContext(
  params: SearchParamSnapshot,
  allowedKeys: readonly string[],
) {
  const output = new URLSearchParams();

  for (const key of allowedKeys) {
    if (key === returnContextParam) {
      continue;
    }

    appendParam(output, key, params[key]);
  }

  return output.toString();
}

export function appendReturnContext<T extends string>(href: T, returnContext: string) {
  const safeContext = returnContext.trim();

  if (!safeContext) {
    return href as Route;
  }

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${returnContextParam}=${encodeURIComponent(safeContext)}` as Route;
}

export function dashboardReturnHref<T extends string>(
  basePath: T,
  rawContext: string | undefined,
  allowedKeys: readonly string[],
) {
  const safeContext = sanitizeReturnContext(rawContext, allowedKeys);

  if (!safeContext) {
    return basePath as Route;
  }

  return `${basePath}?${safeContext}` as Route;
}

export function withQueryParam<T extends string>(href: T, key: string, value: string) {
  const [pathPart, queryPart = ""] = href.split("?");
  const params = new URLSearchParams(queryPart);
  params.set(key, value);
  const query = params.toString();
  return `${pathPart}${query ? `?${query}` : ""}` as Route;
}
