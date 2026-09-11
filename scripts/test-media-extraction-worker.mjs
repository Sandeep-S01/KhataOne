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
  process.env.KHATAONE_MEDIA_EXTRACTION_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_MEDIA_EXTRACTION_TARGET_LABEL !== "non-production" ||
  process.env.KHATAONE_MEDIA_EXTRACTION_ALLOW_PROVIDER_COST !== "true"
) {
  console.error(
    "Refusing to run. Set KHATAONE_MEDIA_EXTRACTION_ALLOW_NON_PROD=true, KHATAONE_MEDIA_EXTRACTION_TARGET_LABEL=non-production, and KHATAONE_MEDIA_EXTRACTION_ALLOW_PROVIDER_COST=true for an authorized staging provider test.",
  );
  process.exit(2);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const baseUrl = requireEnv("KHATAONE_MEDIA_EXTRACTION_BASE_URL").replace(/\/$/, "");
const jobRunnerSecret = requireEnv("JOB_RUNNER_SECRET");
const documentId = requireEnv("KHATAONE_MEDIA_EXTRACTION_DOCUMENT_ID");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: document, error: documentError } = await supabase
  .from("documents")
  .select("id, firm_id, client_id, document_type, file_mime_type, storage_path, source_text")
  .eq("id", documentId)
  .single();

if (documentError || !document) {
  console.error(
    `FAIL setup: Document fixture not found: ${documentError?.message ?? documentId}`,
  );
  process.exit(2);
}

assert(Boolean(document.storage_path), "media extraction fixture must have private storage_path");
assert(
  !document.source_text,
  "media extraction fixture should exercise media bytes, not pre-existing source_text",
);

const { data: jobs, error: jobsError } = await supabase
  .from("processing_jobs")
  .select("id, status, job_type, entity_type, entity_id")
  .eq("entity_id", documentId)
  .eq("job_type", "ai_extraction")
  .eq("entity_type", "document");

if (jobsError) {
  console.error(`FAIL setup: Could not inspect extraction job fixture: ${jobsError.message}`);
  process.exit(2);
}

assert((jobs ?? []).length === 1, "document fixture must have exactly one AI extraction job");

if (process.exitCode) {
  process.exit(process.exitCode);
}

const response = await fetch(`${baseUrl}/api/jobs/ai-extraction/run-queued?batch_size=10`, {
  headers: {
    "x-job-runner-secret": jobRunnerSecret,
  },
});
const body = await response.json().catch(() => ({}));

assert(
  response.ok || response.status === 207,
  `AI worker route must return 200 or 207, received ${response.status}`,
);
assert(Array.isArray(body.results), "AI worker route must return a results array");
assert(
  body.results?.some((result) => result.documentId === documentId),
  "AI worker run must process the target media document fixture; increase batch size or isolate the fixture queue",
);

const { data: extraction, error: extractionError } = await supabase
  .from("ai_extractions")
  .select("id, document_id, status, raw_output, confidence_score, risk_flags")
  .eq("document_id", documentId)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

assert(!extractionError, "media extraction result must be readable");
assert(Boolean(extraction), "media extraction must create an extraction record");
assert(
  Boolean(extraction?.raw_output?.input_provenance),
  "media extraction must preserve input provenance in raw_output.input_provenance",
);

if (!process.exitCode) {
  console.log("OK media extraction worker smoke checks passed");
}
