import { NextResponse, type NextRequest } from "next/server";

import { getOptionalServerEnv } from "@/lib/env";
import { runQueuedExportGenerationJobs } from "@/lib/exports/worker";
import {
  checkRateLimit,
  clientRateLimitKey,
  configuredRateLimitPerWindow,
  retryAfterSeconds,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function hasAuthorizedSecret(request: NextRequest) {
  const cronSecret = getOptionalServerEnv("CRON_SECRET");
  const jobRunnerSecret = getOptionalServerEnv("JOB_RUNNER_SECRET");
  const authorization = request.headers.get("authorization");
  const providedJobSecret = request.headers.get("x-job-runner-secret");

  if (!cronSecret && !jobRunnerSecret) {
    return {
      ok: false,
      configured: false,
    };
  }

  return {
    ok:
      Boolean(cronSecret && authorization === `Bearer ${cronSecret}`) ||
      Boolean(jobRunnerSecret && providedJobSecret === jobRunnerSecret),
    configured: true,
  };
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit({
    key: clientRateLimitKey({
      scope: "job-export-generation-run-queued",
      forwardedFor: request.headers.get("x-forwarded-for"),
      realIp: request.headers.get("x-real-ip"),
      fallback: "job-runner",
    }),
    limit: configuredRateLimitPerWindow("JOB_RUNNER_RATE_LIMIT_PER_MINUTE", 20),
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many queued export worker requests." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds(rateLimit.resetAt)),
        },
      },
    );
  }

  const authorization = hasAuthorizedSecret(request);

  if (!authorization.configured) {
    return NextResponse.json(
      { error: "CRON_SECRET or JOB_RUNNER_SECRET must be configured." },
      { status: 500 },
    );
  }

  if (!authorization.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const batchSizeParam = request.nextUrl.searchParams.get("batch_size");
  const batchSize = batchSizeParam ? Number(batchSizeParam) : undefined;
  const result = await runQueuedExportGenerationJobs({
    batchSize,
    workerId: `export-cron-${Date.now()}`,
  });

  return NextResponse.json(result, {
    status: result.ok ? 200 : 207,
  });
}
