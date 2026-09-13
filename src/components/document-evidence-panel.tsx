import { FieldLabel, InfoNote } from "@/components/design-system";
import type { DocumentEvidence } from "@/lib/document-evidence";

function EvidencePreview({ evidence }: { evidence: DocumentEvidence }) {
  if (!evidence.signedUrl) {
    return (
      <div className="rounded-md border border-khata-border bg-khata-paperMuted px-3 py-3 text-sm leading-6 text-khata-muted">
        {evidence.fallback}
      </div>
    );
  }

  if (evidence.kind === "image") {
    return (
      <a href={evidence.signedUrl} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={evidence.signedUrl}
          alt={`Original evidence: ${evidence.fileName}`}
          className="max-h-80 w-full rounded-md border border-khata-border bg-khata-paper object-contain"
        />
      </a>
    );
  }

  if (evidence.kind === "pdf") {
    return (
      <object
        data={evidence.signedUrl}
        type="application/pdf"
        title={`Original evidence PDF: ${evidence.fileName}`}
        className="h-80 w-full rounded-md border border-khata-border bg-khata-paper"
      >
        <div className="rounded-md border border-khata-border bg-khata-paperMuted px-3 py-3 text-sm leading-6 text-khata-muted">
          PDF preview is unavailable in this browser.
        </div>
      </object>
    );
  }

  if (evidence.kind === "audio") {
    return (
      <audio
        controls
        preload="metadata"
        src={evidence.signedUrl}
        aria-label={`Original audio evidence: ${evidence.fileName}`}
        className="w-full"
      />
    );
  }

  return (
    <a
      href={evidence.signedUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center rounded-md border border-khata-border bg-white px-3 text-sm font-medium text-khata-green shadow-sm transition hover:border-khata-green/40 hover:bg-khata-green/5 focus:outline-none focus:ring-2 focus:ring-khata-green/40"
    >
      Open original text file
    </a>
  );
}

export function DocumentEvidencePanel({
  evidence,
  sourceText,
}: {
  evidence: DocumentEvidence;
  sourceText: string;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <div className="grid gap-1.5 text-xs leading-5 text-khata-muted">
          <div>
            <span className="font-medium text-khata-ink">File:</span>{" "}
            <span className="break-words">{evidence.fileName}</span>
          </div>
          <div>
            <span className="font-medium text-khata-ink">Type:</span>{" "}
            <span>{evidence.mimeType ?? "Unknown"}</span>
          </div>
        </div>
        <EvidencePreview evidence={evidence} />
        {evidence.signedUrl && (
          <InfoNote>
            This private preview uses a short-lived signed URL and may expire after {evidence.expiresInSeconds} seconds.
          </InfoNote>
        )}
      </div>

      <div>
        <FieldLabel>Extracted source text</FieldLabel>
        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-khata-border bg-khata-paper p-3 text-xs leading-5 text-khata-muted">
          {sourceText}
        </pre>
      </div>
    </div>
  );
}