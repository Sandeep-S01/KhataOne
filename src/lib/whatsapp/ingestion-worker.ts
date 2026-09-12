import { captureOperationalError } from "@/lib/observability";
import { runKeyedWorkerPool } from "@/lib/jobs/keyed-worker-pool";
import { retryAtIso } from "@/lib/jobs/retry";
import { withServerTiming } from "@/lib/performance";
import { createAdminClient } from "@/lib/supabase/server";
import {
  extractWhatsAppInboundItems,
  processWhatsAppInboundMessage,
} from "@/lib/whatsapp/ingestion";
import type {
  WhatsAppChangeValue,
  WhatsAppInboundMessage,
  WhatsAppWebhookPayload,
} from "@/lib/whatsapp/types";

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;
const STALE_AFTER = "10 minutes";
const INGESTION_CONCURRENCY = 3;

type ClaimedWebhookEvent = {
  id: string;
  provider_message_id: string;
  raw_payload: unknown;
  message_payload: unknown;
  status: string;
  attempt_count: number;
  ack_status: string;
  ack_attempt_count: number;
  locked_at: string | null;
  created_at: string;
};

type InboundMessagePayload = {
  message: WhatsAppInboundMessage;
  value: WhatsAppChangeValue;
};

type EventRunResult = {
  eventId: string;
  providerMessageId: string;
  status: "completed" | "failed" | "ignored" | "unmatched" | "retrying";
  message: string;
  documentId?: string;
  processingJobId?: string;
  processingJobCreated?: boolean;
  firmId?: string | null;
  clientId?: string | null;
  retryAt?: string;
};

export type QueuedWhatsAppIngestionRunResult = {
  ok: boolean;
  workerId: string;
  claimed: number;
  processed: number;
  completed: number;
  failed: number;
  ignored: number;
  unmatched: number;
  retrying: number;
  results: EventRunResult[];
  error?: string;
};

function normalizeBatchSize(batchSize?: number) {
  if (!batchSize || !Number.isFinite(batchSize)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(Math.floor(batchSize), MAX_BATCH_SIZE));
}

function receivedAtFor(message: WhatsAppInboundMessage) {
  return message.timestamp
    ? new Date(Number(message.timestamp) * 1000).toISOString()
    : new Date().toISOString();
}

function parseInboundMessagePayload(payload: unknown): InboundMessagePayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as {
    message?: WhatsAppInboundMessage;
    value?: WhatsAppChangeValue;
  };

  if (
    !candidate.message ||
    typeof candidate.message.id !== "string" ||
    typeof candidate.message.from !== "string" ||
    typeof candidate.message.type !== "string" ||
    !candidate.value
  ) {
    return null;
  }

  return {
    message: candidate.message,
    value: candidate.value,
  };
}

function eventOrderingKey(event: ClaimedWebhookEvent) {
  const sender = parseInboundMessagePayload(event.message_payload)?.message.from;
  const normalized = sender?.replace(/[^\d]/g, "");
  return normalized ? `sender:${normalized}` : `event:${event.id}`;
}

async function markEventFailure({
  eventId,
  error,
}: {
  eventId: string;
  error: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("whatsapp_webhook_events")
    .update({
      status: "failed",
      last_error: error,
      locked_at: null,
      locked_by: null,
    })
    .eq("id", eventId);
}

export async function enqueueWhatsAppWebhookEvents(payload: WhatsAppWebhookPayload) {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      accepted: 0,
      duplicateOrExisting: 0,
      error: "Supabase service role is not configured.",
    };
  }

  const items = extractWhatsAppInboundItems(payload);
  let accepted = 0;
  let duplicateOrExisting = 0;

  for (const item of items) {
    const { data: insertedEvent, error } = await supabase
      .from("whatsapp_webhook_events")
      .upsert(
        {
          provider_message_id: item.message.id,
          raw_payload: payload,
          message_payload: item,
          status: "queued",
          received_at: receivedAtFor(item.message),
        },
        {
          onConflict: "provider_message_id",
          ignoreDuplicates: true,
        },
      )
      .select("id")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        accepted,
        duplicateOrExisting,
        error: error.message,
      };
    }

    if (insertedEvent) {
      accepted += 1;
    } else {
      duplicateOrExisting += 1;
    }
  }

  return {
    ok: true,
    accepted,
    duplicateOrExisting,
    received: items.length,
  };
}

