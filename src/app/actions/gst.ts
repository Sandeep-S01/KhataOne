"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

export type GstActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
  if (!clientId) fieldErrors.client_id = "Choose a client.";
  if (!validDate(periodStart)) fieldErrors.period_start = "Choose a valid start date.";
  if (!validDate(periodEnd)) fieldErrors.period_end = "Choose a valid end date.";
  if (validDate(periodStart) && validDate(periodEnd) && periodStart > periodEnd) {
    fieldErrors.period_end = "End date must be after start date.";
  }
  if (!["monthly", "quarterly", "annual"].includes(filingType)) {
    fieldErrors.filing_type = "Choose a valid filing type.";
  }
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }
  if (!hasSupabaseConfig()) return { status: "error", message: "Supabase is not configured yet." };
  const context = await getFirmContext();
  if (!context) return { status: "error", message: "Supabase is not configured yet." };
  if (!["owner", "admin", "staff"].includes(context.firm.role)) {
    return { status: "error", message: "Your workspace role cannot generate GST summaries." };
  }
  const { data: periodId, error } = await context.supabase.rpc("generate_gst_summary", {
    target_firm_id: context.firm.id, target_client_id: clientId,
    start_date: periodStart, end_date: periodEnd, target_filing_type: filingType,
  });
  if (error || typeof periodId !== "string" || !periodId) {
    return { status: "error", message: "Could not generate GST summary. Please retry or contact your workspace administrator." };
  }
  revalidatePath("/dashboard/gst-summary");
  revalidatePath("/dashboard/reports");
  redirect(`/dashboard/gst-summary/${periodId}` as Route);
}
