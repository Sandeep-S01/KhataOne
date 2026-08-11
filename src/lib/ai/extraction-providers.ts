import {
  accountingExtractionJsonSchema,
  accountingExtractionSchema,
  EXTRACTION_PROMPT_VERSION,
  EXTRACTION_SCHEMA_VERSION,
  type AccountingExtraction,
} from "@/lib/ai/extraction-schema";
import {
  createOpenAIClient,
  getExtractionModel,
  hasOpenAIExtractionConfig,
} from "@/lib/ai/openai";
import { getOptionalServerEnv } from "@/lib/env";

export type ExtractionDocument = {
  id: string;
  firm_id: string;
  client_id: string;
  document_type: string;
  file_name: string | null;
  file_mime_type: string | null;
  storage_path: string | null;
  source_text: string | null;
};

export type ExtractionProviderName = "openai" | "rule_based_text";

export type ExtractionProviderSuccess = {
  ok: true;
  provider: ExtractionProviderName;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  rawOutput: unknown;
  extraction: AccountingExtraction;
};

export type ExtractionProviderFailure = {
  ok: false;
  provider: ExtractionProviderName;
  message: string;
  fallbackAllowed: boolean;
};

export type ExtractionProviderResult =
  | ExtractionProviderSuccess
  | ExtractionProviderFailure;

const supportedProviders = new Set<ExtractionProviderName>([
  "openai",
  "rule_based_text",
]);

function documentInput(document: ExtractionDocument) {
  if (document.source_text?.trim()) {
    return document.source_text.trim();
  }

  return [
    "No extracted text is available for this document yet.",
    `Document type hint: ${document.document_type}.`,
    document.file_name ? `File name: ${document.file_name}.` : null,
    document.file_mime_type ? `MIME type: ${document.file_mime_type}.` : null,
    "Return null for unknown accounting fields and add risk flag OCR_REQUIRED.",
  ]
    .filter(Boolean)
    .join("\n");
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Extraction provider failed.";
}

function isProviderFallbackAllowed(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("no credits") ||
    normalized.includes("insufficient_quota") ||
    normalized.includes("billing") ||
    normalized.includes("rate limit") ||
    normalized.includes("429") ||
    normalized.includes("temporarily") ||
    normalized.includes("timeout") ||
    normalized.includes("network")
  );
}

export function getExtractionProviderOrder(): ExtractionProviderName[] {
  const configured = getOptionalServerEnv("AI_EXTRACTION_PROVIDER_ORDER");
  const providers = (configured || "openai,rule_based_text")
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean)
    .filter((provider): provider is ExtractionProviderName =>
      supportedProviders.has(provider as ExtractionProviderName),
    );

  return providers.length > 0 ? providers : ["rule_based_text"];
}

export function hasRuleBasedTextExtractionConfig() {
  return getExtractionProviderOrder().includes("rule_based_text");
}

