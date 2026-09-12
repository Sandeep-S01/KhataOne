import { getOptionalServerEnv } from "@/lib/env";

type SendTextArgs = { to: string; body: string };

type MediaLookupResult = {
  id?: string;
  url?: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
};

type GraphFailure = {
  ok: false;
  error: string;
  retryable: boolean;
  retryAfterMs?: number;
};

type SendTextResult =
  | { ok: true; providerMessageId?: string }
  | GraphFailure;

type MediaUrlResult =
  | { ok: true; media: MediaLookupResult }
  | GraphFailure;

type MediaDownloadResult =
  | { ok: true; data: Buffer; contentType: string | null }
  | GraphFailure;

type GraphRequest =
  | GraphFailure
  | {
      ok: true;
      response: Response;
      controller: AbortController;
      cleanup: () => void;
    };

const DEFAULT_GRAPH_TIMEOUT_MS = 10_000;
const MAX_GRAPH_BODY_BYTES = 4_096;
function graphBaseUrl() {
  const version = getOptionalServerEnv("WHATSAPP_GRAPH_API_VERSION") || "v21.0";
  return `https://graph.facebook.com/${version}`;
}

function graphTimeoutMs() {
  const configured = Number(getOptionalServerEnv("WHATSAPP_GRAPH_TIMEOUT_MS"));
  return Number.isInteger(configured)
    ? Math.min(Math.max(configured, 1_000), 60_000)
    : DEFAULT_GRAPH_TIMEOUT_MS;
}

function parseRetryAfterMs(response: Response) {
  const value = response.headers.get("retry-after")?.trim();

  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, 15 * 60 * 1_000);
  }

  const date = Date.parse(value);
  return Number.isFinite(date)
    ? Math.min(Math.max(date - Date.now(), 0), 15 * 60 * 1_000)
    : undefined;
}

async function readBoundedJson(response: Response) {
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteCount = 0;

  try {
    while (byteCount < MAX_GRAPH_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;

      const remaining = MAX_GRAPH_BODY_BYTES - byteCount;
      const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      byteCount += chunk.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const bytes = new Uint8Array(byteCount);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return null;
  }
}

function safeErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return undefined;

  const value = (error as { code?: unknown; type?: unknown }).code ??
    (error as { type?: unknown }).type;
  const normalized = String(value ?? "")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 80);
  return normalized || undefined;
}

async function graphFailure(response: Response): Promise<GraphFailure> {
  const code = safeErrorCode(await readBoundedJson(response));
  const retryable =
    [408, 409, 429].includes(response.status) || response.status >= 500;

  return {
    ok: false,
    error: `WhatsApp Graph request failed (HTTP ${response.status}${code ? `, code ${code}` : ""}).`,
    retryable,
    retryAfterMs: retryable ? parseRetryAfterMs(response) : undefined,
  };
}

async function graphFetch(
  input: string,
  init: RequestInit = {},
): Promise<GraphRequest> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), graphTimeoutMs());

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return {
      ok: true,
      response,
      controller,
      cleanup: () => clearTimeout(timeout),
    };
  } catch {
    clearTimeout(timeout);
    return {
      ok: false,
      error: controller.signal.aborted
        ? "WhatsApp Graph request timed out."
        : "WhatsApp Graph request could not connect.",
      retryable: true,
    };
  }
}

async function consumeGraphResponse<T>(
  request: GraphRequest,
  consume: (response: Response) => Promise<T>,
): Promise<T | GraphFailure> {
  if (!request.ok) return request;

  try {
    return await consume(request.response);
  } catch {
    return {
      ok: false,
      error: request.controller.signal.aborted
        ? "WhatsApp Graph request timed out."
        : "WhatsApp Graph response could not be read.",
      retryable: true,
    };
  } finally {
    request.cleanup();
  }
}

export function hasWhatsAppOutboundConfig() {
  return Boolean(
    getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN") &&
      getOptionalServerEnv("WHATSAPP_PHONE_NUMBER_ID"),
  );
}

export async function sendWhatsAppText({
  to,
  body,
}: SendTextArgs): Promise<SendTextResult> {
  const accessToken = getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = getOptionalServerEnv("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    return { ok: false as const, error: "WhatsApp outbound config is missing.", retryable: false };
  }

  const request = await graphFetch(`${graphBaseUrl()}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: false, body },
    }),
  });

  return consumeGraphResponse(request, async (response): Promise<SendTextResult> => {
    if (!response.ok) return graphFailure(response);
    const payload = await readBoundedJson(response) as
      | { messages?: Array<{ id?: string }> }
      | null;
    return { ok: true, providerMessageId: payload?.messages?.[0]?.id };
  });
}

export async function getWhatsAppMediaUrl(
  mediaId: string,
): Promise<MediaUrlResult> {
  const accessToken = getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN");
  if (!accessToken) {
    return { ok: false as const, error: "WhatsApp access token is missing.", retryable: false };
  }

  const request = await graphFetch(`${graphBaseUrl()}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return consumeGraphResponse(request, async (response): Promise<MediaUrlResult> => {
    if (!response.ok) return graphFailure(response);
    return {
      ok: true,
      media: (await readBoundedJson(response)) as MediaLookupResult,
    };
  });
}

export async function downloadWhatsAppMedia(
  url: string,
): Promise<MediaDownloadResult> {
  const accessToken = getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN");
  if (!accessToken) {
    return { ok: false as const, error: "WhatsApp access token is missing.", retryable: false };
  }

  const request = await graphFetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return consumeGraphResponse(
    request,
    async (response): Promise<MediaDownloadResult> => {
      if (!response.ok) return graphFailure(response);
      return {
        ok: true,
        data: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get("content-type"),
      };
    },
  );
}
