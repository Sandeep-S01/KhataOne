import {
  getOptionalServerEnv,
  getPublicEnv,
  hasSupabaseConfig,
} from "@/lib/env";
import { getExtractionProviderOrder } from "@/lib/ai/extraction-providers";
import { withServerTiming } from "@/lib/performance";
import { getRateLimitPosture } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

export type HealthCheck = {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
};

export type HealthPayload = {
  status: "ok" | "degraded" | "error";
  checked_at: string;
  mode: "live" | "ready";
  checks: HealthCheck[];
};

function statusFor(checks: HealthCheck[]) {
  const hasError = checks.some((check) => check.status === "error");
  const hasWarning = checks.some((check) => check.status === "warning");

  return hasError ? "error" : hasWarning ? "degraded" : "ok";
}

function configuredPositiveInteger(key: string, fallback: number) {
  const value = Number(getOptionalServerEnv(key));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function baseChecks(): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const extractionProviders = getExtractionProviderOrder();

  checks.push({
    name: "next",
    status: "ok",
    message: "Application server is responding.",
  });
  checks.push({
    name: "supabase_public_env",
    status: hasSupabaseConfig() ? "ok" : "error",
    message:
      supabaseUrl && supabaseAnonKey
        ? "Supabase public environment is configured."
        : "Supabase public URL or anon key is missing.",
  });
  checks.push({
    name: "supabase_service_role",
    status: getOptionalServerEnv("SUPABASE_SERVICE_ROLE_KEY")
      ? "ok"
      : "warning",
    message: getOptionalServerEnv("SUPABASE_SERVICE_ROLE_KEY")
      ? "Supabase service role is configured."
      : "Supabase service role is missing; admin workflows will be unavailable.",
  });
  checks.push({
    name: "openai_extraction",
    status:
      getOptionalServerEnv("OPENAI_API_KEY") &&
      getOptionalServerEnv("OPENAI_EXTRACTION_MODEL")
        ? "ok"
        : "warning",
    message:
      getOptionalServerEnv("OPENAI_API_KEY") &&
      getOptionalServerEnv("OPENAI_EXTRACTION_MODEL")
        ? "OpenAI extraction environment is configured."
        : "OpenAI extraction environment is incomplete.",
  });
  checks.push({
    name: "openai_transcription",
    status: getOptionalServerEnv("OPENAI_TRANSCRIPTION_MODEL")
      ? "ok"
      : "warning",
    message: getOptionalServerEnv("OPENAI_TRANSCRIPTION_MODEL")
      ? "OpenAI audio transcription environment is configured."
      : "OpenAI audio transcription model is missing; audio extraction will fail closed.",
  });
  checks.push({
    name: "ai_extraction_fallback",
    status: extractionProviders.includes("rule_based_text") ? "ok" : "warning",
    message: extractionProviders.includes("rule_based_text")
      ? `AI extraction provider order: ${extractionProviders.join(", ")}.`
      : "Rule-based text fallback is disabled.",
  });
  checks.push({
    name: "job_runner",
    status:
      getOptionalServerEnv("CRON_SECRET") ||
      getOptionalServerEnv("JOB_RUNNER_SECRET")
        ? "ok"
        : "warning",
    message:
      getOptionalServerEnv("CRON_SECRET") ||
      getOptionalServerEnv("JOB_RUNNER_SECRET")
        ? "Worker trigger secret is configured."
      : "Worker trigger secret is missing; queued jobs cannot run through protected worker routes.",
  });
  const rateLimitPosture = getRateLimitPosture();

  checks.push({
    name: "rate_limit_enforcement",
    status: rateLimitPosture.status,
    message: rateLimitPosture.message,
  });
  checks.push({
    name: "forwarded_ip_trust",
    status: getOptionalServerEnv("TRUST_FORWARDED_IP_HEADERS") === "true"
      ? "ok"
      : "warning",
    message:
      getOptionalServerEnv("TRUST_FORWARDED_IP_HEADERS") === "true"
        ? "Rate-limit client keys may use trusted forwarded IP headers."
        : "Forwarded IP headers are not trusted; rate-limit keys use explicit fallbacks. Enable only behind a trusted proxy.",
  });
  checks.push({
    name: "whatsapp",
    status:
      getOptionalServerEnv("WHATSAPP_APP_SECRET") &&
      getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN") &&
      getOptionalServerEnv("WHATSAPP_PHONE_NUMBER_ID")
        ? "ok"
        : "warning",
    message:
      getOptionalServerEnv("WHATSAPP_APP_SECRET") &&
      getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN") &&
      getOptionalServerEnv("WHATSAPP_PHONE_NUMBER_ID")
        ? "WhatsApp Cloud API environment is configured."
        : "WhatsApp Cloud API environment is incomplete.",
  });

  return checks;
}