export async function extractWithOpenAI(
  document: ExtractionDocument,
): Promise<ExtractionProviderResult> {
  if (!hasOpenAIExtractionConfig()) {
    return {
      ok: false,
      provider: "openai",
      message:
        "OpenAI extraction config is missing. Set OPENAI_API_KEY and OPENAI_EXTRACTION_MODEL.",
      fallbackAllowed: true,
    };
  }

  const model = getExtractionModel()!;
  const openai = createOpenAIClient();

  if (!openai) {
    return {
      ok: false,
      provider: "openai",
      message: "OpenAI client could not be created.",
      fallbackAllowed: true,
    };
  }

  try {
    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You extract Indian SMB accounting transaction data for CA review. Return only fields supported by the document text. Use null for unknown values. Never invent GSTINs, invoice numbers, dates, or tax amounts. Add risk flags for uncertainty.",
        },
        {
          role: "user",
          content: `Extract one accounting transaction from this KhataOne document.\n\n${documentInput(
            document,
          )}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "khataone_accounting_extraction",
          strict: true,
          schema: accountingExtractionJsonSchema,
        },
      },
    });

    const parsed = accountingExtractionSchema.parse(
      JSON.parse(response.output_text),
    );

    return {
      ok: true,
      provider: "openai",
      model,
      promptVersion: EXTRACTION_PROMPT_VERSION,
      schemaVersion: EXTRACTION_SCHEMA_VERSION,
      rawOutput: response,
      extraction: parsed,
    };
  } catch (error) {
    const message = errorMessage(error);

    return {
      ok: false,
      provider: "openai",
      message,
      fallbackAllowed: isProviderFallbackAllowed(message),
    };
  }
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(/[,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function numberAfter(text: string, label: string) {
  const match = text.match(
    new RegExp(
      `\\b${label}\\b\\s*(?:amount|amt)?\\s*[:=\\-]?\\s*(?:rs\\.?|inr|₹)?\\s*([0-9][0-9,]*(?:\\.\\d{1,2})?)`,
      "i",
    ),
  );

  return parseNumber(match?.[1]);
}

function parseDate(text: string) {
  const match = text.match(
    /\b(?:dated?|date|dt)\b\s*[:=\-]?\s*([0-9]{1,2}[\s\-\/](?:[a-z]{3,9}|[0-9]{1,2})[\s\-\/][0-9]{2,4})/i,
  );

  if (!match?.[1]) {
    return null;
  }

  const parsed = new Date(match[1]);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function parseInvoiceNumber(text: string) {
  const match = text.match(
    /\b(?:invoice|inv|bill)\s*(?:no\.?|number|#)?\s*[:=\-]?\s*([a-z0-9][a-z0-9\/\-]*)/i,
  );

  return match?.[1]?.toUpperCase() ?? null;
}

function parsePartyName(text: string) {
  const match = text.match(
    /\b(?:from|vendor|supplier|party|customer)\s+(.+?)(?=\s+(?:dated?|date|dt|total|taxable|cgst|sgst|igst|cess|gstin|invoice|inv|bill)\b|$)/i,
  );

  return match?.[1]?.replace(/[:=\-]+$/g, "").trim() || null;
}

function parseGstin(text: string) {
  const match = text.match(/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/i);
  return match?.[0]?.toUpperCase() ?? null;
}

function transactionTypeFor(text: string) {
  const normalized = text.toLowerCase();

  if (/\b(sale|sales|sold|customer)\b/.test(normalized)) {
    return "sales";
  }

  if (/\b(expense|spent|paid for)\b/.test(normalized)) {
    return "expense";
  }

  if (/\b(receipt|received)\b/.test(normalized)) {
    return "receipt";
  }

  if (/\b(payment|paid)\b/.test(normalized)) {
    return "payment";
  }

  if (/\b(purchase|purchased|vendor|supplier|from)\b/.test(normalized)) {
    return "purchase";
  }

  return "unclear";
}

function confidenceFor(extraction: AccountingExtraction) {
  const knownFields = [
    extraction.invoice_number,
    extraction.party_name,
    extraction.transaction_date,
    extraction.taxable_amount,
    extraction.cgst_amount,
    extraction.sgst_amount,
    extraction.igst_amount,
    extraction.total_amount,
  ].filter((value) => value !== null && value !== undefined).length;

  return Math.min(0.55 + knownFields * 0.025, 0.75);
}

export async function extractWithRuleBasedText(
  document: ExtractionDocument,
  previousFailures: ExtractionProviderFailure[] = [],
): Promise<ExtractionProviderResult> {
  const sourceText = document.source_text?.trim();

  if (!sourceText) {
    return {
      ok: false,
      provider: "rule_based_text",
      message: "Rule-based text extraction requires document source text.",
      fallbackAllowed: false,
    };
  }

  const taxableAmount = numberAfter(sourceText, "taxable");
  const cgstAmount = numberAfter(sourceText, "cgst");
  const sgstAmount = numberAfter(sourceText, "sgst");
  const igstAmount = numberAfter(sourceText, "igst");
  const cessAmount = numberAfter(sourceText, "cess");
  const totalAmount =
    numberAfter(sourceText, "total") ??
    numberAfter(sourceText, "amount") ??
    numberAfter(sourceText, "value");

  const baseExtraction: AccountingExtraction = {
    document_type: document.document_type === "text_note" ? "text_note" : "unclear",
    transaction_type: transactionTypeFor(sourceText),
    transaction_date: parseDate(sourceText),
    party_name: parsePartyName(sourceText),
    party_gstin: parseGstin(sourceText),
    invoice_number: parseInvoiceNumber(sourceText),
    description: sourceText,
    category: null,
    place_of_supply: null,
    taxable_amount: taxableAmount,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    cess_amount: cessAmount,
    total_amount: totalAmount,
    payment_mode: null,
    confidence_score: 0.55,
    risk_flags: [
      "RULE_BASED_EXTRACTION",
      "NEEDS_CA_REVIEW",
      previousFailures.length > 0 ? "AI_PROVIDER_UNAVAILABLE" : null,
      totalAmount === null ? "MISSING_TOTAL_AMOUNT" : null,
      taxableAmount === null ? "MISSING_TAXABLE_AMOUNT" : null,
    ].filter((flag): flag is string => Boolean(flag)),
    reviewer_notes:
      "Extracted by a local rule-based parser. CA review is required before approval.",
  };

  const extraction = accountingExtractionSchema.parse({
    ...baseExtraction,
    confidence_score: confidenceFor(baseExtraction),
  });

  return {
    ok: true,
    provider: "rule_based_text",
    model: "rule_based_text_v1",
    promptVersion: "rule_based_text_v1",
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
    rawOutput: {
      provider: "rule_based_text",
      source_text: sourceText,
      previous_failures: previousFailures.map((failure) => ({
        provider: failure.provider,
        message: failure.message,
      })),
      parsed_fields: extraction,
    },
    extraction,
  };
}

export async function runExtractionProvider({
  provider,
  document,
  previousFailures,
}: {
  provider: ExtractionProviderName;
  document: ExtractionDocument;
  previousFailures: ExtractionProviderFailure[];
}) {
  if (provider === "openai") {
    return extractWithOpenAI(document);
  }

  return extractWithRuleBasedText(document, previousFailures);
}
