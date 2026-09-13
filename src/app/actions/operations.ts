"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { runAiExtractionJobNow } from "@/lib/ai/extraction-worker";
import { runExportGenerationJobNow } from "@/lib/exports/worker";
import { canRunOperationsJobs } from "@/lib/permissions";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithOperationsResult(result: string, status?: string): never {
  const params = new URLSearchParams({ result });

  if (status) {
    params.set("status", status);
  }

  redirect(`/dashboard/operations?${params.toString()}`);
}

function manualRunResultCode(result: {
  ok: boolean;
  completed: number;
  failed: number;
  skipped?: number;
  retrying?: number;
}) {
  if (result.completed > 0) {
    return "manual-completed";
  }

  if ((result.retrying ?? 0) > 0) {
    return "manual-retrying";
  }

  if ((result.skipped ?? 0) > 0) {
    return "manual-skipped";
  }

  return result.ok && result.failed === 0 ? "manual-processed" : "manual-failed";
}

export async function runExtractionJobNowAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirectWithOperationsResult("manual-unavailable", "failed");
  }

  const jobId = readString(formData, "job_id");

  if (!jobId) {
    redirectWithOperationsResult("manual-invalid", "failed");
  }

  const context = await getFirmContext();

  if (!context || !canRunOperationsJobs(context.firm.role)) {
    redirectWithOperationsResult("manual-forbidden", "failed");
  }

  const { firm, supabase, userId: actorUserId } = context;
  const { data: jobData, error } = await supabase.rpc("request_manual_job_run", {
    target_firm_id: firm.id,
    target_job_id: jobId,
    target_job_type: "ai_extraction",
    target_entity_type: "document",
  });
  const job = jobData as { id?: string } | null;

  if (error || !job?.id) {
    redirectWithOperationsResult("manual-request-failed", "failed");
  }

  const result = await runAiExtractionJobNow({
    jobId: job.id,
    workerId: `manual-${actorUserId ?? "unknown"}-${Date.now()}`,
  }).catch(() => ({
    ok: false,
    completed: 0,
    failed: 1,
    skipped: 0,
    retrying: 0,
  }));

  revalidatePath("/dashboard/operations");
  revalidatePath("/dashboard/review-queue");
  redirectWithOperationsResult(
    manualRunResultCode(result),
    result.ok ? undefined : "failed",
  );
}

export async function runExportGenerationJobNowAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirectWithOperationsResult("manual-unavailable", "failed");
  }

  const jobId = readString(formData, "job_id");

  if (!jobId) {
    redirectWithOperationsResult("manual-invalid", "failed");
  }

  const context = await getFirmContext();

  if (!context || !canRunOperationsJobs(context.firm.role)) {
    redirectWithOperationsResult("manual-forbidden", "failed");
  }

  const { firm, supabase, userId: actorUserId } = context;
  const { data: jobData, error } = await supabase.rpc("request_manual_job_run", {
    target_firm_id: firm.id,
    target_job_id: jobId,
    target_job_type: "export_generation",
    target_entity_type: "export",
  });
  const job = jobData as { id?: string } | null;

  if (error || !job?.id) {
    redirectWithOperationsResult("manual-request-failed", "failed");
  }

  const result = await runExportGenerationJobNow({
    jobId: job.id,
    workerId: `manual-export-${actorUserId ?? "unknown"}-${Date.now()}`,
  }).catch(() => ({
    ok: false,
    completed: 0,
    failed: 1,
  }));

  revalidatePath("/dashboard/operations");
  revalidatePath("/dashboard/exports");
  revalidatePath("/dashboard/reports");
  redirectWithOperationsResult(
    manualRunResultCode(result),
    result.ok ? undefined : "failed",
  );
}
