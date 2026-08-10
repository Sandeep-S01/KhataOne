import { getOptionalServerEnv } from "@/lib/env";

type SendTextArgs = {
  to: string;
  body: string;
};

type MediaLookupResult = {
  id?: string;
  url?: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
};

function graphBaseUrl() {
  const version = getOptionalServerEnv("WHATSAPP_GRAPH_API_VERSION") || "v21.0";
  return `https://graph.facebook.com/${version}`;
}

export function hasWhatsAppOutboundConfig() {
  return Boolean(
    getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN") &&
      getOptionalServerEnv("WHATSAPP_PHONE_NUMBER_ID"),
  );
}

export async function sendWhatsAppText({ to, body }: SendTextArgs) {
  const accessToken = getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = getOptionalServerEnv("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: "WhatsApp outbound config is missing." };
  }

  const response = await fetch(`${graphBaseUrl()}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        preview_url: false,
        body,
      },
    }),
  });

  if (!response.ok) {
    return { ok: false, error: await response.text() };
  }

  return { ok: true };
}

export async function getWhatsAppMediaUrl(mediaId: string) {
  const accessToken = getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN");

  if (!accessToken) {
    return { ok: false as const, error: "WhatsApp access token is missing." };
  }

  const response = await fetch(`${graphBaseUrl()}/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return { ok: false as const, error: await response.text() };
  }

  return {
    ok: true as const,
    media: (await response.json()) as MediaLookupResult,
  };
}

export async function downloadWhatsAppMedia(url: string) {
  const accessToken = getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN");

  if (!accessToken) {
    return { ok: false as const, error: "WhatsApp access token is missing." };
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return { ok: false as const, error: await response.text() };
  }

  return {
    ok: true as const,
    data: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type"),
  };
}
