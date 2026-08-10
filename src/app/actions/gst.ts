"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm, getCurrentUserId } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export type GstActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

type TransactionForGst = {
  id: string;
  transaction_type: string;
  status: string;
  transaction_date: string | null;
  taxable_amount: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  total_amount: number | null;
  party_gstin: string | null;
  document_id: string | null;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

function amount(value: number | null) {
  return Number(value ?? 0);
}

function isOutputTransaction(type: string) {
  return ["sales", "receipt"].includes(type);
}

function isInputTransaction(type: string) {
  return ["purchase", "expense", "payment"].includes(type);
}

function sumTransactions(transactions: TransactionForGst[]) {
  let salesTaxable = 0;
  let purchaseTaxable = 0;
  let outputCgst = 0;
  let outputSgst = 0;
  let outputIgst = 0;
  let inputCgst = 0;
  let inputSgst = 0;
  let inputIgst = 0;
  let mismatchCount = 0;
  let missingDocumentCount = 0;

  for (const transaction of transactions) {
    const taxable = amount(transaction.taxable_amount);
    const cgst = amount(transaction.cgst_amount);
    const sgst = amount(transaction.sgst_amount);
    const igst = amount(transaction.igst_amount);
    const taxTotal = cgst + sgst + igst;

    if (!transaction.document_id) {
      missingDocumentCount += 1;
    }

    if (!transaction.party_gstin || taxTotal === 0 || !transaction.total_amount) {
      mismatchCount += 1;
    }

    if (isOutputTransaction(transaction.transaction_type)) {
      salesTaxable += taxable;
      outputCgst += cgst;
      outputSgst += sgst;
      outputIgst += igst;
    }

    if (isInputTransaction(transaction.transaction_type)) {
      purchaseTaxable += taxable;
      inputCgst += cgst;
      inputSgst += sgst;
      inputIgst += igst;
    }
  }

  const outputTax = outputCgst + outputSgst + outputIgst;
  const inputTax = inputCgst + inputSgst + inputIgst;

  return {
    sales_taxable_amount: salesTaxable,
    purchase_taxable_amount: purchaseTaxable,
    output_cgst: outputCgst,
    output_sgst: outputSgst,
    output_igst: outputIgst,
    input_cgst: inputCgst,
    input_sgst: inputSgst,
    input_igst: inputIgst,
    net_tax_payable: outputTax - inputTax,
    mismatch_count: mismatchCount,
    missing_document_count: missingDocumentCount,
  };
}

function periodStatus({
  unresolvedCount,
  mismatchCount,
  missingDocumentCount,
  approvedCount,
}: {
  unresolvedCount: number;
  mismatchCount: number;
  missingDocumentCount: number;
  approvedCount: number;
}) {
  if (missingDocumentCount > 0) {
    return "missing_documents";
  }

  if (unresolvedCount > 0 || mismatchCount > 0 || approvedCount === 0) {
    return "needs_review";
  }

  return "ready";
}

async function writeGstAuditLog({
  firmId,
  clientId,
  actorUserId,
  periodId,
  summary,
}: {
  firmId: string;
  clientId: string;
  actorUserId: string | null;
  periodId: string;
  summary: unknown;
}) {
  const supabase = await createClient();

  await supabase.from("audit_logs").insert({
    firm_id: firmId,
    client_id: clientId,
    actor_user_id: actorUserId,
    action: "gst_summary.generated",
    entity_type: "gst_period",
    entity_id: periodId,
    after_data: summary,
    metadata: {
      direct_filing: false,
      source: "approved_transactions",
    },
  });
}

export async function generateGstSummaryAction(
  _previousState: GstActionState,
  formData: FormData,
): Promise<GstActionState> {
  const clientId = readString(formData, "client_id");
  const periodStart = readString(formData, "period_start");
  const periodEnd = readString(formData, "period_end");
  const filingType = readString(formData, "filing_type") || "monthly";
  const fieldErrors: Record<string, string> = {};

  if (!clientId) {
    fieldErrors.client_id = "Choose a client.";
  }

  if (!validDate(periodStart)) {
    fieldErrors.period_start = "Choose a valid start date.";
  }

  if (!validDate(periodEnd)) {
    fieldErrors.period_end = "Choose a valid end date.";
  }

  if (
    validDate(periodStart) &&
    validDate(periodEnd) &&
    new Date(periodStart) > new Date(periodEnd)
  ) {
    fieldErrors.period_end = "End date must be after start date.";
  }

  if (!["monthly", "quarterly", "annual"].includes(filingType)) {
    fieldErrors.filing_type = "Choose a valid filing type.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      status: "error",
      message: "Supabase is not configured yet.",
    };
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const actorUserId = await getCurrentUserId();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("firm_id", firm!.id)
    .single();

  if (!client) {
    return {
      status: "error",
      message: "Client not found for this firm.",
    };
  }

  const { data: approvedTransactions, error: approvedError } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, status, transaction_date, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_amount, party_gstin, document_id",
    )
    .eq("firm_id", firm!.id)
    .eq("client_id", clientId)
    .eq("status", "approved")
    .gte("transaction_date", periodStart)
    .lte("transaction_date", periodEnd);

  if (approvedError) {
    return {
      status: "error",
      message: approvedError.message,
    };
  }

  const { count: unresolvedCount } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm!.id)
    .eq("client_id", clientId)
    .in("status", ["draft", "needs_review", "duplicate"])
    .gte("transaction_date", periodStart)
    .lte("transaction_date", periodEnd);

  const summary = sumTransactions(
    (approvedTransactions ?? []) as TransactionForGst[],
  );
  const status = periodStatus({
    unresolvedCount: unresolvedCount ?? 0,
    mismatchCount: summary.mismatch_count,
    missingDocumentCount: summary.missing_document_count,
    approvedCount: approvedTransactions?.length ?? 0,
  });

  const { data: period, error: periodError } = await supabase
    .from("gst_periods")
    .upsert(
      {
        firm_id: firm!.id,
        client_id: clientId,
        period_start: periodStart,
        period_end: periodEnd,
        filing_type: filingType,
        status,
      },
      {
        onConflict: "firm_id,client_id,period_start,period_end,filing_type",
      },
    )
    .select("id")
    .single();

  if (periodError || !period) {
    return {
      status: "error",
      message: periodError?.message ?? "Could not create GST period.",
    };
  }

  const { data: storedSummary, error: summaryError } = await supabase
    .from("gst_summaries")
    .upsert(
      {
        firm_id: firm!.id,
        client_id: clientId,
        gst_period_id: period.id,
        ...summary,
        generated_at: new Date().toISOString(),
      },
      {
        onConflict: "gst_period_id",
      },
    )
    .select("*")
    .single();

  if (summaryError || !storedSummary) {
    return {
      status: "error",
      message: summaryError?.message ?? "Could not store GST summary.",
    };
  }

  await writeGstAuditLog({
    firmId: firm!.id,
    clientId,
    actorUserId,
    periodId: period.id,
    summary: {
      ...storedSummary,
      unresolved_count: unresolvedCount ?? 0,
      approved_count: approvedTransactions?.length ?? 0,
    },
  });

  revalidatePath("/dashboard/gst-summary");
  redirect(`/dashboard/gst-summary/${period.id}` as Route);
}
