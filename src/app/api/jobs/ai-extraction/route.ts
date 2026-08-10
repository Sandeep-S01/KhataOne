import { NextResponse, type NextRequest } from "next/server";

import { getOptionalServerEnv } from "@/lib/env";
import { processDocumentExtraction } from "@/lib/ai/extraction-processor";
import { captureOperationalError } from "@/lib/observability";
import {
  checkRateLimit,
  clientRateLimitKey,
  retryAfterSeconds,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit({
    key: clientRateLimitKey({
      scope: "job-ai-extraction",
      forwardedFor: request.headers.get("x-forwarded-for"),
      realIp: request.headers.get("x-real-ip"),
      fallback: "job-runner",
    }),
    limit: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many extraction job requests." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds(rateLimit.resetAt)),
        },
      },
    );
  }

  const configuredSecret = getOptionalServerEnv("JOB_RUNNER_SECRET");

  if (configuredSecret) {
    const providedSecret = request.headers.get("x-job-runner-secret");

    if (providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const body = (await request.json().catch(() => null)) as {
    document_id?: string;
  } | null;

  if (!body?.document_id) {
    return NextResponse.json(
      { error: "document_id is required." },
      { status: 400 },
    );
  }

  const result = await processDocumentExtraction(body.document_id);

  if (!result.ok) {
    captureOperationalError({
      area: "ai-extraction-job",
      error: result.message,
      context: {
        document_id: body.document_id,
      },
    });
  }

  return NextResponse.json(result, {
    status: result.ok ? 200 : 422,
  });
}
