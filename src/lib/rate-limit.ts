type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

const store = globalThis as typeof globalThis & {
  __khataoneRateLimits?: Map<string, RateLimitRecord>;
};

const rateLimits = store.__khataoneRateLimits ?? new Map<string, RateLimitRecord>();
store.__khataoneRateLimits = rateLimits;

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const existing = rateLimits.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimits.set(key, { count: 1, resetAt });

    return {
      ok: true,
      remaining: Math.max(limit - 1, 0),
      resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  rateLimits.set(key, existing);

  return {
    ok: true,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function clientRateLimitKey({
  scope,
  forwardedFor,
  realIp,
  fallback,
}: {
  scope: string;
  forwardedFor: string | null;
  realIp: string | null;
  fallback: string;
}) {
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    fallback ||
    "unknown";

  return `${scope}:${ip}`;
}

export function retryAfterSeconds(resetAt: number) {
  return Math.max(Math.ceil((resetAt - Date.now()) / 1000), 1);
}
