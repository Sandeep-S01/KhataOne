import { createAdminClient } from "@/lib/supabase/server";
import {
  downloadWhatsAppMedia,
  getWhatsAppMediaUrl,
  sendWhatsAppText,
} from "@/lib/whatsapp/client";
import type {
  WhatsAppChangeValue,
  WhatsAppInboundMessage,
  WhatsAppMediaType,
  WhatsAppWebhookPayload,
} from "@/lib/whatsapp/types";

type ClientMatch = {
  id: string;
  firm_id: string;
  business_name: string;
};

export type WhatsAppInboundItem = {
  message: WhatsAppInboundMessage;
  value: WhatsAppChangeValue;
};

export type MessageResult = {
  messageId: string;
  status: "stored" | "duplicate" | "failed";
  terminalStatus?: "completed" | "failed" | "ignored" | "unmatched";
  firmId?: string | null;
  clientId?: string | null;
  whatsappMessageId?: string;
  documentId?: string;
  processingJobId?: string;
  error?: string;
};

type ProcessMessageOptions = {
  eventId?: string;
  continueExistingMessage?: boolean;
};

type AcknowledgmentResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

const mediaTypes = new Set(["image", "document", "audio", "video", "sticker"]);
const helpMenuCommands = new Set(["hi", "hello", "hey", "help", "menu", "start"]);
const khataOneWebsiteUrl = "https://khataone.vercel.app/";

export function extractWhatsAppInboundItems(
  payload: WhatsAppWebhookPayload,
): WhatsAppInboundItem[] {
  const changes = payload.entry?.flatMap((entry) => entry.changes ?? []) ?? [];

  return changes.flatMap((change) => {
    if (!change.value) {
      return [];
    }

    return (change.value.messages ?? []).map((message) => ({
      message,
      value: change.value as WhatsAppChangeValue,
    }));
  });
}

function phoneCandidates(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return Array.from(new Set([phone, digits, `+${digits}`].filter(Boolean)));
}

function receivedAtFor(message: WhatsAppInboundMessage) {
  return message.timestamp
    ? new Date(Number(message.timestamp) * 1000).toISOString()
    : new Date().toISOString();
}

function documentTypeFor(message: WhatsAppInboundMessage) {
  if (message.type === "audio") {
    return "audio_note";
  }

  if (message.type === "text") {
    return "text_note";
  }

  return "unclear";
}

