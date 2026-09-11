import { getOptionalServerEnv } from "@/lib/env";

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

function positiveIntegerEnv(key: string, fallback: number) {
  const value = Number(getOptionalServerEnv(key));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function configuredRateLimitPerWindow(key: string, fallback: number) {
  return positiveIntegerEnv(key, fallback);
}

export function getRateLimitPosture() {
  const sharedEnforcement = getOptionalServerEnv("RATE_LIMIT_SHARED_ENFORCEMENT")
    ?.trim()
    .toLowerCase();
  const requiresShared =
    getOptionalServerEnv("RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT") === "true";
  const recognizedSharedModes = new Set(["platform", "edge", "shared-store"]);
  const hasSharedEnforcement =
    Boolean(sharedEnforcement) && recognizedSharedModes.has(sharedEnforcement!);

  if (hasSharedEnforcement) {
    return {
      status: "ok" as const,
      message: `Shared rate-limit enforcement is declared as ${sharedEnforcement}. In-process limits remain a local guard.`,
    };
  }

  return {
    status: requiresShared ? ("error" as const) : ("warning" as const),
    message: requiresShared
      ? "Shared rate-limit enforcement is required but RATE_LIMIT_SHARED_ENFORCEMENT is not set to platform, edge, or shared-store."
      : "Only in-process rate limiting is configured. Use platform, edge, or shared-store enforcement before target-scale launch.",
  };
}

function shouldTrustForwardedIpHeaders() {
  return getOptionalServerEnv("TRUST_FORWARDED_IP_HEADERS") === "true";
}

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
  const ip = shouldTrustForwardedIpHeaders()
    ? forwardedFor?.split(",")[0]?.trim() ||
      realIp?.trim() ||
      fallback ||
      "unknown"
    : fallback || "unknown";

  return `${scope}:${ip}`;
}

export function retryAfterSeconds(resetAt: number) {
  return Math.max(Math.ceil((resetAt - Date.now()) / 1000), 1);
}
