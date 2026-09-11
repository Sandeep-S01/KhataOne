import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

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

function optionalEnv(key, fallback) {
  return process.env[key] || fallback;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  }
}

if (
  process.env.KHATAONE_PHASE2_FIXTURE_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_PHASE2_FIXTURE_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Set KHATAONE_PHASE2_FIXTURE_ALLOW_NON_PROD=true and KHATAONE_PHASE2_FIXTURE_TARGET_LABEL=non-production for an authorized staging database.",
  );
  process.exit(2);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const firmId = requireEnv("KHATAONE_PHASE2_FIXTURE_FIRM_ID");
const clientId = requireEnv("KHATAONE_PHASE2_FIXTURE_CLIENT_ID");
const requestedByUserId = requireEnv("KHATAONE_PHASE2_FIXTURE_REQUESTED_BY_USER_ID");
const mediaFilePath = requireEnv("KHATAONE_PHASE2_FIXTURE_MEDIA_FILE");
const mediaMimeType = requireEnv("KHATAONE_PHASE2_FIXTURE_MEDIA_MIME_TYPE");
const mediaDocumentType = optionalEnv(
  "KHATAONE_PHASE2_FIXTURE_MEDIA_DOCUMENT_TYPE",
  "purchase_invoice",
);
const runId = optionalEnv(
  "KHATAONE_PHASE2_FIXTURE_RUN_ID",
  `phase2-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`,
);

if (!existsSync(mediaFilePath)) {
  console.error(`FAIL setup: Media fixture file not found: ${mediaFilePath}`);
  process.exit(2);
}

const mediaBytes = readFileSync(mediaFilePath);
const mediaFileName = basename(mediaFilePath);
const storagePath = `${firmId}/phase2-fixtures/${runId}/${mediaFileName}`;
const periodStart = optionalEnv("KHATAONE_PHASE2_FIXTURE_PERIOD_START", "2026-09-01");
const periodEnd = optionalEnv("KHATAONE_PHASE2_FIXTURE_PERIOD_END", "2026-09-30");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: firm, error: firmError } = await supabase
  .from("firms")
  .select("id")
  .eq("id", firmId)
  .single();
assert(!firmError && firm?.id === firmId, "firm fixture id must exist");

const { data: client, error: clientError } = await supabase
  .from("clients")
  .select("id, firm_id")
  .eq("id", clientId)
  .eq("firm_id", firmId)
  .single();
assert(!clientError && client?.id === clientId, "client fixture id must exist in firm");

const { data: membership, error: membershipError } = await supabase
  .from("firm_users")
  .select("id, role, status")
  .eq("firm_id", firmId)
  .eq("user_id", requestedByUserId)
  .eq("status", "active")
  .maybeSingle();
assert(!membershipError, "requesting user membership must be queryable");
assert(
  ["owner", "admin", "staff"].includes(membership?.role),
  "requesting user must be an active owner/admin/staff member",
);

if (process.exitCode) {
  process.exit(process.exitCode);
}

const commonMetadata = {
  fixture: "production-hardening-phase-2",
  run_id: runId,
  created_by: "seed-phase2-staging-fixtures.mjs",
};

const { error: uploadError } = await supabase.storage
  .from("whatsapp-media-raw")
  .upload(storagePath, mediaBytes, {
    contentType: mediaMimeType,
    upsert: false,
  });

if (uploadError) {
  console.error(`FAIL media upload: ${uploadError.message}`);
  process.exit(1);
}

const { data: exportDocument, error: exportDocumentError } = await supabase
  .from("documents")
  .insert({
    firm_id: firmId,
    client_id: clientId,
    document_type: "sales_invoice",
    file_name: `${runId}-approved-export-source.txt`,
    file_mime_type: "text/plain",
    source_text:
      "Synthetic Phase 2 export fixture invoice INV-PHASE2-001 dated 10 Sep 2026 from KhataOne Fixture Client total INR 1180 taxable INR 1000 CGST INR 90 SGST INR 90.",
    status: "extracted",
    received_at: new Date().toISOString(),
  })
  .select("id")
  .single();

if (exportDocumentError || !exportDocument) {
  console.error(
    `FAIL export source document insert: ${exportDocumentError?.message ?? "missing row"}`,
  );
  process.exit(1);
}

const { data: transaction, error: transactionError } = await supabase
  .from("transactions")
  .insert({
    firm_id: firmId,
    client_id: clientId,
    document_id: exportDocument.id,
    transaction_type: "sales",
    status: "approved",
    transaction_date: "2026-09-10",
    party_name: "KhataOne Phase 2 Fixture Party",
    invoice_number: `PHASE2-${runId.slice(-8).toUpperCase()}`,
    description: "Synthetic approved transaction for queued export worker smoke.",
    category: null,
    taxable_amount: 1000,
    cgst_amount: 90,
    sgst_amount: 90,
    igst_amount: 0,
    cess_amount: 0,
    total_amount: 1180,
    confidence_score: 0.99,
    approved_by: requestedByUserId,
    approved_at: new Date().toISOString(),
  })
  .select("id")
  .single();

if (transactionError || !transaction) {
  console.error(`FAIL approved transaction insert: ${transactionError?.message ?? "missing row"}`);
  process.exit(1);
}

const { data: exportRecord, error: exportError } = await supabase
  .from("exports")
  .insert({
    firm_id: firmId,
    client_id: clientId,
    export_type: "csv_transactions",
    status: "queued",
    requested_by: requestedByUserId,
    metadata: {
      ...commonMetadata,
      requested_period_start: periodStart,
      requested_period_end: periodEnd,
      client_id: clientId,
    },
  })
  .select("id")
  .single();

if (exportError || !exportRecord) {
  console.error(`FAIL export fixture insert: ${exportError?.message ?? "missing row"}`);
  process.exit(1);
}

const { error: exportJobError } = await supabase.from("processing_jobs").insert({
  firm_id: firmId,
  client_id: clientId,
  job_type: "export_generation",
  entity_type: "export",
  entity_id: exportRecord.id,
  status: "queued",
});

if (exportJobError) {
  console.error(`FAIL export job fixture insert: ${exportJobError.message}`);
  process.exit(1);
}

const { data: mediaDocument, error: mediaDocumentError } = await supabase
  .from("documents")
  .insert({
    firm_id: firmId,
    client_id: clientId,
    document_type: mediaDocumentType,
    file_name: mediaFileName,
    file_mime_type: mediaMimeType,
    storage_path: storagePath,
    source_text: null,
    status: "queued",
    received_at: new Date().toISOString(),
  })
  .select("id")
  .single();

if (mediaDocumentError || !mediaDocument) {
  console.error(`FAIL media document fixture insert: ${mediaDocumentError?.message ?? "missing row"}`);
  process.exit(1);
}

const { error: mediaJobError } = await supabase.from("processing_jobs").insert({
  firm_id: firmId,
  client_id: clientId,
  job_type: "ai_extraction",
  entity_type: "document",
  entity_id: mediaDocument.id,
  status: "queued",
});

if (mediaJobError) {
  console.error(`FAIL media extraction job fixture insert: ${mediaJobError.message}`);
  process.exit(1);
}

console.log("OK Phase 2 staging fixtures created");
console.log(`RUN_ID=${runId}`);
console.log(`KHATAONE_EXPORT_WORKER_EXPORT_ID=${exportRecord.id}`);
console.log(`KHATAONE_MEDIA_EXTRACTION_DOCUMENT_ID=${mediaDocument.id}`);
console.log(`WHATSAPP_MEDIA_RAW_STORAGE_PATH=${storagePath}`);
