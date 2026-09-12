"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { captureOperationalError } from "@/lib/observability";
import { sendWhatsAppText } from "@/lib/whatsapp/client";

export type ReviewActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

type TransactionRecord = {
  id: string;
  firm_id: string;
  client_id: string;
  document_id: string | null;
  transaction_type: string;
  status: string;
  transaction_date: string | null;
  party_name: string | null;
  party_gstin: string | null;
  invoice_number: string | null;
  description: string | null;
  category: string | null;
  place_of_supply: string | null;
  taxable_amount: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  cess_amount: number | null;
  total_amount: number | null;
  payment_mode: string | null;
  confidence_score: number;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value.length > 0 ? value : null;
}

function optionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

async function requireReviewContext(transactionId: string) {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase is not configured yet." as const };
  }

  const context = await getFirmContext();

  if (!context) {
    return { error: "Supabase is not configured yet." as const };
  }

  const { firm, supabase } = context;
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("firm_id", firm.id)
    .single();

  if (error || !transaction) {
    return { error: error?.message ?? "Transaction not found." };
  }

  return {
    firm,
    supabase,
    transaction: transaction as TransactionRecord,
  };
}

function canReview(role: string) {
  return ["owner", "admin", "staff"].includes(role);
}

function isPosted(status: string) {
  return ["approved", "exported"].includes(status);
}

function redirectWithReviewError(transactionId: string, message: string): never {
  if (!transactionId) {
    redirect("/dashboard/review-queue");
  }

  redirect(
    `/dashboard/review-queue/${transactionId}?error=${encodeURIComponent(
      message,
    )}` as Route,
  );
}

