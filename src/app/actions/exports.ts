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
  const clientId = readString(formData, "client_id");
  const gstPeriodId = readString(formData, "gst_period_id");
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

  const { firm, supabase, userId: actorUserId } = context;

  const { data: exportRecord, error: exportError } = await supabase
    .from("exports")
    .insert({
      firm_id: firm.id,
      client_id: clientId || null,
      gst_period_id: gstPeriodId || null,
      export_type: exportType,
      status: "queued",
      requested_by: actorUserId,
      metadata: {
        client_id: clientId || null,
        gst_period_id: gstPeriodId || null,
        requested_period_start: periodStart || null,
        requested_period_end: periodEnd || null,
      },
    })
    .select("id")
    .single();

  if (exportError || !exportRecord) {
    return {
      status: "error",
      message: exportError?.message ?? "Could not create export record.",
    };
  }

  const { error: jobError } = await supabase.from("processing_jobs").insert({
    firm_id: firm.id,
    client_id: clientId || null,
    job_type: "export_generation",
    entity_type: "export",
    entity_id: exportRecord.id,
    status: "queued",
  });

  if (jobError) {
    await supabase
      .from("exports")
      .update({
        status: "failed",
        metadata: {
          client_id: clientId || null,
          gst_period_id: gstPeriodId || null,
          requested_period_start: periodStart || null,
          requested_period_end: periodEnd || null,
          error: jobError.message,
        },
      })
      .eq("id", exportRecord.id)
      .eq("firm_id", firm.id);

    return {
      status: "error",
      message: jobError.message,
    };
  }

  await supabase.from("audit_logs").insert({
    firm_id: firm.id,
    client_id: clientId || null,
    actor_user_id: actorUserId,
    action: "export.queued",
    entity_type: "export",
    entity_id: exportRecord.id,
    metadata: {
      export_type: exportType,
      direct_gst_filing: false,
    },
  });

  revalidatePath("/dashboard/exports");
  revalidatePath("/dashboard/reports");

  return {
    status: "success",
    message: "Export queued. It will be available in export history after processing.",
  };
}
