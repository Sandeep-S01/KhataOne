import "server-only";

import { getOptionalServerEnv } from "@/lib/env";
import { captureOperationalError } from "@/lib/observability";
import { createAdminClient } from "@/lib/supabase/server";

export type RecoveryWorkerName = "whatsapp_ingestion" | "ai_extraction";
export type RecoveryTriggerSource =
  | "external_scheduler"
  | "vercel_cron"
  | "job_runner";

export type WorkerRunSummary = {
  ok: boolean;
  claimed: number;
  processed: number;
  failed: number;
  retrying: number;
  error?: string;
};

export type PipelineHealthRow = {
  queue_name: RecoveryWorkerName;
  queued_count: number;
  oldest_queued_at: string | null;
  p95_claim_delay_ms: number | null;
  p95_ack_delay_ms: number | null;
  stale_lease_count: number;
  retrying_count: number;
  terminal_failure_count: number;
  recent_failure_count: number;
  last_worker_completed_at: string | null;
  last_worker_success_at: string | null;
  last_worker_succeeded: boolean | null;
  last_claimed_count: number | null;
  last_processed_count: number | null;
  last_failed_count: number | null;
  last_retrying_count: number | null;
};

export type PipelineAlert = {
  code:
    | "oldest_inbound"
    | "worker_completion"
    | "stale_lease"
    | "terminal_failure_rise";
  queueName: RecoveryWorkerName;
  message: string;
};

function configuredPositiveInteger(key: string, fallback: number) {
  const value = Number(getOptionalServerEnv(key));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function ageSeconds(value: string | null, nowMs: number) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? Math.max(0, Math.floor((nowMs - timestamp) / 1000))
    : null;
}

function normalizeHealthRows(rows: unknown[]): PipelineHealthRow[] {
  return rows.map((row) => {
    const candidate = row as Record<string, unknown>;
    return {
      queue_name: candidate.queue_name as RecoveryWorkerName,
      queued_count: Number(candidate.queued_count ?? 0),
      oldest_queued_at: (candidate.oldest_queued_at as string | null) ?? null,
      p95_claim_delay_ms:
        candidate.p95_claim_delay_ms === null
          ? null
          : Number(candidate.p95_claim_delay_ms),
      p95_ack_delay_ms:
        candidate.p95_ack_delay_ms === null
          ? null
          : Number(candidate.p95_ack_delay_ms),
      stale_lease_count: Number(candidate.stale_lease_count ?? 0),
      retrying_count: Number(candidate.retrying_count ?? 0),
      terminal_failure_count: Number(candidate.terminal_failure_count ?? 0),
      recent_failure_count: Number(candidate.recent_failure_count ?? 0),
      last_worker_completed_at:
        (candidate.last_worker_completed_at as string | null) ?? null,
      last_worker_success_at:
        (candidate.last_worker_success_at as string | null) ?? null,
      last_worker_succeeded:
        (candidate.last_worker_succeeded as boolean | null) ?? null,
      last_claimed_count:
        candidate.last_claimed_count === null
          ? null
          : Number(candidate.last_claimed_count),
      last_processed_count:
        candidate.last_processed_count === null
          ? null
          : Number(candidate.last_processed_count),
      last_failed_count:
        candidate.last_failed_count === null
          ? null
          : Number(candidate.last_failed_count),
      last_retrying_count:
        candidate.last_retrying_count === null
          ? null
          : Number(candidate.last_retrying_count),
    };
  });
}

export async function getPipelineHealthSnapshot() {
  const admin = createAdminClient();

  if (!admin) {
    return {
      rows: [] as PipelineHealthRow[],
      error: "Supabase service role is not configured.",
    };
  }

  const { data, error } = await admin.rpc("get_whatsapp_pipeline_health");

  return {
    rows: error ? [] : normalizeHealthRows((data ?? []) as unknown[]),
    error: error?.message,
  };
}