function normalizeHelpMenuCommand(text?: string | null) {
  return (
    text
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/^[.,!?;:'"()[\]{}<>]+|[.,!?;:'"()[\]{}<>]+$/g, "") ?? ""
  );
}

function isHelpMenuCommand(message: WhatsAppInboundMessage) {
  if (message.type !== "text") {
    return false;
  }

  return helpMenuCommands.has(normalizeHelpMenuCommand(message.text?.body));
}

function buildMatchedHelpMenu(businessName: string) {
  const greetingName = businessName.trim() || "there";

  return `Hello ${greetingName}! Here is what you can do with KhataOne:

Send Documents
Upload invoices, receipts, PDFs, payment proofs, or accounting notes. Your CA team will review everything before it affects your books.

Send Invoice Text
Example:
Invoice INV-301 from ABC Traders dated 11 Aug 2026 total 11800 taxable 10000 CGST 900 SGST 900

Ask For Help
Type help anytime to see this menu again.

GST / Reports
Your CA team can prepare GST summaries, ledger handoff, reports, and exports from reviewed data inside KhataOne.

Website:
${khataOneWebsiteUrl}`;
}

function buildUnmatchedHelpMenu() {
  return `Hello! This is KhataOne.

You can send invoices, receipts, PDFs, payment proofs, or accounting notes here. Your CA team reviews the data before it affects your books.

This WhatsApp number is not linked to a client workspace yet. Please ask your CA team to add your WhatsApp number in KhataOne.

Website:
${khataOneWebsiteUrl}`;
}

function getMedia(message: WhatsAppInboundMessage) {
  if (!mediaTypes.has(message.type)) {
    return null;
  }

  const media = message[message.type as WhatsAppMediaType];

  if (!media?.id) {
    return null;
  }

  return media;
}

function filenameFor(message: WhatsAppInboundMessage, contentType?: string | null) {
  if (message.document?.filename) {
    return message.document.filename;
  }

  const extension = contentType?.split("/")[1]?.split(";")[0] || "bin";
  return `${message.type}-${message.id}.${extension}`;
}

async function updateWebhookEvent(
  eventId: string | undefined,
  values: Record<string, unknown>,
) {
  if (!eventId) {
    return;
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  await supabase.from("whatsapp_webhook_events").update(values).eq("id", eventId);
}

async function findClientBySender(senderPhone: string) {
  const supabase = createAdminClient();

  if (!supabase) {
    return null;
  }

  const candidates = phoneCandidates(senderPhone);
  const { data } = await supabase
    .from("clients")
    .select("id, firm_id, business_name")
    .or(
      `whatsapp_phone.in.(${candidates.join(",")}),phone.in.(${candidates.join(",")})`,
    )
    .neq("status", "archived")
    .limit(2);

  if (!data || data.length !== 1) {
    return null;
  }

  return data[0] as ClientMatch;
}

async function createProcessingJob({
  firmId,
  clientId,
  documentId,
}: {
  firmId: string;
  clientId: string;
  documentId: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return undefined;
  }

  const { data: existingJob } = await supabase
    .from("processing_jobs")
    .select("id")
    .eq("job_type", "ai_extraction")
    .eq("entity_type", "document")
    .eq("entity_id", documentId)
    .maybeSingle();

  if (existingJob?.id) {
    return existingJob.id as string;
  }

  const { data: insertedJob, error } = await supabase
    .from("processing_jobs")
    .insert({
      firm_id: firmId,
      client_id: clientId,
      job_type: "ai_extraction",
      entity_type: "document",
      entity_id: documentId,
      status: "queued",
    })
    .select("id")
    .single();

  if (insertedJob?.id) {
    return insertedJob.id as string;
  }

  if (!error) {
    return undefined;
  }

  const { data: jobAfterConflict } = await supabase
    .from("processing_jobs")
    .select("id")
    .eq("job_type", "ai_extraction")
    .eq("entity_type", "document")
    .eq("entity_id", documentId)
    .maybeSingle();

  return jobAfterConflict?.id as string | undefined;
}

async function storeMedia({
  firmId,
  clientId,
  message,
}: {
  firmId: string;
  clientId: string;
  message: WhatsAppInboundMessage;
}) {
  const supabase = createAdminClient();
  const media = getMedia(message);

  if (!supabase || !media?.id) {
    return {
      storagePath: null,
      fileName: null,
      mimeType: null,
      status: "received",
      error: null,
    };
  }

  const mediaUrl = await getWhatsAppMediaUrl(media.id);

  if (!mediaUrl.ok || !mediaUrl.media.url) {
    return {
      storagePath: null,
      fileName: null,
      mimeType: media.mime_type ?? null,
      status: "media_failed",
      error: mediaUrl.ok ? "Media URL was missing." : mediaUrl.error,
    };
  }

  const downloaded = await downloadWhatsAppMedia(mediaUrl.media.url);

  if (!downloaded.ok) {
    return {
      storagePath: null,
      fileName: null,
      mimeType: media.mime_type ?? mediaUrl.media.mime_type ?? null,
      status: "media_failed",
      error: downloaded.error,
    };
  }

  const mimeType =
    downloaded.contentType ?? media.mime_type ?? mediaUrl.media.mime_type ?? null;
  const fileName = filenameFor(message, mimeType);
  const storagePath = `${firmId}/${clientId}/${message.id}/${fileName}`;
  const { error } = await supabase.storage
    .from("whatsapp-media-raw")
    .upload(storagePath, downloaded.data, {
      contentType: mimeType ?? undefined,
      upsert: true,
    });

  if (error) {
    return {
      storagePath: null,
      fileName,
      mimeType,
      status: "media_failed",
      error: error.message,
    };
  }

  return {
    storagePath,
    fileName,
    mimeType,
    status: "media_downloaded",
    error: null,
  };
}

async function prepareAcknowledgment(eventId: string | undefined) {
  if (!eventId) {
    return { ok: true, shouldSend: true };
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      shouldSend: false,
      error: "Supabase service role is not configured.",
    };
  }

  const { data: event } = await supabase
    .from("whatsapp_webhook_events")
    .select("ack_status, ack_attempt_count, ack_last_attempt_at")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return { ok: false, shouldSend: false, error: "Webhook event was not found." };
  }

  if (event.ack_status === "sent") {
    return { ok: true, shouldSend: false };
  }

  if ((event.ack_attempt_count ?? 0) >= 3) {
    return {
      ok: false,
      shouldSend: false,
      error: "Acknowledgment attempt limit reached.",
    };
  }

  if (event.ack_status === "sending" && event.ack_last_attempt_at) {
    const lastAttemptAt = new Date(event.ack_last_attempt_at).getTime();
    const staleAt = Date.now() - 10 * 60 * 1000;

    if (Number.isFinite(lastAttemptAt) && lastAttemptAt > staleAt) {
      return { ok: true, shouldSend: false };
    }
  }

  // A stale "sending" acknowledgment is ambiguous: WhatsApp may have accepted
  // the outbound message before this worker crashed. Retry conservatively.
  const { error } = await supabase
    .from("whatsapp_webhook_events")
    .update({
      ack_status: "sending",
      ack_attempt_count: (event.ack_attempt_count ?? 0) + 1,
      ack_last_attempt_at: new Date().toISOString(),
      ack_last_error: null,
    })
    .eq("id", eventId)
    .neq("ack_status", "sent");

  if (error) {
    return { ok: false, shouldSend: false, error: error.message };
  }

  return { ok: true, shouldSend: true };
}

