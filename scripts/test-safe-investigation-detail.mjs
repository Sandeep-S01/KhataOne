import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const auditDisplay = read("src/lib/audit-display.ts");
const auditPage = read("src/app/(dashboard)/dashboard/audit-logs/page.tsx");
const operationsPage = read("src/app/(dashboard)/dashboard/operations/page.tsx");
const designSystem = read("src/components/design-system.tsx");

assert(
  auditDisplay.includes("metadataAllowlist") &&
    auditDisplay.includes("changeAllowlist"),
  "Audit display helper must keep metadata and before/after disclosure behind explicit allowlists.",
);

for (const unsafe of [
  "raw",
  "payload",
  "provider",
  "secret",
  "signed",
  "storage",
  "token",
  "url",
  "webhook",
]) {
  assert(
    auditDisplay.includes("unsafeKeyPattern") && auditDisplay.includes(unsafe),
    `Audit display helper must deny unsafe key family: ${unsafe}.`,
  );
}

for (const route of [
  "/dashboard/clients/",
  "/dashboard/gst-summary/",
  "/dashboard/ledger/",
  "/dashboard/review-queue/",
  "/dashboard/exports",
  "/dashboard/operations",
]) {
  assert(
    auditDisplay.includes(route),
    `Audit entity links must be allowlisted to internal route: ${route}.`,
  );
}

assert(
  auditPage.includes("before_data, after_data, metadata") &&
    auditPage.includes("safeAuditChangeEntries") &&
    auditPage.includes("safeAuditMetadataEntries") &&
    auditPage.includes("Safe investigation detail"),
  "Audit Logs page must render allowlisted before/after and metadata details.",
);

assert(
  !auditPage.includes("JSON.stringify(log.metadata)") &&
    !auditPage.includes("JSON.stringify(log.before_data)") &&
    !auditPage.includes("JSON.stringify(log.after_data)"),
  "Audit Logs page must not dump raw metadata or before/after JSON.",
);

assert(
  designSystem.includes("truncate = true") &&
    designSystem.includes("truncate?: boolean") &&
    designSystem.includes("whitespace-normal break-words"),
  "InlineAlert must support non-truncated, wrapping safe detail text.",
);

assert(
  operationsPage.includes("safeOperationsErrorMessage") &&
    operationsPage.includes("truncate={false}") &&
    !operationsPage.includes("slice(0, 140)") &&
    !operationsPage.includes("safeErrorMessage"),
  "Operations must render complete sanitized errors instead of slicing to 140 characters.",
);

assert(
  auditDisplay.includes("[redacted link]") &&
    auditDisplay.includes("[redacted token]"),
  "Operations error display must redact links and token-shaped values.",
);

console.log("Safe investigation detail contracts passed.");
