"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm, getCurrentUserId } from "@/lib/firms";
import { captureOperationalError } from "@/lib/observability";
import { createAdminClient, createClient } from "@/lib/supabase/server";
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

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("firm_id", firm!.id)
    .single();

  if (error || !transaction) {
    return { error: error?.message ?? "Transaction not found." };
  }

  return {
    firm: firm!,
    supabase,
    transaction: transaction as TransactionRecord,
  };
}

async function writeAuditLog({
  firmId,
  clientId,
  actorUserId,
  action,
  entityId,
  beforeData,
  afterData,
  metadata,
}: {
  firmId: string;
  clientId: string;
  actorUserId: string | null;
  action: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
}) {
  const supabase = await createClient();

  await supabase.from("audit_logs").insert({
    firm_id: firmId,
    client_id: clientId,
    actor_user_id: actorUserId,
    action,
    entity_type: "transaction",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
    metadata: metadata ?? null,
  });
}

function ledgerSide(transaction: TransactionRecord) {
  const amount = transaction.total_amount ?? 0;

  if (["sales", "receipt"].includes(transaction.transaction_type)) {
    return { debit_amount: 0, credit_amount: amount };
  }

  return { debit_amount: amount, credit_amount: 0 };
}

function canReview(role: string) {
  return ["owner", "admin", "staff"].includes(role);
}

async function createMutationClient() {
  return createAdminClient() ?? (await createClient());
}

function redirectWithReviewError(transactionId: string, message: string) {
  if (!transactionId) {
    redirect("/dashboard/review-queue");
  }

  redirect(
    `/dashboard/review-queue/${transactionId}?error=${encodeURIComponent(
      message,
    )}` as Route,
  );
}

