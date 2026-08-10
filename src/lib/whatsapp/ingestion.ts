import { createAdminClient } from "@/lib/supabase/server";
import {
  downloadWhatsAppMedia,
  getWhatsAppMediaUrl,
  sendWhatsAppText,
} from "@/lib/whatsapp/client";
import type {
  WhatsAppInboundMessage,
  WhatsAppMediaType,
  WhatsAppWebhookPayload,
} from "@/lib/whatsapp/types";

type ClientMatch = {
  id: string;
  firm_id: string;
  business_name: string;
};

type MessageResult = {
  messageId: string;
  status: "stored" | "duplicate" | "failed";
  error?: string;
};

const mediaTypes = new Set(["image", "document", "audio", "video", "sticker"]);

function phoneCandidates(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return Array.from(new Set([phone, digits, `+${digits}`].filter(Boolean)));
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
    return;
  }

  await supabase.from("processing_jobs").insert({
    firm_id: firmId,
    client_id: clientId,
    job_type: "ai_extraction",
    entity_type: "document",
    entity_id: documentId,
    status: "queued",
  });
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

async function processMessage(
  message: WhatsAppInboundMessage,
  value: unknown,
): Promise<MessageResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      messageId: message.id,
      status: "failed",
      error: "Supabase service role is not configured.",
    };
  }

  const client = await findClientBySender(message.from);
  const rawPayload = {
    message,
    value,
  };

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
        received_at: message.timestamp
          ? new Date(Number(message.timestamp) * 1000).toISOString()
          : new Date().toISOString(),
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
    return {
      messageId: message.id,
      status: "failed",
      error: messageError.message,
    };
  }

  if (!storedMessage) {
    return {
      messageId: message.id,
      status: "duplicate",
    };
  }

  if (!client) {
    return {
      messageId: message.id,
      status: "stored",
    };
  }

  const mediaResult = await storeMedia({
    firmId: client.firm_id,
    clientId: client.id,
    message,
  });

  const isText = message.type === "text";
  const sourceText = isText ? message.text?.body ?? null : null;
  const { data: document } = await supabase
    .from("documents")
    .insert({
      firm_id: client.firm_id,
      client_id: client.id,
      whatsapp_message_id: storedMessage.id,
      document_type: documentTypeFor(message),
      file_name: mediaResult.fileName,
      file_mime_type: mediaResult.mimeType,
      storage_path: mediaResult.storagePath,
      source_text: sourceText,
      status: mediaResult.status === "media_failed" ? "media_failed" : "queued",
      received_at: message.timestamp
        ? new Date(Number(message.timestamp) * 1000).toISOString()
        : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (document) {
    await createProcessingJob({
      firmId: client.firm_id,
      clientId: client.id,
      documentId: document.id,
    });
  }

  await supabase
    .from("whatsapp_messages")
    .update({
      processing_status:
        mediaResult.status === "media_failed" ? "media_failed" : "queued",
    })
    .eq("id", storedMessage.id);

  const acknowledgment = await sendWhatsAppText({
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
    .eq("id", storedMessage.id);

  return {
    messageId: message.id,
    status: "stored",
    error: mediaResult.error ?? (!acknowledgment.ok ? acknowledgment.error : undefined),
  };
}

export async function processWhatsAppWebhook(payload: WhatsAppWebhookPayload) {
  const values =
    payload.entry
      ?.flatMap((entry) => entry.changes ?? [])
      .map((change) => change.value)
      .filter(Boolean) ?? [];

  const messages = values.flatMap((value) =>
    (value?.messages ?? []).map((message) => ({ message, value })),
  );

  const results: MessageResult[] = [];

  for (const item of messages) {
    results.push(await processMessage(item.message, item.value));
  }

  return {
    received: messages.length,
    results,
  };
}
