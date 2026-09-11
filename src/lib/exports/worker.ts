import { processExportGeneration } from "@/lib/exports/generator";
import { captureOperationalError } from "@/lib/observability";
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_BATCH_SIZE = 3;
const MAX_BATCH_SIZE = 10;

type ClaimedExportJob = {
  id: string;
  firm_id: string;
  client_id: string | null;
  entity_type: string;
  entity_id: string;
  attempt_count: number;
  scheduled_at: string;
  created_at: string;
};

type ExportJobResult = {
  jobId: string;
  exportId: string;
  status: "completed" | "failed";
  message: string;
  storagePath?: string;
};

export type QueuedExportRunResult = {
  ok: boolean;
  workerId: string;
  claimed: number;
  processed: number;
  completed: number;
  failed: number;
  results: ExportJobResult[];
  error?: string;
};

function normalizeBatchSize(batchSize?: number) {
  if (!batchSize || !Number.isFinite(batchSize)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(Math.floor(batchSize), MAX_BATCH_SIZE));
}

async function markJob({
  job,
  status,
  message,
}: {
  job: ClaimedExportJob;
  status: "completed" | "failed";
  message?: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("processing_jobs")
    .update({
      status,
      last_error: status === "failed" ? (message ?? "Export generation failed.") : null,
      completed_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
    })
    .eq("id", job.id);
}

async function processClaimedJob(job: ClaimedExportJob): Promise<ExportJobResult> {
  if (job.entity_type !== "export") {
    const message = `Unsupported job entity type: ${job.entity_type}`;
    await markJob({ job, status: "failed", message });

    return {
      jobId: job.id,
      exportId: job.entity_id,
      status: "failed",
      message,
    };
  }

  try {
    const result = await processExportGeneration(job.entity_id);
    const status = result.ok ? "completed" : "failed";

    await markJob({ job, status, message: result.message });

    return {
      jobId: job.id,
      exportId: job.entity_id,
      status,
      message: result.message,
      storagePath: result.storagePath,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Export generation worker failed.";

    captureOperationalError({
      area: "export-generation-worker-process",
      error,
      context: {
        job_id: job.id,
        export_id: job.entity_id,
      },
    });

    await markJob({ job, status: "failed", message });

    return {
      jobId: job.id,
      exportId: job.entity_id,
      status: "failed",
      message,
    };
  }
}

export async function runQueuedExportGenerationJobs({
  batchSize,
  workerId = `khataone-export-worker-${Date.now()}`,
}: {
  batchSize?: number;
  workerId?: string;
} = {}): Promise<QueuedExportRunResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      results: [],
      error: "Supabase service role is not configured.",
    };
  }

  const { data, error } = await supabase.rpc("claim_export_generation_jobs", {
    batch_size: normalizeBatchSize(batchSize),
    worker_id: workerId,
  });

  if (error) {
    captureOperationalError({
      area: "export-generation-worker-claim",
      error,
    });

    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      results: [],
      error: error.message,
    };
  }

  const jobs = (data ?? []) as ClaimedExportJob[];
  const results: ExportJobResult[] = [];

  for (const job of jobs) {
    results.push(await processClaimedJob(job));
  }

  const completed = results.filter((result) => result.status === "completed").length;
  const failed = results.filter((result) => result.status === "failed").length;

  return {
    ok: failed === 0,
    workerId,
    claimed: jobs.length,
    processed: results.length,
    completed,
    failed,
    results,
  };
}

export async function runExportGenerationJobNow({
  jobId,
  workerId = `khataone-export-manual-worker-${Date.now()}`,
}: {
  jobId: string;
  workerId?: string;
}): Promise<QueuedExportRunResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      results: [],
      error: "Supabase service role is not configured.",
    };
  }

  const { data, error } = await supabase.rpc("claim_export_generation_job", {
    target_job_id: jobId,
    worker_id: workerId,
  });

  if (error) {
    captureOperationalError({
      area: "export-generation-worker-claim-one",
      error,
      context: {
        job_id: jobId,
      },
    });

    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      results: [],
      error: error.message,
    };
  }

  const jobs = (data ?? []) as ClaimedExportJob[];

  if (jobs.length === 0) {
    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      results: [],
      error: "Export job is not queued, failed, retryable, or available to claim.",
    };
  }

  const result = await processClaimedJob(jobs[0]);

  return {
    ok: result.status !== "failed",
    workerId,
    claimed: 1,
    processed: 1,
    completed: result.status === "completed" ? 1 : 0,
    failed: result.status === "failed" ? 1 : 0,
    results: [result],
    error: result.status === "failed" ? result.message : undefined,
  };
}