async function completeAcknowledgment(
  eventId: string | undefined,
  result: Awaited<ReturnType<typeof sendWhatsAppText>>,
) {
  if (!eventId) {
    return;
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("whatsapp_webhook_events")
    .update(
      result.ok
        ? {
            ack_status: "sent",
            ack_sent_at: new Date().toISOString(),
            ack_last_error: null,
          }
        : {
            ack_status: "failed",
            ack_last_error: result.error,
          },
    )
    .eq("id", eventId);
}

async function sendTrackedAcknowledgment({
  eventId,
  to,
  body,
}: {
  eventId?: string;
  to: string;
  body: string;
}): Promise<AcknowledgmentResult> {
  const prepared = await prepareAcknowledgment(eventId);

  if (!prepared.ok || !prepared.shouldSend) {
    return prepared.ok
      ? { ok: true, skipped: true }
      : {
          ok: false,
          error: prepared.error ?? "Acknowledgment could not be prepared.",
        };
  }

  const result = await sendWhatsAppText({ to, body });
  await completeAcknowledgment(eventId, result);

  return result.ok
    ? { ok: true }
    : { ok: false, error: result.error ?? "WhatsApp acknowledgment failed." };
}

export async function processWhatsAppInboundMessage(
  message: WhatsAppInboundMessage,
  value: WhatsAppChangeValue,
  options: ProcessMessageOptions = {},
): Promise<MessageResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      messageId: message.id,
      status: "failed",
      terminalStatus: "failed",
      error: "Supabase service role is not configured.",
    };
  }

  const client = await findClientBySender(message.from);
  const rawPayload = {
    message,
    value,
  };
  const receivedAt = receivedAtFor(message);

  await updateWebhookEvent(options.eventId, {
    firm_id: client?.firm_id ?? null,
    client_id: client?.id ?? null,
  });

  const { data: storedMessage, error: messageError } = await supabase
    .from("whatsapp_messages")
    .upsert(
      {
        firm_id: client?.firm_id ?? null,
        client_id: client?.id ?? null,
        provider_message_id: message.id,
        sender_phone: message.from,
        message_type: message.type,
        raw_payload: rawPayload,
        received_at: receivedAt,
        processing_status: client ? "matched" : "unmatched",
      },
      {
        onConflict: "provider_message_id",
        ignoreDuplicates: true,
      },
    )
    .select("id")
    .maybeSingle();

  if (messageError) {
    await updateWebhookEvent(options.eventId, {
      status: "failed",
      last_error: messageError.message,
    });

    return {
      messageId: message.id,
      status: "failed",
      terminalStatus: "failed",
      error: messageError.message,
    };
  }

  let messageRecord = storedMessage as { id: string } | null;

  if (!messageRecord && options.continueExistingMessage) {
    const { data: existingMessage } = await supabase
      .from("whatsapp_messages")
      .select("id")
      .eq("provider_message_id", message.id)
      .maybeSingle();

    messageRecord = existingMessage as { id: string } | null;
  }

  if (!messageRecord) {
    await updateWebhookEvent(options.eventId, {
      status: "completed",
      processed_at: new Date().toISOString(),
    });

    return {
      messageId: message.id,
      status: "duplicate",
      terminalStatus: "completed",
    };
  }

  await updateWebhookEvent(options.eventId, {
    whatsapp_message_id: messageRecord.id,
  });

  if (isHelpMenuCommand(message)) {
    const helpMenu = options.eventId
      ? await sendTrackedAcknowledgment({
          eventId: options.eventId,
          to: message.from,
          body: client
            ? buildMatchedHelpMenu(client.business_name)
            : buildUnmatchedHelpMenu(),
        })
      : await sendWhatsAppText({
          to: message.from,
          body: client
            ? buildMatchedHelpMenu(client.business_name)
            : buildUnmatchedHelpMenu(),
        });

    await supabase
      .from("whatsapp_messages")
      .update({
        processing_status: "ignored",
        raw_payload: {
          ...rawPayload,
          help_menu_response: helpMenu.ok
            ? {
                status: "sent",
              }
            : {
                status: "failed",
                error: helpMenu.error,
              },
        },
      })
      .eq("id", messageRecord.id);

    await updateWebhookEvent(options.eventId, {
      status: "ignored",
      processed_at: new Date().toISOString(),
      last_error: helpMenu.ok ? null : helpMenu.error,
    });

    return {
      messageId: message.id,
      status: "stored",
      terminalStatus: "ignored",
      firmId: client?.firm_id ?? null,
      clientId: client?.id ?? null,
      whatsappMessageId: messageRecord.id,
      error: helpMenu.ok ? undefined : helpMenu.error,
    };
  }

  if (!client) {
    await updateWebhookEvent(options.eventId, {
      status: "unmatched",
      processed_at: new Date().toISOString(),
    });

    return {
      messageId: message.id,
      status: "stored",
      terminalStatus: "unmatched",
      firmId: null,
      clientId: null,
      whatsappMessageId: messageRecord.id,
    };
  }

  const mediaResult = await storeMedia({
    firmId: client.firm_id,
    clientId: client.id,
    message,
  });

  const isText = message.type === "text";
  const sourceText = isText ? message.text?.body ?? null : null;
  const { data: existingDocument } = await supabase
    .from("documents")
    .select("id")
    .eq("whatsapp_message_id", messageRecord.id)
    .maybeSingle();

  let document = existingDocument as { id: string } | null;

  if (!document) {
    const { data: insertedDocument, error: documentError } = await supabase
      .from("documents")
      .insert({
        firm_id: client.firm_id,
        client_id: client.id,
        whatsapp_message_id: messageRecord.id,
        document_type: documentTypeFor(message),
        file_name: mediaResult.fileName,
        file_mime_type: mediaResult.mimeType,
        storage_path: mediaResult.storagePath,
        source_text: sourceText,
        status: mediaResult.status === "media_failed" ? "media_failed" : "queued",
        received_at: receivedAt,
      })
      .select("id")
      .single();

    if (documentError) {
      const { data: documentAfterConflict } = await supabase
        .from("documents")
        .select("id")
        .eq("whatsapp_message_id", messageRecord.id)
        .maybeSingle();

      if (documentAfterConflict?.id) {
        document = documentAfterConflict as { id: string };
      } else {
        await updateWebhookEvent(options.eventId, {
          status: "failed",
          last_error: documentError.message,
        });

        return {
          messageId: message.id,
          status: "failed",
          terminalStatus: "failed",
          firmId: client.firm_id,
          clientId: client.id,
          whatsappMessageId: messageRecord.id,
          error: documentError.message,
        };
      }
    }

    if (insertedDocument) {
      document = insertedDocument as { id: string };
    }
  } else if (mediaResult.status === "media_downloaded") {
    await supabase
      .from("documents")
      .update({
        file_name: mediaResult.fileName,
        file_mime_type: mediaResult.mimeType,
        storage_path: mediaResult.storagePath,
        status: "queued",
      })
      .eq("id", document.id);
  }

  await updateWebhookEvent(options.eventId, {
    document_id: document?.id ?? null,
  });

  let processingJobId: string | undefined;

  if (document) {
    processingJobId = await createProcessingJob({
      firmId: client.firm_id,
      clientId: client.id,
      documentId: document.id,
    });
  }

  await updateWebhookEvent(options.eventId, {
    processing_job_id: processingJobId ?? null,
  });

  await supabase
    .from("whatsapp_messages")
    .update({
      processing_status:
        mediaResult.status === "media_failed" ? "media_failed" : "queued",
    })
    .eq("id", messageRecord.id);

  const acknowledgment = options.eventId
    ? await sendTrackedAcknowledgment({
        eventId: options.eventId,
        to: message.from,
        body:
          "KhataOne received your document. Your CA team will review it before it affects your books.",
      })
    : await sendWhatsAppText({
        to: message.from,
        body:
          "KhataOne received your document. Your CA team will review it before it affects your books.",
      });

  await supabase
    .from("whatsapp_messages")
    .update({
      raw_payload: {
        ...rawPayload,
        acknowledgment: acknowledgment.ok
          ? {
              status: "sent",
            }
          : {
              status: "failed",
              error: acknowledgment.error,
            },
      },
    })
    .eq("id", messageRecord.id);

  const terminalStatus =
    mediaResult.error || !acknowledgment.ok ? "failed" : "completed";

  await updateWebhookEvent(options.eventId, {
    status: terminalStatus,
    processed_at: terminalStatus === "completed" ? new Date().toISOString() : null,
    last_error:
      mediaResult.error ?? (!acknowledgment.ok ? acknowledgment.error : null),
  });

  return {
    messageId: message.id,
    status: "stored",
    terminalStatus,
    firmId: client.firm_id,
    clientId: client.id,
    whatsappMessageId: messageRecord.id,
    documentId: document?.id,
    processingJobId,
    error: mediaResult.error ?? (!acknowledgment.ok ? acknowledgment.error : undefined),
  };
}

export async function processWhatsAppWebhook(payload: WhatsAppWebhookPayload) {
  const messages = extractWhatsAppInboundItems(payload);
  const results: MessageResult[] = [];

  for (const item of messages) {
    results.push(await processWhatsAppInboundMessage(item.message, item.value));
  }

  return {
    received: messages.length,
    results,
  };
}
