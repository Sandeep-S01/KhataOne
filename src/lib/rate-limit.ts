import { createHmac } from "node:crypto";

import { getOptionalServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  available: boolean;
  remaining: number;
  resetAt: number;
  source: "local" | "shared-store";
};

const store = globalThis as typeof globalThis & {
  __khataoneRateLimits?: Map<string, RateLimitRecord>;
};

const rateLimits = store.__khataoneRateLimits ?? new Map<string, RateLimitRecord>();
store.__khataoneRateLimits = rateLimits;

function positiveIntegerEnv(key: string, fallback: number) {
  const value = Number(getOptionalServerEnv(key));
  return Number.isFinite(value) && value > 0
    ? Math.min(Math.floor(value), 10_000)
    : fallback;
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

  if (
    sharedEnforcement === "shared-store" &&
    (getOptionalServerEnv("RATE_LIMIT_KEY_SECRET")?.length ?? 0) < 32
  ) {
    return {
      status: "error" as const,
      message: "Shared rate-limit storage requires RATE_LIMIT_KEY_SECRET with at least 32 characters.",
    };
  }

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

export function usesSharedRateLimitStore() {
  return (
    getOptionalServerEnv("RATE_LIMIT_SHARED_ENFORCEMENT")
      ?.trim()
      .toLowerCase() === "shared-store"
  );
}

function requiresSharedRateLimitEnforcement() {
  return getOptionalServerEnv("RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT") === "true";
}

function hasDeclaredExternalRateLimitEnforcement() {
  const mode = getOptionalServerEnv("RATE_LIMIT_SHARED_ENFORCEMENT")
    ?.trim()
    .toLowerCase();

  return mode === "platform" || mode === "edge";
}

function shouldTrustForwardedIpHeaders() {
  return getOptionalServerEnv("TRUST_FORWARDED_IP_HEADERS") === "true";
}

function checkLocalRateLimit({
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
      available: true,
      remaining: Math.max(limit - 1, 0),
      resetAt,
      source: "local",
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      available: true,
      remaining: 0,
      resetAt: existing.resetAt,
      source: "local",
    };
  }

  existing.count += 1;
  rateLimits.set(key, existing);

  return {
    ok: true,
    available: true,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt,
    source: "local",
  };
}

export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const localResult = checkLocalRateLimit({ key, limit, windowMs });

  if (!localResult.ok) {
    return localResult;
  }

  if (!usesSharedRateLimitStore()) {
    if (
      requiresSharedRateLimitEnforcement() &&
      !hasDeclaredExternalRateLimitEnforcement()
    ) {
      return {
        ok: false,
        available: false,
        remaining: 0,
        resetAt: Date.now() + 1_000,
        source: "local",
      };
    }

    return localResult;
  }

  const admin = createAdminClient();
  const keySecret = getOptionalServerEnv("RATE_LIMIT_KEY_SECRET");

  if (!admin || !keySecret || keySecret.length < 32) {
    return {
      ok: false,
      available: false,
      remaining: 0,
      resetAt: Date.now() + 1_000,
      source: "shared-store",
    };
  }

  const keyHash = createHmac("sha256", keySecret).update(key).digest("hex");
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1_000));
  const { data, error } = await admin.rpc("consume_rate_limit", {
    target_key_hash: keyHash,
    target_limit: limit,
    target_window_seconds: windowSeconds,
  });
  const row = Array.isArray(data) ? data[0] : data;
  const resetAt = row?.reset_at ? new Date(row.reset_at).getTime() : NaN;

  if (error || !row || !Number.isFinite(resetAt)) {
    return {
      ok: false,
      available: false,
      remaining: 0,
      resetAt: Date.now() + 1_000,
      source: "shared-store",
    };
  }

  return {
    ok: Boolean(row.allowed),
    available: true,
    remaining: Number(row.remaining ?? 0),
    resetAt,
    source: "shared-store",
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
