import { existsSync, readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  }
}

function read(path) {
  return readFileSync(path, "utf8");
}

const mediaInput = read("src/lib/ai/media-input.ts");
const extractionProviders = read("src/lib/ai/extraction-providers.ts");
const extractionProcessor = read("src/lib/ai/extraction-processor.ts");
const exportAction = read("src/app/actions/exports.ts");
const exportGenerator = read("src/lib/exports/generator.ts");
const exportWorker = read("src/lib/exports/worker.ts");
const exportRoute = read("src/app/api/jobs/exports/run-queued/route.ts");
const operationsAction = read("src/app/actions/operations.ts");
const operationsPage = read("src/app/(dashboard)/dashboard/operations/page.tsx");
const exportMigration = read(
  "supabase/migrations/20260910170000_export_generation_jobs.sql",
);
const vercelConfig = read("vercel.json");

assert(
  mediaInput.includes("input_image") &&
    mediaInput.includes("input_file") &&
    mediaInput.includes("openai.audio.transcriptions.create") &&
    mediaInput.includes("OPENAI_MEDIA_MAX_BYTES") &&
    mediaInput.includes("OPENAI_AUDIO_MAX_BYTES"),
  "OpenAI extraction must prepare bounded image, PDF, and audio inputs from stored media",
);

assert(
  extractionProviders.includes('from "@/lib/ai/media-input"') &&
    extractionProviders.includes("prepareOpenAIInputForDocument") &&
    extractionProviders.includes("inputProvenance"),
  "OpenAI extraction provider must use media preparation and preserve input provenance",
);

assert(
  extractionProcessor.includes("input_provenance") &&
    extractionProcessor.includes("preparedSourceText") &&
    extractionProcessor.includes("source_text") &&
    extractionProcessor.includes("failedExtractionMessage") &&
    extractionProcessor.includes("fallback unavailable because document source text is missing"),
  "extraction processor must store media provenance, save generated transcript text, and preserve actionable provider failures",
);

assert(
  exportAction.includes('status: "queued"') &&
    exportAction.includes('job_type: "export_generation"') &&
    exportAction.includes('action: "export.queued"') &&
    !exportAction.includes(".storage.from(\"exports\").upload"),
  "export action must queue durable export generation instead of doing request-path file work",
);

assert(
  exportGenerator.includes("processExportGeneration") &&
    exportGenerator.includes('.from("exports")') &&
    exportGenerator.includes(".upload(storagePath") &&
    exportGenerator.includes('action: "export.generated"') &&
    exportGenerator.includes("EXPORT_MAX_TRANSACTION_ROWS") &&
    exportGenerator.includes("EXPORT_MAX_FILE_BYTES") &&
    exportGenerator.includes("snapshot_approved_at_lte") &&
    exportGenerator.includes("csvRows("),
  "export generator must create bounded private storage artifacts with snapshot metadata and audit generated exports",
);

assert(
  exportWorker.includes("runQueuedExportGenerationJobs") &&
    exportWorker.includes("runExportGenerationJobNow") &&
    exportWorker.includes("claim_export_generation_jobs") &&
    exportWorker.includes("claim_export_generation_job") &&
    exportWorker.includes("processExportGeneration") &&
    exportWorker.includes('status: "completed"') &&
    exportWorker.includes('status: "failed"'),
  "export worker must claim, process, and finalize queued export generation jobs",
);

assert(
  operationsAction.includes("runExportGenerationJobNowAction") &&
    operationsAction.includes("runExportGenerationJobNow") &&
    operationsPage.includes("runExportGenerationJobNowAction") &&
    operationsPage.includes("Oldest active job"),
  "operations UI must expose queued export generation jobs and active queue age",
);

assert(
  existsSync("src/app/api/jobs/exports/run-queued/route.ts") &&
    exportRoute.includes("CRON_SECRET") &&
    exportRoute.includes("JOB_RUNNER_SECRET") &&
    exportRoute.includes("checkRateLimit") &&
    exportRoute.includes("runQueuedExportGenerationJobs"),
  "export worker route must be protected by runner secrets and bounded rate limiting",
);

assert(
  exportMigration.includes("processing_jobs_export_generation_unique_idx") &&
    exportMigration.includes("claim_export_generation_jobs") &&
    exportMigration.includes("claim_export_generation_job") &&
    exportMigration.includes("for update skip locked") &&
    exportMigration.includes("grant execute") &&
    exportMigration.includes("to service_role"),
  "export generation migration must enforce one job per export and provide service-role job claiming",
);

assert(
  vercelConfig.includes("/api/jobs/exports/run-queued"),
  "Vercel cron configuration must include the export generation worker route",
);

if (!process.exitCode) {
  console.log("OK phase 2 hardening checks passed");
}
