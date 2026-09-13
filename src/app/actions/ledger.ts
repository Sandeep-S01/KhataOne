"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { canCorrectLedgerEntries } from "@/lib/permissions";
import {
  appendReturnContext,
  ledgerReturnKeys,
  sanitizeReturnContext,
} from "@/lib/return-context";

export type LedgerActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value.length > 0 ? value : null;
}

function parseAmount(value: string) {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

function normalizeDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

async function requireLedgerContext() {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase is not configured yet." as const };
  }

  const context = await getFirmContext();

  if (!context) {
    return { error: "Supabase is not configured yet." as const };
  }

  if (!canCorrectLedgerEntries(context.firm.role)) {
    return { error: "Your workspace role cannot correct ledger entries." };
  }
  return context;
}

export async function updateLedgerEntryAction(
  _previousState: LedgerActionState,
  formData: FormData,
): Promise<LedgerActionState> {
  const entryId = readString(formData, "entry_id");
  const returnContext = sanitizeReturnContext(
    readString(formData, "return_context"),
    ledgerReturnKeys,
  );
  const accountName = readString(formData, "account_name");
  const entryDate = normalizeDate(readString(formData, "entry_date"));
  const debitAmount = parseAmount(readString(formData, "debit_amount"));
  const creditAmount = parseAmount(readString(formData, "credit_amount"));
  const narration = readString(formData, "narration");
  const correctionNote = readString(formData, "correction_note");
  const fieldErrors: Record<string, string> = {};

  if (!entryId) {
    fieldErrors.entry_id = "Missing ledger entry id.";
  }

  if (accountName.length < 2) {
    fieldErrors.account_name = "Enter an account name.";
  }

  if (Number.isNaN(debitAmount)) {
    fieldErrors.debit_amount = "Enter a valid debit amount.";
  }

  if (Number.isNaN(creditAmount)) {
    fieldErrors.credit_amount = "Enter a valid credit amount.";
  }

  if (debitAmount > 0 && creditAmount > 0) {
    fieldErrors.debit_amount = "Use either debit or credit for this handoff row.";
    fieldErrors.credit_amount = "Use either debit or credit for this handoff row.";
  }

  if (debitAmount === 0 && creditAmount === 0) {
    fieldErrors.debit_amount = "Enter a debit or credit amount.";
    fieldErrors.credit_amount = "Enter a debit or credit amount.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const context = await requireLedgerContext();

  if ("error" in context) {
    return {
      status: "error",
      message: context.error ?? "Ledger context could not be loaded.",
    };
  }

  const { data: updated, error } = await context.supabase.rpc("correct_ledger_entry", {
    target_firm_id: context.firm.id,
    target_entry_id: entryId,
    corrected_entry_date: entryDate,
    corrected_account_name: accountName,
    corrected_debit_amount: debitAmount,
    corrected_credit_amount: creditAmount,
    corrected_narration: optional(narration),
    correction_note: optional(correctionNote),
  });

  if (error || !updated) {
    return {
      status: "error",
      message: "Could not update ledger entry. Please retry or contact your workspace administrator.",
    };
  }

  revalidatePath("/dashboard/ledger");
  redirect(appendReturnContext(`/dashboard/ledger/${entryId}`, returnContext));
}
