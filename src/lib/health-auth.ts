import { createHash, timingSafeEqual } from "node:crypto";

import { getOptionalServerEnv } from "@/lib/env";

function equalSecret(provided: string, expected: string) {
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();

  return timingSafeEqual(providedHash, expectedHash);
}

export function authorizeReadinessRequest(request: Request) {
  const expected = getOptionalServerEnv("READINESS_CHECK_SECRET");
  const required = getOptionalServerEnv("VERCEL_ENV") === "production";

  if (!expected || expected.length < 32) {
    return {
      authorized: !required,
      configured: false,
      required,
    };
  }

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";

  return {
    authorized: Boolean(bearer) && equalSecret(bearer, expected),
    configured: true,
    required: true,
  };
}
