import { z } from "zod";

export const EXTRACTION_SCHEMA_VERSION = "accounting_extraction_v1";
export const EXTRACTION_PROMPT_VERSION = "khataone_extract_v1";

export const accountingExtractionSchema = z.object({
  document_type: z.enum([
    "purchase_invoice",
    "sales_invoice",
    "receipt",
    "bank_statement",
    "payment_proof",
    "text_note",
    "unclear",
  ]),
  transaction_type: z.enum([
    "purchase",
    "sales",
    "expense",
    "payment",
    "receipt",
    "unclear",
  ]),
  transaction_date: z.string().nullable(),
  party_name: z.string().nullable(),
  party_gstin: z.string().nullable(),
  invoice_number: z.string().nullable(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  place_of_supply: z.string().nullable(),
  taxable_amount: z.number().nullable(),
  cgst_amount: z.number().nullable(),
  sgst_amount: z.number().nullable(),
  igst_amount: z.number().nullable(),
  cess_amount: z.number().nullable(),
  total_amount: z.number().nullable(),
  payment_mode: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
  risk_flags: z.array(z.string()),
  reviewer_notes: z.string().nullable(),
});

export type AccountingExtraction = z.infer<typeof accountingExtractionSchema>;

export const accountingExtractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "document_type",
    "transaction_type",
    "transaction_date",
    "party_name",
    "party_gstin",
    "invoice_number",
    "description",
    "category",
    "place_of_supply",
    "taxable_amount",
    "cgst_amount",
    "sgst_amount",
    "igst_amount",
    "cess_amount",
    "total_amount",
    "payment_mode",
    "confidence_score",
    "risk_flags",
    "reviewer_notes",
  ],
  properties: {
    document_type: {
      type: "string",
      enum: [
        "purchase_invoice",
        "sales_invoice",
        "receipt",
        "bank_statement",
        "payment_proof",
        "text_note",
        "unclear",
      ],
    },
    transaction_type: {
      type: "string",
      enum: ["purchase", "sales", "expense", "payment", "receipt", "unclear"],
    },
    transaction_date: { type: ["string", "null"] },
    party_name: { type: ["string", "null"] },
    party_gstin: { type: ["string", "null"] },
    invoice_number: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    category: { type: ["string", "null"] },
    place_of_supply: { type: ["string", "null"] },
    taxable_amount: { type: ["number", "null"] },
    cgst_amount: { type: ["number", "null"] },
    sgst_amount: { type: ["number", "null"] },
    igst_amount: { type: ["number", "null"] },
    cess_amount: { type: ["number", "null"] },
    total_amount: { type: ["number", "null"] },
    payment_mode: { type: ["string", "null"] },
    confidence_score: { type: "number", minimum: 0, maximum: 1 },
    risk_flags: { type: "array", items: { type: "string" } },
    reviewer_notes: { type: ["string", "null"] },
  },
} as const;

export function isReviewNeeded(extraction: AccountingExtraction) {
  return (
    extraction.confidence_score < 0.86 ||
    extraction.transaction_type === "unclear" ||
    extraction.document_type === "unclear" ||
    extraction.risk_flags.length > 0 ||
    !extraction.total_amount
  );
}