async function createLedgerHandoff(transaction: TransactionRecord) {
  const supabase = await createMutationClient();
  const { data: existing, error: existingError } = await supabase
    .from("ledger_entries")
    .select("id")
    .eq("transaction_id", transaction.id)
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing && existing.length > 0) {
    return existing[0].id as string;
  }

  const side = ledgerSide(transaction);
  const { data: entry, error: insertError } = await supabase
    .from("ledger_entries")
    .insert({
      firm_id: transaction.firm_id,
      client_id: transaction.client_id,
      transaction_id: transaction.id,
      entry_date: transaction.transaction_date,
      account_name:
        transaction.category ||
        transaction.party_name ||
        `${transaction.transaction_type} review account`,
      debit_amount: side.debit_amount,
      credit_amount: side.credit_amount,
      narration:
        transaction.description ||
        `Approved ${transaction.transaction_type} transaction`,
    })
    .select("id")
    .single();

  if (insertError || !entry) {
    throw new Error(insertError?.message ?? "Could not create ledger handoff.");
  }

  return entry.id as string;
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

  const actorUserId = await getCurrentUserId();
  const beforeData = context.transaction;
  const { data: updated, error } = await context.supabase
    .from("transactions")
    .update({
      transaction_type: transactionType,
      status:
        context.transaction.status === "approved"
          ? "needs_review"
          : context.transaction.status,
      transaction_date: transactionDate,
      party_name: optional(readString(formData, "party_name")),
      party_gstin: optional(readString(formData, "party_gstin").toUpperCase()),
      invoice_number: optional(readString(formData, "invoice_number")),
      description: optional(readString(formData, "description")),
      category: optional(readString(formData, "category")),
      place_of_supply: optional(readString(formData, "place_of_supply")),
      taxable_amount: amounts.taxable_amount,
      cgst_amount: amounts.cgst_amount,
      sgst_amount: amounts.sgst_amount,
      igst_amount: amounts.igst_amount,
      cess_amount: amounts.cess_amount,
      total_amount: amounts.total_amount,
      payment_mode: optional(readString(formData, "payment_mode")),
      approved_by: null,
      approved_at: null,
    })
    .eq("id", transactionId)
    .eq("firm_id", context.firm.id)
    .select("*")
    .single();

  if (error || !updated) {
    return {
      status: "error",
      message: error?.message ?? "Could not update transaction.",
    };
  }

  await writeAuditLog({
    firmId: context.firm.id,
    clientId: context.transaction.client_id,
    actorUserId,
    action: "transaction.updated",
    entityId: transactionId,
    beforeData,
    afterData: updated,
  });

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

  const actorUserId = await getCurrentUserId();
  const beforeData = context.transaction;
  const approvedAt = new Date().toISOString();
  const mutationClient = await createMutationClient();
  const { data: updated, error: updateError } = await mutationClient
    .from("transactions")
    .update({
      status: "approved",
      approved_by: actorUserId,
      approved_at: approvedAt,
    })
    .eq("id", transactionId)
    .eq("firm_id", context.firm.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    const message = updateError?.message ?? "Could not approve transaction.";

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

  try {
    const ledgerEntryId = await createLedgerHandoff(updated as TransactionRecord);

    await writeAuditLog({
      firmId: context.firm.id,
      clientId: context.transaction.client_id,
      actorUserId,
      action: "transaction.approved",
      entityId: transactionId,
      beforeData,
      afterData: updated,
      metadata: {
        ledger_entry_id: ledgerEntryId,
      },
    });
  } catch (error) {
    await mutationClient
      .from("transactions")
      .update({
        status: context.transaction.status,
        approved_by: null,
        approved_at: null,
      })
      .eq("id", transactionId)
      .eq("firm_id", context.firm.id);

    const message =
      error instanceof Error ? error.message : "Could not create ledger handoff.";

    captureOperationalError({
      area: "review.create_ledger_handoff",
      error,
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
    action: "transaction.rejected",
  });
}

export async function markDuplicateTransactionAction(formData: FormData) {
  await markTransactionDecision({
    formData,
    status: "duplicate",
    action: "transaction.marked_duplicate",
  });
}

async function markTransactionDecision({
  formData,
  status,
  action,
}: {
  formData: FormData;
  status: "rejected" | "duplicate";
  action: string;
}) {
  const transactionId = readString(formData, "transaction_id");
  const note = readString(formData, "review_note");
  const context = await requireReviewContext(transactionId);

  if ("error" in context) {
    redirect("/dashboard/review-queue");
  }

  const actorUserId = await getCurrentUserId();
  const beforeData = context.transaction;
  const { data: updated } = await context.supabase
    .from("transactions")
    .update({ status, approved_by: null, approved_at: null })
    .eq("id", transactionId)
    .eq("firm_id", context.firm.id)
    .select("*")
    .single();

  if (updated) {
    await writeAuditLog({
      firmId: context.firm.id,
      clientId: context.transaction.client_id,
      actorUserId,
      action,
      entityId: transactionId,
      beforeData,
      afterData: updated,
      metadata: { review_note: optional(note) },
    });
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

  const actorUserId = await getCurrentUserId();
  const { data: client } = await context.supabase
    .from("clients")
    .select("whatsapp_phone, phone, business_name")
    .eq("id", context.transaction.client_id)
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

  await context.supabase
    .from("transactions")
    .update({ status: "needs_review" })
    .eq("id", transactionId)
    .eq("firm_id", context.firm.id);

  await writeAuditLog({
    firmId: context.firm.id,
    clientId: context.transaction.client_id,
    actorUserId,
    action: "transaction.clarification_requested",
    entityId: transactionId,
    beforeData: context.transaction,
    metadata: {
      clarification_note: optional(note),
      whatsapp_sent: outbound.ok,
      whatsapp_error: outbound.ok ? null : outbound.error,
    },
  });

  revalidatePath(`/dashboard/review-queue/${transactionId}` as Route);
  redirect(`/dashboard/review-queue/${transactionId}` as Route);
}
