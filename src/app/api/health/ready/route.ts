import { NextResponse, type NextRequest } from "next/server";

import {
  buildReadinessHealth,
  healthStatusCode,
} from "@/lib/health";
import { authorizeReadinessRequest } from "@/lib/health-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorization = authorizeReadinessRequest(request);

  if (!authorization.authorized) {
    return NextResponse.json(
      {
        status: "error",
        error: authorization.configured
          ? "Unauthorized."
          : "Readiness authentication is not configured.",
      },
      {
        status: authorization.configured ? 401 : 503,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  const payload = await buildReadinessHealth();

  return NextResponse.json(payload, {
    status: healthStatusCode(payload),
    headers: { "Cache-Control": "private, no-store" },
  });
}
