const DEFAULT_BASE_DELAY_MS = 5_000;
const MAX_DELAY_MS = 15 * 60 * 1_000;

export function retryDelayMs({
  attemptCount,
  retryAfterMs,
  random = Math.random,
}: {
  attemptCount: number;
  retryAfterMs?: number;
  random?: () => number;
}) {
  const attempt = Math.max(1, Math.min(Math.floor(attemptCount), 10));
  const exponential = DEFAULT_BASE_DELAY_MS * 2 ** (attempt - 1);
  const jitter = exponential * 0.25 * Math.max(0, Math.min(random(), 1));
  const requested = Number.isFinite(retryAfterMs)
    ? Math.max(retryAfterMs ?? 0, 0)
    : 0;

  return Math.min(Math.max(exponential + jitter, requested), MAX_DELAY_MS);
}

export function retryAtIso(args: Parameters<typeof retryDelayMs>[0]) {
  return new Date(Date.now() + retryDelayMs(args)).toISOString();
}
