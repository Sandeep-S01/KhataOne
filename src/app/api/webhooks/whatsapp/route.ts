import { NextResponse, type NextRequest } from "next/server";

import { getOptionalServerEnv } from "@/lib/env";
import { captureOperationalError } from "@/lib/observability";
import {
  checkRateLimit,
  clientRateLimitKey,
  retryAfterSeconds,
} from "@/lib/rate-limit";
import { enqueueWhatsAppWebhookEvents } from "@/lib/whatsapp/ingestion-worker";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/types";
import { verifyMetaSignature } from "@/lib/whatsapp/verify";

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
  const rateLimit = checkRateLimit({
    key: clientRateLimitKey({
      scope: "whatsapp-webhook",
      forwardedFor: request.headers.get("x-forwarded-for"),
      realIp: request.headers.get("x-real-ip"),
      fallback: "meta-webhook",
    }),
    limit: 240,
    windowMs: 60_000,
  });

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

  const result = await enqueueWhatsAppWebhookEvents(payload).catch(
    (error: unknown) => {
      captureOperationalError({
        area: "whatsapp-webhook-enqueue",
        error,
      });

      throw error;
    },
  );

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

  return NextResponse.json(result);
}
