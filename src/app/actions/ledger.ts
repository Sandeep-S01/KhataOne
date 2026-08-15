"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext, type FirmContext } from "@/lib/firms";

export type LedgerActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

type LedgerEntryRecord = {
  id: string;
  firm_id: string;
  client_id: string;
  transaction_id: string;
  entry_date: string | null;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
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

async function requireLedgerContext(entryId: string) {
  if (!hasSupabaseConfig()) {
    return { error: "Supabase is not configured yet." as const };
  }

  const context = await getFirmContext();

  if (!context) {
    return { error: "Supabase is not configured yet." as const };
  }

  const { firm, supabase, userId } = context;
  const { data: entry, error } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("id", entryId)
    .eq("firm_id", firm.id)
    .single();

  if (error || !entry) {
    return { error: error?.message ?? "Ledger entry not found." };
  }

  return {
    firm,
    supabase,
    userId,
    entry: entry as LedgerEntryRecord,
  };
}

async function writeLedgerAuditLog({
  supabase,
  firmId,
  clientId,
  actorUserId,
  action,
  entityId,
  beforeData,
  afterData,
  metadata,
}: {
  supabase: FirmContext["supabase"];
  firmId: string;
  clientId: string;
  actorUserId: string | null;
  action: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
}) {
  await supabase.from("audit_logs").insert({
    firm_id: firmId,
    client_id: clientId,
    actor_user_id: actorUserId,
    action,
    entity_type: "ledger_entry",
    entity_id: entityId,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
    metadata: metadata ?? null,
  });
}

export async function updateLedgerEntryAction(
  _previousState: LedgerActionState,
  formData: FormData,
): Promise<LedgerActionState> {
  const entryId = readString(formData, "entry_id");
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

  const context = await requireLedgerContext(entryId);

  if ("error" in context) {
    return {
      status: "error",
      message: context.error ?? "Ledger context could not be loaded.",
    };
  }

  const actorUserId = context.userId;
  const beforeData = context.entry;
  const { data: updated, error } = await context.supabase
    .from("ledger_entries")
    .update({
      entry_date: entryDate,
      account_name: accountName,
      debit_amount: debitAmount,
      credit_amount: creditAmount,
      narration: optional(narration),
    })
    .eq("id", entryId)
    .eq("firm_id", context.firm.id)
    .select("*")
    .single();

  if (error || !updated) {
    return {
      status: "error",
      message: error?.message ?? "Could not update ledger entry.",
    };
  }

  await writeLedgerAuditLog({
    supabase: context.supabase,
    firmId: context.firm.id,
    clientId: context.entry.client_id,
    actorUserId,
    action: "ledger_entry.corrected",
    entityId: entryId,
    beforeData,
    afterData: updated,
    metadata: {
      correction_note: optional(correctionNote),
      source_transaction_id: context.entry.transaction_id,
    },
  });

  revalidatePath("/dashboard/ledger");
  redirect(`/dashboard/ledger/${entryId}` as Route);
}
