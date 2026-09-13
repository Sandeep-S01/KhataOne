import type { Route } from "next";

type JsonRecord = Record<string, unknown>;

type AuditDetail = {
  label: string;
  value: string;
  mono?: boolean;
};

type AuditChange = {
  label: string;
  before: string;
  after: string;
  mono?: boolean;
};

const metadataAllowlist: Record<string, { label: string; mono?: boolean }> = {
  approval_boundary: { label: "Approval boundary" },
  boundary: { label: "Boundary" },
  correction_note: { label: "Correction note" },
  direct_filing: { label: "Direct GST filing" },
  direct_gst_filing: { label: "Direct GST filing" },
  export_type: { label: "Export type" },
  gst_period_id: { label: "GST period", mono: true },
  job_type: { label: "Job type" },
  ledger_entry_id: { label: "Ledger entry", mono: true },
  requested_period_end: { label: "Requested period end", mono: true },
  requested_period_start: { label: "Requested period start", mono: true },
  source: { label: "Source" },
  source_transaction_id: { label: "Source transaction", mono: true },
  transaction_id: { label: "Transaction", mono: true },
};

const changeAllowlist: Record<string, Record<string, { label: string; mono?: boolean }>> = {
  client: {
    business_name: { label: "Business name" },
    contact_name: { label: "Contact" },
    filing_frequency: { label: "Filing frequency" },
    gstin: { label: "GSTIN", mono: true },
    state_code: { label: "State", mono: true },
    status: { label: "Status" },
  },
  export: {
    completed_at: { label: "Completed at", mono: true },
    export_type: { label: "Export type" },
    status: { label: "Status" },
  },
  gst_period: {
    filing_frequency: { label: "Filing frequency" },
    period_end: { label: "Period end", mono: true },
    period_start: { label: "Period start", mono: true },
    status: { label: "Status" },
  },
  gst_summary: {
    generated_at: { label: "Generated at", mono: true },
    input_cgst: { label: "Input CGST", mono: true },
    input_igst: { label: "Input IGST", mono: true },
    input_sgst: { label: "Input SGST", mono: true },
    mismatch_count: { label: "Mismatches", mono: true },
    missing_document_count: { label: "Missing docs", mono: true },
    net_tax_payable: { label: "Net tax payable", mono: true },
    output_cgst: { label: "Output CGST", mono: true },
    output_igst: { label: "Output IGST", mono: true },
    output_sgst: { label: "Output SGST", mono: true },
    purchase_taxable_amount: { label: "Purchase taxable", mono: true },
    sales_taxable_amount: { label: "Sales taxable", mono: true },
  },
  ledger_entry: {
    account_name: { label: "Account" },
    credit_amount: { label: "Credit", mono: true },
    debit_amount: { label: "Debit", mono: true },
    entry_date: { label: "Entry date", mono: true },
    narration: { label: "Narration" },
  },
  processing_job: {
    attempt_count: { label: "Attempts", mono: true },
    completed_at: { label: "Completed at", mono: true },
    entity_id: { label: "Target", mono: true },
    entity_type: { label: "Target type" },
    job_type: { label: "Job type" },
    scheduled_at: { label: "Scheduled at", mono: true },
    status: { label: "Status" },
  },
  transaction: {
    cgst_amount: { label: "CGST", mono: true },
    confidence_score: { label: "Confidence", mono: true },
    document_date: { label: "Document date", mono: true },
    invoice_number: { label: "Invoice", mono: true },
    party_name: { label: "Party" },
    risk_flags: { label: "Risk flags" },
    sgst_amount: { label: "SGST", mono: true },
    status: { label: "Status" },
    taxable_amount: { label: "Taxable", mono: true },
    total_amount: { label: "Total", mono: true },
    transaction_type: { label: "Type" },
    vendor_name: { label: "Vendor" },
  },
};

const unsafeKeyPattern =
  /(authorization|bearer|cookie|credential|media_url|payload|provider|raw|secret|signed|storage|token|url|webhook)/i;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function safeScalar(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return "Empty";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    if (/https?:\/\//i.test(value) || unsafeKeyPattern.test(value)) {
      return null;
    }

    return value.length > 160 ? `${value.slice(0, 157)}...` : value;
  }

  if (Array.isArray(value)) {
    const safeValues = value
      .map((item) => safeScalar(item))
      .filter((item): item is string => Boolean(item));

    return safeValues.length > 0 ? safeValues.slice(0, 6).join(", ") : null;
  }

  return null;
}

export function auditEntityHref(
  entityType: string | null,
  entityId: string | null,
): Route | null {
  if (!entityType || !entityId) {
    return null;
  }

  switch (entityType) {
    case "client":
      return `/dashboard/clients/${entityId}` as Route;
    case "gst_period":
      return `/dashboard/gst-summary/${entityId}` as Route;
    case "ledger_entry":
      return `/dashboard/ledger/${entityId}` as Route;
    case "transaction":
      return `/dashboard/review-queue/${entityId}` as Route;
    case "export":
      return "/dashboard/exports" as Route;
    case "processing_job":
      return "/dashboard/operations" as Route;
    default:
      return null;
  }
}

export function safeAuditMetadataEntries(metadata: unknown): AuditDetail[] {
  const record = asRecord(metadata);

  if (!record) {
    return [];
  }

  return Object.entries(metadataAllowlist).reduce<AuditDetail[]>(
    (entries, [key, config]) => {
      if (!(key in record) || unsafeKeyPattern.test(key)) {
        return entries;
      }

      const value = safeScalar(record[key]);

      if (!value) {
        return entries;
      }

      entries.push({
        label: config.label,
        value,
        ...(config.mono ? { mono: true } : {}),
      });

      return entries;
    },
    [],
  );
}

export function safeAuditChangeEntries(
  entityType: string | null,
  beforeData: unknown,
  afterData: unknown,
): AuditChange[] {
  const allowedFields = entityType ? changeAllowlist[entityType] : null;
  const beforeRecord = asRecord(beforeData);
  const afterRecord = asRecord(afterData);

  if (!allowedFields || (!beforeRecord && !afterRecord)) {
    return [];
  }

  return Object.entries(allowedFields).reduce<AuditChange[]>(
    (entries, [key, config]) => {
      const before = beforeRecord ? safeScalar(beforeRecord[key]) : null;
      const after = afterRecord ? safeScalar(afterRecord[key]) : null;

      if (before === null && after === null) {
        return entries;
      }

      if (before === after) {
        return entries;
      }

      entries.push({
        label: config.label,
        before: before ?? "Hidden",
        after: after ?? "Hidden",
        ...(config.mono ? { mono: true } : {}),
      });

      return entries;
    },
    [],
  );
}

export function safeOperationsErrorMessage(message: string) {
  return message
    .replace(/https?:\/\/\S+/gi, "[redacted link]")
    .replace(/(authorization|bearer|cookie|secret|token)=\S+/gi, "$1=[redacted]")
    .replace(/\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g, "[redacted token]")
    .trim();
}
