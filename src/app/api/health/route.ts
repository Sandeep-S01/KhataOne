import { NextResponse } from "next/server";

import {
  getOptionalServerEnv,
  getPublicEnv,
  hasSupabaseConfig,
} from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Check = {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
};

export async function GET() {
  const checks: Check[] = [];
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

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
    name: "ai_worker",
    status:
      getOptionalServerEnv("CRON_SECRET") ||
      getOptionalServerEnv("JOB_RUNNER_SECRET")
        ? "ok"
        : "warning",
    message:
      getOptionalServerEnv("CRON_SECRET") ||
      getOptionalServerEnv("JOB_RUNNER_SECRET")
        ? "AI worker trigger secret is configured."
        : "AI worker trigger secret is missing; queued jobs cannot run through the protected worker route.",
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

  const admin = createAdminClient();

  if (admin) {
    const { error } = await admin.from("firms").select("id", {
      count: "exact",
      head: true,
    });

    checks.push({
      name: "supabase_database",
      status: error ? "error" : "ok",
      message: error
        ? `Database check failed: ${error.message}`
        : "Database query succeeded.",
    });
  }

  const hasError = checks.some((check) => check.status === "error");
  const hasWarning = checks.some((check) => check.status === "warning");

  return NextResponse.json(
    {
      status: hasError ? "error" : hasWarning ? "degraded" : "ok",
      checked_at: new Date().toISOString(),
      checks,
    },
    {
      status: hasError ? 503 : 200,
    },
  );
}
