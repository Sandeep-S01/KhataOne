import {
  accountingExtractionJsonSchema,
  accountingExtractionSchema,
  EXTRACTION_PROMPT_VERSION,
  EXTRACTION_SCHEMA_VERSION,
  isReviewNeeded,
  type AccountingExtraction,
} from "@/lib/ai/extraction-schema";
import {
  createOpenAIClient,
  getExtractionModel,
  hasOpenAIExtractionConfig,
} from "@/lib/ai/openai";
import { createAdminClient } from "@/lib/supabase/server";

type ExtractionResult = {
  ok: boolean;
  status: "extracted" | "needs_review" | "failed";
  message: string;
  extractionId?: string;
  transactionId?: string;
};

type DocumentRecord = {
  id: string;
  firm_id: string;
  client_id: string;
  document_type: string;
  file_name: string | null;
  file_mime_type: string | null;
  storage_path: string | null;
  source_text: string | null;
};

function normalizeDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function transactionStatus(extraction: AccountingExtraction) {
  return isReviewNeeded(extraction) ? "needs_review" : "draft";
}

function documentInput(document: DocumentRecord) {
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

async function markJob({
  documentId,
  status,
  error,
}: {
  documentId: string;
  status: "processing" | "completed" | "failed";
  error?: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("processing_jobs")
    .update({
      status,
      last_error: error ?? null,
      completed_at: status === "completed" || status === "failed" ? new Date().toISOString() : null,
    })
    .eq("entity_type", "document")
    .eq("entity_id", documentId)
    .eq("job_type", "ai_extraction");
}

async function writeAuditLog({
  firmId,
  clientId,
  documentId,
  extractionId,
  transactionId,
  status,
}: {
  firmId: string;
  clientId: string;
  documentId: string;
  extractionId?: string;
  transactionId?: string;
  status: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  await supabase.from("audit_logs").insert({
    firm_id: firmId,
    client_id: clientId,
    action: "ai.extraction.completed",
    entity_type: "document",
    entity_id: documentId,
    after_data: {
      extraction_id: extractionId,
      transaction_id: transactionId,
      status,
    },
    metadata: {
      prompt_version: EXTRACTION_PROMPT_VERSION,
      schema_version: EXTRACTION_SCHEMA_VERSION,
    },
  });
}

export async function processDocumentExtraction(
  documentId: string,
): Promise<ExtractionResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      status: "failed",
      message: "Supabase service role is not configured.",
    };
  }

  if (!hasOpenAIExtractionConfig()) {
    await markJob({
      documentId,
      status: "failed",
      error:
        "OpenAI extraction config is missing. Set OPENAI_API_KEY and OPENAI_EXTRACTION_MODEL.",
    });
    return {
      ok: false,
      status: "failed",
      message:
        "OpenAI extraction config is missing. Set OPENAI_API_KEY and OPENAI_EXTRACTION_MODEL.",
    };
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select(
      "id, firm_id, client_id, document_type, file_name, file_mime_type, storage_path, source_text",
    )
    .eq("id", documentId)
    .single();

  if (documentError || !document) {
    return {
      ok: false,
      status: "failed",
      message: documentError?.message ?? "Document not found.",
    };
  }

  await markJob({ documentId, status: "processing" });
  await supabase.from("documents").update({ status: "extracting" }).eq("id", documentId);

  const model = getExtractionModel()!;
  const openai = createOpenAIClient();

  if (!openai) {
    return {
      ok: false,
      status: "failed",
      message: "OpenAI client could not be created.",
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
            document as DocumentRecord,
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
    const status = isReviewNeeded(parsed) ? "needs_review" : "extracted";

    const { data: extraction, error: extractionError } = await supabase
      .from("ai_extractions")
      .insert({
        firm_id: document.firm_id,
        client_id: document.client_id,
        document_id: document.id,
        model,
        prompt_version: EXTRACTION_PROMPT_VERSION,
        schema_version: EXTRACTION_SCHEMA_VERSION,
        raw_output: response,
        normalized_output: parsed,
        confidence_score: parsed.confidence_score,
        risk_flags: parsed.risk_flags,
        status,
      })
      .select("id")
      .single();

    if (extractionError || !extraction) {
      throw new Error(extractionError?.message ?? "Could not store extraction.");
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        firm_id: document.firm_id,
        client_id: document.client_id,
        document_id: document.id,
        ai_extraction_id: extraction.id,
        transaction_type: parsed.transaction_type,
        status: transactionStatus(parsed),
        transaction_date: normalizeDate(parsed.transaction_date),
        party_name: parsed.party_name,
        party_gstin: parsed.party_gstin,
        invoice_number: parsed.invoice_number,
        description: parsed.description,
        category: parsed.category,
        place_of_supply: parsed.place_of_supply,
        taxable_amount: parsed.taxable_amount,
        cgst_amount: parsed.cgst_amount,
        sgst_amount: parsed.sgst_amount,
        igst_amount: parsed.igst_amount,
        cess_amount: parsed.cess_amount,
        total_amount: parsed.total_amount,
        payment_mode: parsed.payment_mode,
        confidence_score: parsed.confidence_score,
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      throw new Error(transactionError?.message ?? "Could not store transaction.");
    }

    await supabase
      .from("documents")
      .update({ status: status === "extracted" ? "extracted" : "needs_review" })
      .eq("id", document.id);
    await markJob({ documentId, status: "completed" });
    await writeAuditLog({
      firmId: document.firm_id,
      clientId: document.client_id,
      documentId: document.id,
      extractionId: extraction.id,
      transactionId: transaction.id,
      status,
    });

    return {
      ok: true,
      status,
      message: "Extraction completed and draft transaction created.",
      extractionId: extraction.id,
      transactionId: transaction.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI extraction failed.";

    await supabase.from("documents").update({ status: "failed" }).eq("id", document.id);
    await markJob({ documentId, status: "failed", error: message });

    return {
      ok: false,
      status: "failed",
      message,
    };
  }
}
