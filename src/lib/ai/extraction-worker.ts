import { processDocumentExtraction } from "@/lib/ai/extraction-processor";
import { captureOperationalError } from "@/lib/observability";
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 20;

type ClaimedJob = {
  id: string;
  firm_id: string;
  client_id: string | null;
  entity_type: string;
  entity_id: string;
  attempt_count: number;
  scheduled_at: string;
  created_at: string;
};

type JobRunResult = {
  jobId: string;
  documentId: string;
  status: "completed" | "failed" | "skipped";
  message: string;
  extractionId?: string;
  transactionId?: string;
};

export type QueuedExtractionRunResult = {
  ok: boolean;
  workerId: string;
  claimed: number;
  processed: number;
  completed: number;
  failed: number;
  skipped: number;
  results: JobRunResult[];
  error?: string;
};

function normalizeBatchSize(batchSize?: number) {
  if (!batchSize || !Number.isFinite(batchSize)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.max(1, Math.min(Math.floor(batchSize), MAX_BATCH_SIZE));
}

async function markUnexpectedFailure({
  job,
  message,
}: {
  job: ClaimedJob;
  message: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return;
  }

  await supabase
    .from("processing_jobs")
    .update({
      status: "failed",
      last_error: message,
      locked_at: null,
      locked_by: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  await supabase
    .from("documents")
    .update({ status: "failed" })
    .eq("id", job.entity_id)
    .eq("firm_id", job.firm_id);
}

async function processClaimedJob(job: ClaimedJob): Promise<JobRunResult> {
  if (job.entity_type !== "document") {
    const message = `Unsupported job entity type: ${job.entity_type}`;
    await markUnexpectedFailure({ job, message });

    return {
      jobId: job.id,
      documentId: job.entity_id,
      status: "failed",
      message,
    };
  }

  try {
    const result = await processDocumentExtraction(job.entity_id, {
      jobId: job.id,
    });

    if (result.status === "skipped") {
      return {
        jobId: job.id,
        documentId: job.entity_id,
        status: "skipped",
        message: result.message,
        extractionId: result.extractionId,
        transactionId: result.transactionId,
      };
    }

    return {
      jobId: job.id,
      documentId: job.entity_id,
      status: result.ok ? "completed" : "failed",
      message: result.message,
      extractionId: result.extractionId,
      transactionId: result.transactionId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI extraction worker failed.";

    captureOperationalError({
      area: "ai-extraction-worker-process",
      error,
      context: {
        job_id: job.id,
        document_id: job.entity_id,
      },
    });

    await markUnexpectedFailure({ job, message });

    return {
      jobId: job.id,
      documentId: job.entity_id,
      status: "failed",
      message,
    };
  }
}

export async function runQueuedAiExtractionJobs({
  batchSize,
  workerId = `khataone-worker-${Date.now()}`,
}: {
  batchSize?: number;
  workerId?: string;
} = {}): Promise<QueuedExtractionRunResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      results: [],
      error: "Supabase service role is not configured.",
    };
  }

  const { data, error } = await supabase.rpc("claim_ai_extraction_jobs", {
    batch_size: normalizeBatchSize(batchSize),
    worker_id: workerId,
  });

  if (error) {
    captureOperationalError({
      area: "ai-extraction-worker-claim",
      error,
    });

    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      results: [],
      error: error.message,
    };
  }

  const jobs = (data ?? []) as ClaimedJob[];
  const results: JobRunResult[] = [];

  for (const job of jobs) {
    results.push(await processClaimedJob(job));
  }

  const completed = results.filter((result) => result.status === "completed").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const skipped = results.filter((result) => result.status === "skipped").length;

  return {
    ok: failed === 0,
    workerId,
    claimed: jobs.length,
    processed: results.length,
    completed,
    failed,
    skipped,
    results,
  };
}

export async function runAiExtractionJobNow({
  jobId,
  workerId = `khataone-manual-worker-${Date.now()}`,
}: {
  jobId: string;
  workerId?: string;
}): Promise<QueuedExtractionRunResult> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      results: [],
      error: "Supabase service role is not configured.",
    };
  }

  const { data, error } = await supabase.rpc("claim_ai_extraction_job", {
    target_job_id: jobId,
    worker_id: workerId,
  });

  if (error) {
    captureOperationalError({
      area: "ai-extraction-worker-claim-one",
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
      skipped: 0,
      results: [],
      error: error.message,
    };
  }

  const jobs = (data ?? []) as ClaimedJob[];

  if (jobs.length === 0) {
    return {
      ok: false,
      workerId,
      claimed: 0,
      processed: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      results: [],
      error: "Job is not queued, failed, retryable, or available to claim.",
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
    skipped: result.status === "skipped" ? 1 : 0,
    results: [result],
    error: result.status === "failed" ? result.message : undefined,
  };
}
