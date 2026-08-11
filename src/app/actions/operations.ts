"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm, getCurrentUserId } from "@/lib/firms";
import { runAiExtractionJobNow } from "@/lib/ai/extraction-worker";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function canRunJobs(role: string) {
  return ["owner", "admin", "staff"].includes(role);
}

export async function runExtractionJobNowAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/dashboard/operations?status=failed");
  }

  const jobId = readString(formData, "job_id");

  if (!jobId) {
    redirect("/dashboard/operations?status=failed");
  }

  const firm = await getActiveFirm();

  if (!firm || !canRunJobs(firm.role)) {
    redirect("/dashboard/operations?status=failed");
  }

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("processing_jobs")
    .select("id, firm_id, client_id, job_type, entity_type, entity_id, status")
    .eq("id", jobId)
    .eq("firm_id", firm.id)
    .eq("job_type", "ai_extraction")
    .eq("entity_type", "document")
    .maybeSingle();

  if (!job || !["queued", "failed"].includes(job.status)) {
    redirect("/dashboard/operations");
  }

  const actorUserId = await getCurrentUserId();

  await supabase.from("audit_logs").insert({
    firm_id: firm.id,
    client_id: job.client_id,
    actor_user_id: actorUserId,
    action: "processing_job.manual_run_requested",
    entity_type: "processing_job",
    entity_id: job.id,
    before_data: job,
    metadata: {
      job_type: job.job_type,
      document_id: job.entity_id,
    },
  });

  await runAiExtractionJobNow({
    jobId: job.id,
    workerId: `manual-${actorUserId ?? "unknown"}-${Date.now()}`,
  });

  revalidatePath("/dashboard/operations");
  revalidatePath("/dashboard/review-queue");
  redirect("/dashboard/operations");
}