export async function updateTransactionAction(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const transactionId = readString(formData, "transaction_id");
  const fieldErrors: Record<string, string> = {};

  if (!transactionId) {
    fieldErrors.transaction_id = "Missing transaction id.";
  }

  const transactionType = readString(formData, "transaction_type") || "unclear";
  const allowedTypes = [
    "purchase",
    "sales",
    "expense",
    "payment",
    "receipt",
    "unclear",
  ];

  if (!allowedTypes.includes(transactionType)) {
    fieldErrors.transaction_type = "Choose a valid transaction type.";
  }

  const transactionDate = normalizeDate(readString(formData, "transaction_date"));
  const amountFields = [
    "taxable_amount",
    "cgst_amount",
    "sgst_amount",
    "igst_amount",
    "cess_amount",
    "total_amount",
  ] as const;
  const amounts = Object.fromEntries(
    amountFields.map((field) => [field, optionalNumber(readString(formData, field))]),
  ) as Record<(typeof amountFields)[number], number | null>;

  for (const field of amountFields) {
    if (Number.isNaN(amounts[field])) {
      fieldErrors[field] = "Enter a valid amount.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const context = await requireReviewContext(transactionId);

  if ("error" in context) {
    return {
      status: "error",
      message: context.error ?? "Review context could not be loaded.",
    };
  }

  if (!canReview(context.firm.role)) {
    return {
      status: "error",
      message: "Your workspace role cannot edit transactions.",
    };
  }

  if (isPosted(context.transaction.status)) {
    return {
      status: "error",
      message: "Posted transactions cannot be edited without a reversal workflow.",
    };
  }

  const { data: updated, error } = await context.supabase.rpc(
    "update_transaction_review",
    {
      target_firm_id: context.firm.id,
      target_transaction_id: transactionId,
      reviewed_transaction_type: transactionType,
      reviewed_transaction_date: transactionDate,
      reviewed_party_name: optional(readString(formData, "party_name")),
      reviewed_party_gstin: optional(readString(formData, "party_gstin").toUpperCase()),
      reviewed_invoice_number: optional(readString(formData, "invoice_number")),
      reviewed_description: optional(readString(formData, "description")),
      reviewed_category: optional(readString(formData, "category")),
      reviewed_place_of_supply: optional(readString(formData, "place_of_supply")),
      reviewed_taxable_amount: amounts.taxable_amount,
      reviewed_cgst_amount: amounts.cgst_amount,
      reviewed_sgst_amount: amounts.sgst_amount,
      reviewed_igst_amount: amounts.igst_amount,
      reviewed_cess_amount: amounts.cess_amount,
      reviewed_total_amount: amounts.total_amount,
      reviewed_payment_mode: optional(readString(formData, "payment_mode")),
    },
  );

  if (error || !updated) {
    return {
      status: "error",
      message: "Could not update transaction. Please retry or contact your workspace administrator.",
    };
  }

  redirect(`/dashboard/review-queue/${transactionId}` as Route);
}

export async function approveTransactionAction(formData: FormData) {
  const transactionId = readString(formData, "transaction_id");
  const context = await requireReviewContext(transactionId);

  if ("error" in context) {
    redirect("/dashboard/review-queue");
  }

  if (!canReview(context.firm.role)) {
    redirectWithReviewError(
      transactionId,
      "Your workspace role cannot approve transactions.",
    );
  }

  const { data, error } = await context.supabase.rpc(
    "approve_transaction_with_handoff",
    {
      target_transaction_id: transactionId,
    },
  );

  if (error || !data) {
    const message = error?.message ?? "Could not approve transaction.";

    captureOperationalError({
      area: "review.approve_transaction",
      error: message,
      context: {
        transaction_id: transactionId,
        firm_id: context.firm.id,
      },
    });

    redirectWithReviewError(transactionId, message);
  }

  revalidatePath("/dashboard/review-queue");
  revalidatePath("/dashboard/ledger");
  redirect("/dashboard/ledger");
}

export async function rejectTransactionAction(formData: FormData) {
  await markTransactionDecision({
    formData,
    status: "rejected",
  });
}

export async function markDuplicateTransactionAction(formData: FormData) {
  await markTransactionDecision({
    formData,
    status: "duplicate",
  });
}

async function markTransactionDecision({
  formData,
  status,
}: {
  formData: FormData;
  status: "rejected" | "duplicate";
}) {
  const transactionId = readString(formData, "transaction_id");
  const note = readString(formData, "review_note");
  const context = await requireReviewContext(transactionId);

  if ("error" in context) {
    redirect("/dashboard/review-queue");
  }

  if (!canReview(context.firm.role)) {
    redirectWithReviewError(
      transactionId,
      "Your workspace role cannot make review decisions.",
    );
  }

  if (isPosted(context.transaction.status)) {
    redirectWithReviewError(
      transactionId,
      "Posted transactions require a reversal before another review decision.",
    );
  }

  const { data: updated, error } = await context.supabase.rpc(
    "decide_transaction_review",
    {
      target_firm_id: context.firm.id,
      target_transaction_id: transactionId,
      target_status: status,
      review_note: optional(note),
    },
  );

  if (error || !updated) {
    redirectWithReviewError(
      transactionId,
      "Could not save the review decision. Please retry or contact your workspace administrator.",
    );
  }

  revalidatePath("/dashboard/review-queue");
  redirect("/dashboard/review-queue");
}

export async function requestClarificationAction(formData: FormData) {
  const transactionId = readString(formData, "transaction_id");
  const note = readString(formData, "clarification_note");
  const context = await requireReviewContext(transactionId);

  if ("error" in context) {
    redirect("/dashboard/review-queue");
  }

  if (!canReview(context.firm.role)) {
    redirectWithReviewError(transactionId, "Your workspace role cannot request clarification.");
  }

  if (isPosted(context.transaction.status)) {
    redirectWithReviewError(
      transactionId,
      "Posted transactions require a reversal before requesting clarification.",
    );
  }

  if (!note || note.length > 2000) {
    redirectWithReviewError(
      transactionId,
      "Enter a clarification note of 2,000 characters or fewer.",
    );
  }

  const { data: requestData, error: requestError } = await context.supabase.rpc(
    "request_transaction_clarification",
    {
      target_firm_id: context.firm.id,
      target_transaction_id: transactionId,
      clarification_note: note,
    },
  );
  const request = requestData as {
    client_id?: string;
    request_audit_id?: string;
  } | null;

  if (requestError || !request?.client_id || !request.request_audit_id) {
    redirectWithReviewError(
      transactionId,
      "Could not record the clarification request. Please retry or contact your workspace administrator.",
    );
  }

  const { data: client } = await context.supabase
    .from("clients")
    .select("whatsapp_phone, phone, business_name")
    .eq("id", request.client_id)
    .eq("firm_id", context.firm.id)
    .single();

  const recipient = client?.whatsapp_phone || client?.phone;
  const outbound =
    recipient && note
      ? await sendWhatsAppText({
          to: recipient,
          body: `KhataOne clarification needed for ${client.business_name}: ${note}`,
        })
      : { ok: false, error: "No recipient or clarification note." };

  const { error: deliveryAuditError } = await context.supabase.rpc(
    "record_transaction_clarification_delivery",
    {
      target_firm_id: context.firm.id,
      target_transaction_id: transactionId,
      target_request_audit_id: request.request_audit_id,
      delivered: outbound.ok,
      delivery_error: outbound.ok ? null : outbound.error,
    },
  );

  if (deliveryAuditError) {
    captureOperationalError({
      area: "review.clarification_delivery_audit",
      error: deliveryAuditError.message,
      context: { transaction_id: transactionId, firm_id: context.firm.id },
    });
  }

  revalidatePath(`/dashboard/review-queue/${transactionId}` as Route);
  if (!outbound.ok) {
    redirectWithReviewError(
      transactionId,
      "Clarification was recorded, but the WhatsApp message could not be sent.",
    );
  }
  redirect(`/dashboard/review-queue/${transactionId}` as Route);
}
