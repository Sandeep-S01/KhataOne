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
  process.env.KHATAONE_PHASE2_CLEANUP_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_PHASE2_CLEANUP_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Set KHATAONE_PHASE2_CLEANUP_ALLOW_NON_PROD=true and KHATAONE_PHASE2_CLEANUP_TARGET_LABEL=non-production for an authorized staging database.",
  );
  process.exit(2);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const firmId = requireEnv("KHATAONE_PHASE2_CLEANUP_FIRM_ID");
const runId = requireEnv("KHATAONE_PHASE2_CLEANUP_RUN_ID");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: exports, error: exportsError } = await supabase
  .from("exports")
  .select("id, storage_path")
  .eq("firm_id", firmId)
  .eq("metadata->>fixture", "production-hardening-phase-2")
  .eq("metadata->>run_id", runId);

if (exportsError) {
  console.error(`FAIL cleanup export lookup: ${exportsError.message}`);
  process.exit(1);
}

const exportIds = (exports ?? []).map((row) => row.id);
const exportStoragePaths = (exports ?? [])
  .map((row) => row.storage_path)
  .filter((path) => typeof path === "string" && path.length > 0);

const { data: documents, error: documentsError } = await supabase
  .from("documents")
  .select("id, storage_path")
  .eq("firm_id", firmId)
  .or(
    [
      `file_name.ilike.%${runId}%`,
      `storage_path.ilike.%phase2-fixtures/${runId}%`,
    ].join(","),
  );

if (documentsError) {
  console.error(`FAIL cleanup document lookup: ${documentsError.message}`);
  process.exit(1);
}

const documentIds = (documents ?? []).map((row) => row.id);
const mediaStoragePaths = (documents ?? [])
  .map((row) => row.storage_path)
  .filter((path) => typeof path === "string" && path.length > 0);

assert(exportIds.length > 0, "cleanup must find at least one Phase 2 export fixture");
assert(documentIds.length > 0, "cleanup must find at least one Phase 2 document fixture");

if (process.exitCode) {
  process.exit(process.exitCode);
}

if (exportIds.length > 0) {
  const { error } = await supabase
    .from("processing_jobs")
    .delete()
    .eq("firm_id", firmId)
    .eq("job_type", "export_generation")
    .eq("entity_type", "export")
    .in("entity_id", exportIds);

  if (error) {
    console.error(`FAIL cleanup export jobs: ${error.message}`);
    process.exit(1);
  }
}

if (documentIds.length > 0) {
  const { error } = await supabase
    .from("processing_jobs")
    .delete()
    .eq("firm_id", firmId)
    .eq("job_type", "ai_extraction")
    .eq("entity_type", "document")
    .in("entity_id", documentIds);

  if (error) {
    console.error(`FAIL cleanup media extraction jobs: ${error.message}`);
    process.exit(1);
  }
}

if (documentIds.length > 0) {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("firm_id", firmId)
    .in("document_id", documentIds);

  if (error) {
    console.error(`FAIL cleanup transactions: ${error.message}`);
    process.exit(1);
  }
}

if (exportIds.length > 0) {
  const { error } = await supabase
    .from("exports")
    .delete()
    .eq("firm_id", firmId)
    .in("id", exportIds);

  if (error) {
    console.error(`FAIL cleanup exports: ${error.message}`);
    process.exit(1);
  }
}

if (documentIds.length > 0) {
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("firm_id", firmId)
    .in("id", documentIds);

  if (error) {
    console.error(`FAIL cleanup documents: ${error.message}`);
    process.exit(1);
  }
}

if (exportStoragePaths.length > 0) {
  const { error } = await supabase.storage
    .from("exports")
    .remove(exportStoragePaths);

  if (error) {
    console.error(`FAIL cleanup export storage: ${error.message}`);
    process.exit(1);
  }
}

if (mediaStoragePaths.length > 0) {
  const { error } = await supabase.storage
    .from("whatsapp-media-raw")
    .remove(mediaStoragePaths);

  if (error) {
    console.error(`FAIL cleanup media storage: ${error.message}`);
    process.exit(1);
  }
}

console.log("OK Phase 2 staging fixtures cleaned up");
console.log(`RUN_ID=${runId}`);
console.log(`DELETED_EXPORTS=${exportIds.length}`);
console.log(`DELETED_DOCUMENTS=${documentIds.length}`);
console.log(`DELETED_EXPORT_STORAGE_OBJECTS=${exportStoragePaths.length}`);
console.log(`DELETED_MEDIA_STORAGE_OBJECTS=${mediaStoragePaths.length}`);
