import { createClient } from "@supabase/supabase-js";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

function requireEnv(key) {
  const value = process.env[key];

  if (!value) {
    console.error(`FAIL setup: Missing ${key}`);
    process.exit(2);
  }

  return value;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  }
}

if (
  process.env.KHATAONE_EXPORT_WORKER_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_EXPORT_WORKER_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Set KHATAONE_EXPORT_WORKER_ALLOW_NON_PROD=true and KHATAONE_EXPORT_WORKER_TARGET_LABEL=non-production for an authorized staging app/database.",
  );
  process.exit(2);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const baseUrl = requireEnv("KHATAONE_EXPORT_WORKER_BASE_URL").replace(/\/$/, "");
const jobRunnerSecret = requireEnv("JOB_RUNNER_SECRET");
const exportId = requireEnv("KHATAONE_EXPORT_WORKER_EXPORT_ID");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: beforeExport, error: beforeExportError } = await supabase
  .from("exports")
  .select("id, firm_id, export_type, status, storage_path")
  .eq("id", exportId)
  .single();

if (beforeExportError || !beforeExport) {
  console.error(
    `FAIL setup: Export fixture not found: ${beforeExportError?.message ?? exportId}`,
  );
  process.exit(2);
}

const { data: jobs, error: jobsError } = await supabase
  .from("processing_jobs")
  .select("id, status, job_type, entity_type, entity_id")
  .eq("entity_id", exportId)
  .eq("job_type", "export_generation")
  .eq("entity_type", "export");

if (jobsError) {
  console.error(`FAIL setup: Could not inspect export job fixture: ${jobsError.message}`);
  process.exit(2);
}

assert((jobs ?? []).length === 1, "export fixture must have exactly one generation job");

if (process.exitCode) {
  process.exit(process.exitCode);
}

const response = await fetch(`${baseUrl}/api/jobs/exports/run-queued?batch_size=10`, {
  headers: {
    "x-job-runner-secret": jobRunnerSecret,
  },
});
const body = await response.json().catch(() => ({}));

assert(
  response.ok || response.status === 207,
  `worker route must return 200 or 207, received ${response.status}`,
);
assert(
  Array.isArray(body.results),
  "worker route must return a results array",
);
assert(
  body.results?.some((result) => result.exportId === exportId),
  "worker run must process the target export fixture; increase batch size or isolate the fixture queue",
);

const { data: afterExport, error: afterExportError } = await supabase
  .from("exports")
  .select("id, status, storage_path, completed_at")
  .eq("id", exportId)
  .single();

assert(!afterExportError, "export fixture must be readable after worker run");
assert(afterExport?.status === "completed", "export fixture must complete");
assert(Boolean(afterExport?.storage_path), "completed export must have a private storage path");
assert(Boolean(afterExport?.completed_at), "completed export must record completion time");

if (afterExport?.storage_path) {
  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from("exports")
    .createSignedUrl(afterExport.storage_path, 60);

  assert(!signedUrlError, "completed export storage object must be signable");
  assert(Boolean(signedUrl?.signedUrl), "completed export storage object must have a signed URL");
}

if (!process.exitCode) {
  console.log("OK export generation worker smoke checks passed");
}
