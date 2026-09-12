const terminalQuotaCodes = new Set([
  "credit_balance_exhausted",
  "organization_spend_limit_exceeded",
  "project_spend_limit_exceeded",
  "organization_usage_limit_exceeded",
]);

function safeToken(value: unknown) {
  const normalized = String(value ?? "")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 80);
  return normalized || undefined;
}

function headerValue(headers: unknown, name: string) {
  if (headers instanceof Headers) return headers.get(name);
  if (!headers || typeof headers !== "object") return null;

  const record = headers as Record<string, unknown>;
  return String(record[name] ?? record[name.toLowerCase()] ?? "") || null;
}

function retryAfterMs(headers: unknown) {
  const value = headerValue(headers, "retry-after")?.trim();
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, 15 * 60 * 1_000);
  }

  const date = Date.parse(value);
  return Number.isFinite(date)
    ? Math.min(Math.max(date - Date.now(), 0), 15 * 60 * 1_000)
    : undefined;
}

export function classifyOpenAIError(error: unknown) {
  const record = error && typeof error === "object"
    ? error as Record<string, unknown>
    : {};
  const statusValue = Number(record.status);
  const status = Number.isInteger(statusValue) && statusValue >= 100
    ? statusValue
    : undefined;
  const code = safeToken(record.code);
  const type = safeToken(record.type);
  const name = safeToken(record.name);
  const terminalQuota = terminalQuotaCodes.has(code ?? "");
  const retryable = !terminalQuota && (
    [408, 409, 429].includes(status ?? -1) ||
    (status !== undefined && status >= 500) ||
    ["APIConnectionError", "APITimeoutError"].includes(name ?? "") ||
    ["server_error", "server_is_overloaded", "rate_limit_error"].includes(
      code ?? type ?? "",
    )
  );

  return {
    message: `OpenAI request failed${status !== undefined ? ` (HTTP ${status}${code ? `, code ${code}` : ""})` : name ? ` (${name})` : ""}.`,
    retryable,
    retryAfterMs: retryable ? retryAfterMs(record.headers) : undefined,
    fallbackAllowed: retryable || terminalQuota,
  };
}
