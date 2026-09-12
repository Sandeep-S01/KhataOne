import { after, NextResponse, type NextRequest } from "next/server";

import { getOptionalServerEnv } from "@/lib/env";
import { runAiExtractionJobNow } from "@/lib/ai/extraction-worker";
import { runKeyedWorkerPool } from "@/lib/jobs/keyed-worker-pool";
import { captureOperationalError } from "@/lib/observability";
import { withServerTiming } from "@/lib/performance";
import {
  checkRateLimit,
  clientRateLimitKey,
  configuredRateLimitPerWindow,
  retryAfterSeconds,
} from "@/lib/rate-limit";
import {
  enqueueWhatsAppWebhookEvents,
  runQueuedWhatsAppIngestionEvents,
} from "@/lib/whatsapp/ingestion-worker";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";
import { verifyMetaSignature } from "@/lib/whatsapp/verify";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const verifyToken = getOptionalServerEnv("WHATSAPP_VERIFY_TOKEN");
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!verifyToken) {
    return new NextResponse("WhatsApp verify token is not configured.", {
      status: 500,
    });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit({
    key: clientRateLimitKey({
      scope: "whatsapp-webhook",
      forwardedFor: request.headers.get("x-forwarded-for"),
      realIp: request.headers.get("x-real-ip"),
      fallback: "meta-webhook",
    }),
    limit: configuredRateLimitPerWindow(
      "WHATSAPP_WEBHOOK_RATE_LIMIT_PER_MINUTE",
      240,
    ),
    windowMs: 60_000,
  });

  if (!rateLimit.available) {
    return NextResponse.json(
      { error: "Request protection is temporarily unavailable." },
      { status: 503, headers: { "Retry-After": "1" } },
    );
  }

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many webhook requests." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds(rateLimit.resetAt)),
        },
      },
    );
  }

  const appSecret = getOptionalServerEnv("WHATSAPP_APP_SECRET");

  if (!appSecret) {
    return NextResponse.json(
      { error: "WhatsApp app secret is not configured." },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (
    !verifyMetaSignature({
      rawBody,
      signatureHeader,
      appSecret,
    })
  ) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: WhatsAppWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const result = await withServerTiming(
    "whatsapp.webhook.enqueue",
    () => enqueueWhatsAppWebhookEvents(payload),
    {
      payload_entries: payload.entry?.length ?? 0,
    },
  ).catch((error: unknown) => {
    captureOperationalError({
      area: "whatsapp-webhook-enqueue",
      error,
    });

    throw error;
  });

  if (!result.ok) {
    captureOperationalError({
      area: "whatsapp-webhook-enqueue",
      error: result.error ?? "WhatsApp webhook event enqueue failed.",
    });

    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? "WhatsApp webhook event enqueue failed.",
        accepted: result.accepted,
        duplicateOrExisting: result.duplicateOrExisting,
      },
      { status: 500 },
    );
  }

  if (
    result.accepted > 0 &&
    getOptionalServerEnv("WHATSAPP_IMMEDIATE_INGESTION_ENABLED") === "true"
  ) {
    after(async () => {
      try {
        const workerResult = await runQueuedWhatsAppIngestionEvents({
          batchSize: Math.min(Math.max(result.accepted, 1), 10),
          workerId: `whatsapp-webhook-${Date.now()}`,
        });

        if (!workerResult.ok) {
          captureOperationalError({
            area: "whatsapp-webhook-immediate-ingestion",
            error:
              workerResult.error ??
              `${workerResult.failed} immediate ingestion event(s) failed.`,
            context: {
              claimed: workerResult.claimed,
              failed: workerResult.failed,
            },
          });
        }

        if (getOptionalServerEnv("WHATSAPP_IMMEDIATE_AI_ENABLED") === "true") {
          const newJobs = [
            ...new Map(
              workerResult.results
                .filter((item) => item.processingJobCreated && item.processingJobId)
                .map((item) => [
                  item.processingJobId as string,
                  {
                    jobId: item.processingJobId as string,
                    firmId: item.firmId,
                    clientId: item.clientId,
                  },
                ]),
            ).values(),
          ];

          await runKeyedWorkerPool({
            items: newJobs,
            concurrency: 2,
            keyFor: (job) => job.clientId
              ? `client:${job.firmId ?? "unknown"}:${job.clientId}`
              : `job:${job.jobId}`,
            worker: async ({ jobId }) => {
              try {
                const extractionResult = await runAiExtractionJobNow({
                  jobId,
                  workerId: `whatsapp-immediate-ai-${Date.now()}`,
                });

                if (extractionResult.ok) return;

                captureOperationalError({
                  area: "whatsapp-webhook-immediate-ai",
                  error:
                    extractionResult.error ??
                    `${extractionResult.failed} immediate extraction job(s) failed.`,
                  context: {
                    job_id: jobId,
                    claimed: extractionResult.claimed,
                    failed: extractionResult.failed,
                  },
                });
              } catch (error) {
                captureOperationalError({
                  area: "whatsapp-webhook-immediate-ai",
                  error,
                  context: { job_id: jobId },
                });
              }
            },
          });
        }
      } catch (error) {
        captureOperationalError({
          area: "whatsapp-webhook-immediate-ingestion",
          error,
        });
      }
    });
  }

  return NextResponse.json(result);
}