export function evaluatePipelineAlerts({
  rows,
  previousRows = [],
  nowMs = Date.now(),
}: {
  rows: PipelineHealthRow[];
  previousRows?: PipelineHealthRow[];
  nowMs?: number;
}) {
  const alerts: PipelineAlert[] = [];
  const oldestInboundWarningSeconds = configuredPositiveInteger(
    "WHATSAPP_OLDEST_QUEUED_WARNING_SECONDS",
    60,
  );
  const workerCompletionWarningSeconds = configuredPositiveInteger(
    "WORKER_COMPLETION_WARNING_SECONDS",
    300,
  );
  const previousByQueue = new Map(
    previousRows.map((row) => [row.queue_name, row]),
  );

  for (const row of rows) {
    const oldestQueuedSeconds = ageSeconds(row.oldest_queued_at, nowMs);
    const lastCompletedSeconds = ageSeconds(row.last_worker_completed_at, nowMs);

    if (
      row.queue_name === "whatsapp_ingestion" &&
      oldestQueuedSeconds !== null &&
      oldestQueuedSeconds >= oldestInboundWarningSeconds
    ) {
      alerts.push({
        code: "oldest_inbound",
        queueName: row.queue_name,
        message: `Oldest due inbound event is ${oldestQueuedSeconds}s old.`,
      });
    }

    if (
      lastCompletedSeconds === null ||
      lastCompletedSeconds >= workerCompletionWarningSeconds
    ) {
      alerts.push({
        code: "worker_completion",
        queueName: row.queue_name,
        message:
          lastCompletedSeconds === null
            ? "No completed recovery worker run is recorded."
            : `Last recovery worker completion was ${lastCompletedSeconds}s ago.`,
      });
    }

    if (row.stale_lease_count > 0) {
      alerts.push({
        code: "stale_lease",
        queueName: row.queue_name,
        message: `${row.stale_lease_count} stale ordering lease(s) require recovery.`,
      });
    }

    const previous = previousByQueue.get(row.queue_name);
    if (
      row.recent_failure_count > 0 &&
      (!previous || row.terminal_failure_count > previous.terminal_failure_count)
    ) {
      alerts.push({
        code: "terminal_failure_rise",
        queueName: row.queue_name,
        message: `Terminal failures increased to ${row.terminal_failure_count}.`,
      });
    }
  }

  return alerts;
}

async function beginWorkerRun(
  workerName: RecoveryWorkerName,
  triggerSource: RecoveryTriggerSource,
) {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.rpc("begin_background_worker_run", {
    target_worker_name: workerName,
    target_trigger_source: triggerSource,
  });

  if (error) {
    captureOperationalError({
      area: "recovery-worker-observability-start",
      error,
      context: { worker_name: workerName, trigger_source: triggerSource },
    });
    return null;
  }

  return typeof data === "string" ? data : null;
}

async function completeWorkerRun(
  runId: string | null,
  summary: WorkerRunSummary,
) {
  if (!runId) {
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { error } = await admin.rpc("complete_background_worker_run", {
    target_run_id: runId,
    target_succeeded: summary.ok,
    target_claimed_count: summary.claimed,
    target_processed_count: summary.processed,
    target_failed_count: summary.failed,
    target_retrying_count: summary.retrying,
    target_error_message: summary.error ?? null,
  });

  if (error) {
    captureOperationalError({
      area: "recovery-worker-observability-complete",
      error,
      context: { run_id: runId },
    });
  }
}

export async function runObservedRecoveryWorker<T extends WorkerRunSummary>({
  workerName,
  triggerSource,
  run,
}: {
  workerName: RecoveryWorkerName;
  triggerSource: RecoveryTriggerSource;
  run: () => Promise<T>;
}) {
  const before = await getPipelineHealthSnapshot();
  const runId = await beginWorkerRun(workerName, triggerSource);

  try {
    const result = await run();
    await completeWorkerRun(runId, result);

    const after = await getPipelineHealthSnapshot();
    if (!after.error) {
      for (const alert of evaluatePipelineAlerts({
        rows: after.rows,
        previousRows: before.rows,
      })) {
        captureOperationalError({
          area: "whatsapp-pipeline-health",
          error: new Error(alert.message),
          context: { code: alert.code, queue_name: alert.queueName },
        });
      }
    }

    return result;
  } catch (error) {
    await completeWorkerRun(runId, {
      ok: false,
      claimed: 0,
      processed: 0,
      failed: 1,
      retrying: 0,
      error: error instanceof Error ? error.message : "Recovery worker failed.",
    });
    throw error;
  }
}

export function recoveryTriggerSource(request: Request): RecoveryTriggerSource {
  if (request.headers.get("user-agent")?.includes("vercel-cron/")) {
    return "vercel_cron";
  }

  return request.headers.has("x-job-runner-secret")
    ? "job_runner"
    : "external_scheduler";
}
