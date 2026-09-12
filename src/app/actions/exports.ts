"use server";

import { revalidatePath } from "next/cache";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

export type ExportActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

type ExportType = "csv_transactions" | "gst_summary" | "pdf_summary";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  return value.length > 0 && !Number.isNaN(new Date(value).getTime());
}

export async function createExportAction(
  _previousState: ExportActionState,
  formData: FormData,
): Promise<ExportActionState> {
  const exportType = readString(formData, "export_type") as ExportType;
  // Treat the selected type as authoritative even if a crafted request adds extra fields.
  const clientId = exportType === "csv_transactions" ? readString(formData, "client_id") : "";
  const gstPeriodId = exportType === "csv_transactions" ? "" : readString(formData, "gst_period_id");
  const periodStart = readString(formData, "period_start");
  const periodEnd = readString(formData, "period_end");
  const fieldErrors: Record<string, string> = {};

  if (!["csv_transactions", "gst_summary", "pdf_summary"].includes(exportType)) {
    fieldErrors.export_type = "Choose a supported export type.";
  }

  if (exportType === "csv_transactions") {
    if (!clientId) {
      fieldErrors.client_id = "Choose a client.";
    }

    if (!validDate(periodStart)) {
      fieldErrors.period_start = "Choose a valid start date.";
    }

    if (!validDate(periodEnd)) {
      fieldErrors.period_end = "Choose a valid end date.";
    }
  }

  if (["gst_summary", "pdf_summary"].includes(exportType) && !gstPeriodId) {
    fieldErrors.gst_period_id = "Choose a generated GST period.";
  }

  if (
    validDate(periodStart) &&
    validDate(periodEnd) &&
    new Date(periodStart) > new Date(periodEnd)
  ) {
    fieldErrors.period_end = "End date must be after start date.";
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

  const context = await getFirmContext();

  if (!context) {
    return {
      status: "error",
      message: "Supabase is not configured yet.",
    };
  }

  const { firm, supabase } = context;
  if (!["owner", "admin", "staff"].includes(firm.role)) {
    return { status: "error", message: "Your workspace role cannot create exports." };
  }
  const { data: exportId, error } = await supabase.rpc("queue_dashboard_export", {
    target_firm_id: firm.id,
    target_client_id: clientId || null,
    target_gst_period_id: gstPeriodId || null,
    target_export_type: exportType,
    target_period_start: periodStart || null,
    target_period_end: periodEnd || null,
  });
  if (error || typeof exportId !== "string" || !exportId) {
    return { status: "error", message: "Could not queue export. Please retry or contact your workspace administrator." };
  }

  revalidatePath("/dashboard/exports");
  revalidatePath("/dashboard/reports");

  return {
    status: "success",
    message: "Export queued. It will be available in export history after processing.",
  };
}
