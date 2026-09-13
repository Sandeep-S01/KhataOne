import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const documentEvidence = readFileSync("src/lib/document-evidence.ts", "utf8");
const evidencePanel = readFileSync("src/components/document-evidence-panel.tsx", "utf8");
const reviewPage = readFileSync("src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx", "utf8");
const reviewWorkspace = readFileSync("src/components/transaction-review-workspace.tsx", "utf8");
const gstDetail = readFileSync("src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(documentEvidence, /DOCUMENT_EVIDENCE_BUCKET = "whatsapp-media-raw"/, "document evidence uses the existing private WhatsApp media bucket");
assert.match(documentEvidence, /DOCUMENT_EVIDENCE_SIGNED_URL_TTL_SECONDS = 120/, "signed evidence URLs stay short-lived");
assert.match(documentEvidence, /createSignedUrl\(storagePath, DOCUMENT_EVIDENCE_SIGNED_URL_TTL_SECONDS\)/, "evidence helper creates signed URLs instead of public URLs");
assert.doesNotMatch(documentEvidence, /getPublicUrl\(/, "evidence helper must not create public document URLs");
assert.match(documentEvidence, /startsWith\("\/"\)/, "storage paths reject absolute paths");
assert.match(documentEvidence, /includes\("\.\."\)/, "storage paths reject traversal segments");
assert.match(documentEvidence, /\^https\?:\\\/\\\//, "storage paths reject external URLs");

for (const mime of ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain", "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm"]) {
  assert.match(documentEvidence, new RegExp(mime.replace("/", "\\/")), `evidence helper recognizes ${mime}`);
}

assert.match(evidencePanel, /Original evidence:/, "image previews have contextual alt text");
assert.match(evidencePanel, /Original evidence PDF:/, "PDF previews have a title");
assert.match(evidencePanel, /Original audio evidence:/, "audio previews have an aria label");
assert.match(evidencePanel, /short-lived signed URL/, "UI explains signed URL expiry without exposing storage internals");
assert.match(evidencePanel, /Extracted source text/, "original preview remains paired with extracted source text");

assert.match(reviewPage, /getDocumentEvidence\(\{ document, supabase \}\)/, "review detail obtains evidence after firm-scoped transaction load");
assert.match(reviewPage, /DocumentEvidencePanel evidence=\{evidence\} sourceText=\{sourceText\}/, "read-only review detail renders the evidence panel");
assert.match(reviewWorkspace, /evidence: DocumentEvidence/, "editable review workspace receives evidence explicitly");
assert.match(reviewWorkspace, /DocumentEvidencePanel evidence=\{evidence\} sourceText=\{sourceText\}/, "editable review workspace renders original evidence and source text");

assert.match(gstDetail, /title="Saved GST summary"/, "GST detail labels generated totals as a saved summary");
assert.match(gstDetail, /not a live recalculation of the rows below/, "GST detail explains saved totals do not recalculate from live rows");
assert.match(gstDetail, /Generated \{generationTime\}/, "GST detail shows saved generation time near totals");
assert.match(gstDetail, /title="Current period transactions"/, "GST source table is labeled as current/live data");
assert.match(gstDetail, /not a persisted generation snapshot/, "GST detail avoids implying live rows are persisted snapshot membership");
assert.match(gstDetail, /current blockers/, "GST detail exposes current unresolved blocker count");
assert.match(gstDetail, /\.gte\("transaction_date", period\.period_start\)/, "GST current source scope keeps the existing period start boundary");
assert.match(gstDetail, /\.lte\("transaction_date", period\.period_end\)/, "GST current source scope keeps the existing period end boundary");
assert.doesNotMatch(gstDetail, /\.eq\("status", "approved"\)/, "GST detail does not silently change source row accounting semantics in a UI provenance slice");

assert.equal(packageJson.scripts["test:evidence-provenance"], "node scripts/test-evidence-provenance.mjs", "package exposes the evidence/provenance test script");

console.log("Evidence and GST provenance source checks passed.");