import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCUMENT_EVIDENCE_BUCKET = "whatsapp-media-raw";
export const DOCUMENT_EVIDENCE_SIGNED_URL_TTL_SECONDS = 120;

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const pdfMimeTypes = new Set(["application/pdf"]);
const textMimeTypes = new Set(["text/plain"]);
const audioMimeTypes = new Set([
  "audio/aac",
  "audio/amr",
  "audio/m4a",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
]);

type EvidenceKind = "image" | "pdf" | "text" | "audio" | "unsupported";

export type DocumentEvidenceInput = {
  file_name: string | null;
  file_mime_type: string | null;
  storage_path: string | null;
  source_text: string | null;
};

export type DocumentEvidence = {
  bucket: typeof DOCUMENT_EVIDENCE_BUCKET;
  fileName: string;
  mimeType: string | null;
  storagePathPresent: boolean;
  kind: EvidenceKind;
  signedUrl: string | null;
  expiresInSeconds: typeof DOCUMENT_EVIDENCE_SIGNED_URL_TTL_SECONDS;
  status: "ready" | "missing_path" | "unsupported_type" | "preview_unavailable";
  fallback: string;
};

function cleanMimeType(value: string | null) {
  return value?.split(";")[0]?.trim().toLowerCase() ?? null;
}

function evidenceKind(mimeType: string | null, fileName: string): EvidenceKind {
  const extension = fileName.split(".").at(-1)?.toLowerCase();

  if (mimeType && imageMimeTypes.has(mimeType)) {
    return "image";
  }

  if (mimeType && pdfMimeTypes.has(mimeType)) {
    return "pdf";
  }

  if (mimeType && textMimeTypes.has(mimeType)) {
    return "text";
  }

  if (mimeType && audioMimeTypes.has(mimeType)) {
    return "audio";
  }

  if (!mimeType && extension === "pdf") {
    return "pdf";
  }

  if (!mimeType && ["jpg", "jpeg", "png", "webp"].includes(extension ?? "")) {
    return "image";
  }

  if (!mimeType && ["txt", "csv"].includes(extension ?? "")) {
    return "text";
  }

  if (!mimeType && ["aac", "amr", "m4a", "mp3", "ogg", "wav", "webm"].includes(extension ?? "")) {
    return "audio";
  }

  return "unsupported";
}

function cleanStoragePath(path: string | null) {
  if (!path) {
    return null;
  }

  const trimmed = path.trim();

  if (
    !trimmed ||
    trimmed.startsWith("/") ||
    trimmed.includes("..") ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return null;
  }

  return trimmed.startsWith(`${DOCUMENT_EVIDENCE_BUCKET}/`)
    ? trimmed.slice(DOCUMENT_EVIDENCE_BUCKET.length + 1)
    : trimmed;
}

function fallbackMessage({
  kind,
  storagePathPresent,
  sourceText,
}: {
  kind: EvidenceKind;
  storagePathPresent: boolean;
  sourceText: string | null;
}) {
  if (!storagePathPresent) {
    return sourceText?.trim()
      ? "Original media is not linked; review the extracted source text below."
      : "No original media or extracted source text is available for this transaction.";
  }

  if (kind === "unsupported") {
    return sourceText?.trim()
      ? "Original media type is not previewable here; review the extracted source text below."
      : "Original media type is not previewable here and no extracted source text is available.";
  }

  return sourceText?.trim()
    ? "Original preview is temporarily unavailable; review the extracted source text below."
    : "Original preview is temporarily unavailable and no extracted source text is available.";
}

export async function getDocumentEvidence({
  document,
  supabase,
}: {
  document: DocumentEvidenceInput | null | undefined;
  supabase: Pick<SupabaseClient, "storage">;
}): Promise<DocumentEvidence> {
  const fileName = document?.file_name?.trim() || "Original document";
  const mimeType = cleanMimeType(document?.file_mime_type ?? null);
  const storagePath = cleanStoragePath(document?.storage_path ?? null);
  const kind = evidenceKind(mimeType, fileName);
  const storagePathPresent = Boolean(storagePath);
  const fallback = fallbackMessage({
    kind,
    storagePathPresent,
    sourceText: document?.source_text ?? null,
  });

  const baseEvidence = {
    bucket: DOCUMENT_EVIDENCE_BUCKET,
    fileName,
    mimeType,
    storagePathPresent,
    kind,
    signedUrl: null,
    expiresInSeconds: DOCUMENT_EVIDENCE_SIGNED_URL_TTL_SECONDS,
    fallback,
  } satisfies Omit<DocumentEvidence, "status">;

  if (!storagePath) {
    return { ...baseEvidence, status: "missing_path" };
  }

  if (kind === "unsupported") {
    return { ...baseEvidence, status: "unsupported_type" };
  }

  const { data, error } = await supabase.storage
    .from(DOCUMENT_EVIDENCE_BUCKET)
    .createSignedUrl(storagePath, DOCUMENT_EVIDENCE_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return { ...baseEvidence, status: "preview_unavailable" };
  }

  return {
    ...baseEvidence,
    signedUrl: data.signedUrl,
    status: "ready",
  };
}