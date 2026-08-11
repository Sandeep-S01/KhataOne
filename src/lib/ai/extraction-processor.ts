import {
  isReviewNeeded,
  type AccountingExtraction,
} from "@/lib/ai/extraction-schema";
import {
  getExtractionProviderOrder,
  runExtractionProvider,
  type ExtractionProviderFailure,
  type ExtractionProviderSuccess,
} from "@/lib/ai/extraction-providers";
import { createAdminClient } from "@/lib/supabase/server";

type ExtractionResult = {
  ok: boolean;
  status: "extracted" | "needs_review" | "failed" | "skipped";
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

async function markJob({
  jobId,
  documentId,
  status,
  error,
}: {
  jobId?: string;
  documentId: string;
  status: "processing" | "completed" | "failed";
  error?: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  let query = supabase
    .from("processing_jobs")
    .update({
      status,
      last_error: error ?? null,
      completed_at: status === "completed" || status === "failed" ? new Date().toISOString() : null,
      locked_at: status === "processing" ? new Date().toISOString() : null,
      locked_by: status === "processing" ? "khataone-extraction-processor" : null,
    })
    .eq("entity_type", "document")
    .eq("entity_id", documentId)
    .eq("job_type", "ai_extraction");

  if (jobId) {
    query = query.eq("id", jobId);
  }

  await query;
}

async function writeAuditLog({
  firmId,
  clientId,
  documentId,
  extractionId,
  transactionId,
  status,
  provider,
  promptVersion,
  schemaVersion,
}: {
  firmId: string;
  clientId: string;
  documentId: string;
  extractionId?: string;
  transactionId?: string;
  status: string;
  provider: string;
  promptVersion: string;
  schemaVersion: string;
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
      provider,
      prompt_version: promptVersion,
      schema_version: schemaVersion,
    },
  });
}

async function extractWithConfiguredProviders(document: DocumentRecord) {
  const failures: ExtractionProviderFailure[] = [];

  for (const provider of getExtractionProviderOrder()) {
    const result = await runExtractionProvider({
      provider,
      document,
      previousFailures: failures,
    });

    if (result.ok) {
      return {
        result,
        failures,
      };
    }

    failures.push(result);

    if (!result.fallbackAllowed) {
      break;
    }
  }

  return {
    result: null,
    failures,
  };
}

export async function processDocumentExtraction(
  documentId: string,
  options: { jobId?: string } = {},
): Promise<ExtractionResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      status: "failed",
      message: "Supabase service role is not configured.",
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
    await markJob({
      jobId: options.jobId,
      documentId,
      status: "failed",
      error: documentError?.message ?? "Document not found.",
    });

    return {
      ok: false,
      status: "failed",
      message: documentError?.message ?? "Document not found.",
    };
  }

  const { data: existingTransaction } = await supabase
    .from("transactions")
    .select("id, status, ai_extraction_id")
    .eq("document_id", document.id)
    .limit(1)
    .maybeSingle();

  if (existingTransaction) {
    await supabase
      .from("documents")
      .update({
        status:
          existingTransaction.status === "needs_review"
            ? "needs_review"
            : "extracted",
      })
      .eq("id", document.id);
    await markJob({
      jobId: options.jobId,
      documentId,
      status: "completed",
    });

    return {
      ok: true,
      status: "skipped",
      message: "Extraction skipped because this document already has a transaction.",
      extractionId: existingTransaction.ai_extraction_id ?? undefined,
      transactionId: existingTransaction.id,
    };
  }

  await markJob({ jobId: options.jobId, documentId, status: "processing" });
  await supabase.from("documents").update({ status: "extracting" }).eq("id", documentId);

  const extractionAttempt = await extractWithConfiguredProviders(
    document as DocumentRecord,
  );
  const providerResult = extractionAttempt.result as ExtractionProviderSuccess | null;

  if (!providerResult) {
    const message =
      extractionAttempt.failures.at(-1)?.message ??
      "No extraction provider could process this document.";

    await supabase.from("documents").update({ status: "failed" }).eq("id", document.id);
    await markJob({
      jobId: options.jobId,
      documentId,
      status: "failed",
      error: message,
    });

    return {
      ok: false,
      status: "failed",
      message,
    };
  }

  try {
    const parsed = providerResult.extraction;
    const status = isReviewNeeded(parsed) ? "needs_review" : "extracted";

    const { data: extraction, error: extractionError } = await supabase
      .from("ai_extractions")
      .insert({
        firm_id: document.firm_id,
        client_id: document.client_id,
        document_id: document.id,
        model: providerResult.model,
        prompt_version: providerResult.promptVersion,
        schema_version: providerResult.schemaVersion,
        raw_output: {
          provider: providerResult.provider,
          provider_failures: extractionAttempt.failures.map((failure) => ({
            provider: failure.provider,
            message: failure.message,
          })),
          output: providerResult.rawOutput,
        },
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
    await markJob({ jobId: options.jobId, documentId, status: "completed" });
    await writeAuditLog({
      firmId: document.firm_id,
      clientId: document.client_id,
      documentId: document.id,
      extractionId: extraction.id,
      transactionId: transaction.id,
      status,
      provider: providerResult.provider,
      promptVersion: providerResult.promptVersion,
      schemaVersion: providerResult.schemaVersion,
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
    await markJob({
      jobId: options.jobId,
      documentId,
      status: "failed",
      error: message,
    });

    return {
      ok: false,
      status: "failed",
      message,
    };
  }
}