function oldestAgeMinutes(rows: Array<{ created_at: string | null }>) {
  const timestamps = rows
    .map((row) => (row.created_at ? new Date(row.created_at).getTime() : NaN))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return Math.max(
    0,
    Math.floor((Date.now() - Math.min(...timestamps)) / 60_000),
  );
}

export function buildLivenessHealth(): HealthPayload {
  const checks: HealthCheck[] = [
    {
      name: "next",
      status: "ok",
      message: "Application server is responding.",
    },
  ];

  return {
    status: "ok",
    checked_at: new Date().toISOString(),
    mode: "live",
    checks,
  };
}

export async function buildReadinessHealth(): Promise<HealthPayload> {
  const checks = baseChecks();
  const admin = createAdminClient();

  if (admin) {
    const started = performance.now();
    const { error } = await withServerTiming(
      "health.supabase_database",
      () =>
        admin.from("firms").select("id", {
          count: "exact",
          head: true,
        }),
      { route: "health.ready" },
    );
    const durationMs = Math.round(performance.now() - started);

    checks.push({
      name: "supabase_database",
      status: error ? "error" : "ok",
      message: error
        ? `Database check failed in ${durationMs}ms: ${error.message}`
        : `Database query succeeded in ${durationMs}ms.`,
    });

    const staleJobWarningMinutes = configuredPositiveInteger(
      "OPERATIONS_ACTIVE_JOB_WARNING_MINUTES",
      15,
    );
    const failedJobWarningCount = configuredPositiveInteger(
      "OPERATIONS_FAILED_JOB_WARNING_COUNT",
      1,
    );
    const { data: jobRows, error: jobError } = await withServerTiming(
      "health.processing_jobs",
      () =>
        admin
          .from("processing_jobs")
          .select("status, created_at")
          .in("status", ["queued", "processing", "failed"])
          .limit(1000),
      { route: "health.ready" },
    );

    if (jobError) {
      checks.push({
        name: "processing_jobs",
        status: "warning",
        message: `Processing job health check unavailable: ${jobError.message}`,
      });
    } else {
      const rows = (jobRows ?? []) as Array<{
        status: string | null;
        created_at: string | null;
      }>;
      const activeRows = rows.filter(
        (row) => row.status === "queued" || row.status === "processing",
      );
      const failedCount = rows.filter((row) => row.status === "failed").length;
      const oldestActiveMinutes = oldestAgeMinutes(activeRows);
      const hasStaleActiveJob =
        oldestActiveMinutes !== null &&
        oldestActiveMinutes >= staleJobWarningMinutes;
      const hasFailedJobs = failedCount >= failedJobWarningCount;

      checks.push({
        name: "processing_jobs",
        status: hasStaleActiveJob || hasFailedJobs ? "warning" : "ok",
        message:
          `Active jobs: ${activeRows.length}; failed jobs: ${failedCount}; ` +
          `oldest active age: ${oldestActiveMinutes ?? 0} min; ` +
          `warning thresholds: ${staleJobWarningMinutes} min active age, ${failedJobWarningCount} failed job(s).`,
      });
    }
  }

  return {
    status: statusFor(checks),
    checked_at: new Date().toISOString(),
    mode: "ready",
    checks,
  };
}

export function healthStatusCode(payload: HealthPayload) {
  return payload.status === "error" ? 503 : 200;
}