async function processClaimedEvent(
  event: ClaimedWebhookEvent,
): Promise<EventRunResult> {
  const payload = parseInboundMessagePayload(event.message_payload);

  if (!payload) {
    const message = "Webhook event payload is missing a valid WhatsApp message.";
    await markEventFailure({ eventId: event.id, error: message });

    return {
      eventId: event.id,
      providerMessageId: event.provider_message_id,
      status: "failed",
      message,
    };
  }

  try {
    const createdAt = Date.parse(event.created_at);
    const queueWaitMs = Number.isFinite(createdAt)
      ? Math.max(Date.now() - createdAt, 0)
      : null;
    const result = await withServerTiming(
      "whatsapp.ingestion.event",
      () =>
        processWhatsAppInboundMessage(payload.message, payload.value, {
          eventId: event.id,
          continueExistingMessage: true,
        }),
      {
        attempt_count: event.attempt_count,
        message_type: payload.message.type,
        queue_wait_ms: queueWaitMs,
      },
    );

    if (
      result.terminalStatus === "failed" &&
      result.retryable &&
      event.attempt_count < MAX_ATTEMPTS
    ) {
      const retryAt = retryAtIso({
        attemptCount: event.attempt_count,
        retryAfterMs: result.retryAfterMs,
      });
      const supabase = createAdminClient();

      if (supabase) {
        const { error: rescheduleError } = await supabase
          .from("whatsapp_webhook_events")
          .update({
            status: "queued",
            scheduled_at: retryAt,
            locked_at: null,
            locked_by: null,
            processed_at: null,
          })
          .eq("id", event.id);

        if (rescheduleError) {
          throw new Error("WhatsApp ingestion retry could not be scheduled.");
        }
      } else {
        throw new Error("WhatsApp ingestion retry could not be scheduled.");
      }

      return {
        eventId: event.id,
        providerMessageId: event.provider_message_id,
        status: "retrying",
        message: result.error ?? "WhatsApp ingestion retry scheduled.",
        documentId: result.documentId,
        processingJobId: result.processingJobId,
        processingJobCreated: result.processingJobCreated,
        firmId: result.firmId,
        clientId: result.clientId,
        retryAt,
      };
    }

    return {
      eventId: event.id,
      providerMessageId: event.provider_message_id,
      status: result.terminalStatus ?? (result.status === "failed" ? "failed" : "completed"),
      message: result.error ?? result.status,
      documentId: result.documentId,
      processingJobId: result.processingJobId,
      processingJobCreated: result.processingJobCreated,
      firmId: result.firmId,
      clientId: result.clientId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WhatsApp ingestion worker failed.";

    captureOperationalError({
      area: "whatsapp-ingestion-worker-process",
      error,
      context: {
        event_id: event.id,
        provider_message_id: event.provider_message_id,
      },
    });

    await markEventFailure({ eventId: event.id, error: message });

    return {
      eventId: event.id,
      providerMessageId: event.provider_message_id,
      status: "failed",
      message,
    };
  }
}

export async function runQueuedWhatsAppIngestionEvents({
  batchSize,
  workerId = `khataone-whatsapp-worker-${Date.now()}`,
}: {
  batchSize?: number;
  workerId?: string;
} = {}): Promise<QueuedWhatsAppIngestionRunResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      ignored: 0,
      unmatched: 0,
      retrying: 0,
      results: [],
      error: "Supabase service role is not configured.",
    };
  }

  const { data, error } = await supabase.rpc("claim_whatsapp_webhook_events", {
    batch_size: normalizeBatchSize(batchSize),
    worker_id: workerId,
    stale_after: STALE_AFTER,
    max_attempts: MAX_ATTEMPTS,
  });

  if (error) {
    captureOperationalError({
      area: "whatsapp-ingestion-worker-claim",
      error,
    });

    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      ignored: 0,
      unmatched: 0,
      retrying: 0,
      results: [],
      error: error.message,
    };
  }

  const events = (data ?? []) as ClaimedWebhookEvent[];
  const results = await runKeyedWorkerPool({
    items: events,
    concurrency: INGESTION_CONCURRENCY,
    keyFor: eventOrderingKey,
    worker: processClaimedEvent,
  });

  const completed = results.filter((result) => result.status === "completed").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const ignored = results.filter((result) => result.status === "ignored").length;
  const unmatched = results.filter((result) => result.status === "unmatched").length;
  const retrying = results.filter((result) => result.status === "retrying").length;

  return {
    ok: failed === 0,
    workerId,
    claimed: events.length,
    processed: results.length,
    completed,
    failed,
    ignored,
    unmatched,
    retrying,
    results,
  };
}
