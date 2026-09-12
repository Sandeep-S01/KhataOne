import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { NextResponse } from "next/server.js";

function load(path, dependencies) {
  const mod = { exports: {} };
  const js = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", js)((id) => {
    assert.ok(id in dependencies, `Unexpected dependency: ${id}`);
    return dependencies[id];
  }, mod, mod.exports);
  return mod.exports;
}

let secret;
let extractions = 0;
let rateLimitAvailable = true;
const extractionRoute = load("src/app/api/jobs/ai-extraction/route.ts", {
  "next/server": { NextResponse },
  "@/lib/env": { getOptionalServerEnv: () => secret },
  "@/lib/ai/extraction-processor": { processDocumentExtraction: async () => { extractions++; return { ok: true }; } },
  "@/lib/observability": { captureOperationalError() {} },
  "@/lib/rate-limit": { checkRateLimit: () => ({ ok: true, available: rateLimitAvailable }), clientRateLimitKey: () => "fixture",
    configuredRateLimitPerWindow: (_, n) => n, retryAfterSeconds: () => 1 },
});
const documentId = "00000000-0000-0000-0000-000000000001";
function request(token, body = { document_id: documentId }) {
  return new Request("https://example.test/api/jobs/ai-extraction", {
    method: "POST", headers: token ? { "x-job-runner-secret": token } : {}, body: JSON.stringify(body),
  });
}
assert.equal((await extractionRoute.POST(request())).status, 503);
secret = "fixture-secret";
rateLimitAvailable = false;
assert.equal((await extractionRoute.POST(request(secret))).status, 503);
assert.equal(extractions, 0);
rateLimitAvailable = true;
for (const token of [undefined, "incorrect"]) assert.equal((await extractionRoute.POST(request(token))).status, 401);
for (const body of [{}, { document_id: {} }, { document_id: "invalid" }, null]) {
  assert.equal((await extractionRoute.POST(request(secret, body))).status, 400);
}
assert.equal(extractions, 0);
assert.equal((await extractionRoute.POST(request(secret))).status, 200);
assert.equal(extractions, 1);

let role = "viewer";
let transactionStatus = "needs_review";
let sends = 0;
let writes = 0;
const reviewDb = { from(table) {
  const q = { select: () => q, eq: () => q,
    update: () => { writes++; return q; }, insert: async () => { writes++; return {}; },
    single: async () => ({ data: table === "transactions"
      ? { id: "tx", firm_id: "firm-a", client_id: "client-a", status: transactionStatus }
      : { whatsapp_phone: "synthetic", business_name: "Fixture" } }),
    then: (resolve) => Promise.resolve({}).then(resolve) };
  return q;
}, rpc: async (name) => {
  writes++;
  return name === "request_transaction_clarification"
    ? { data: { client_id: "client-a", request_audit_id: "audit-a" }, error: null }
    : { data: "delivery-a", error: null };
} };
const review = load("src/app/actions/review.ts", {
  "next/cache": { revalidatePath() {} },
  "next/navigation": { redirect: () => { throw new Error("REDIRECT"); } },
  "@/lib/env": { hasSupabaseConfig: () => true },
  "@/lib/firms": { getFirmContext: async () => ({ firm: { id: "firm-a", role }, supabase: reviewDb, userId: "actor" }) },
  "@/lib/observability": { captureOperationalError() {} },
  "@/lib/whatsapp/client": { sendWhatsAppText: async () => { sends++; return { ok: true }; } },
});
const form = new FormData();
form.set("transaction_id", "tx");
form.set("clarification_note", "Synthetic test");
for (role of ["viewer", "unknown"]) {
  await assert.rejects(review.requestClarificationAction(form), /REDIRECT/);
  assert.equal(sends, 0);
  assert.equal(writes, 0);
}
for (role of ["owner", "admin", "staff"]) await assert.rejects(review.requestClarificationAction(form), /REDIRECT/);
assert.equal(sends, 3);
role = "staff";
transactionStatus = "approved";
const postedSends = sends;
const postedWrites = writes;
await assert.rejects(review.requestClarificationAction(form), /REDIRECT/);
assert.equal(sends, postedSends);
assert.equal(writes, postedWrites);
transactionStatus = "needs_review";

let storagePath;
let downloads = 0;
const exportRow = { id: "export-a", firm_id: "firm-a", status: "completed" };
const exportQuery = { select() { return this; }, eq() { return this; },
  single: async () => ({ data: { ...exportRow, storage_path: storagePath } }) };
const download = load("src/app/api/exports/[exportId]/download/route.ts", {
  "next/server": { NextResponse },
  "@/lib/env": { hasSupabaseConfig: () => true },
  "@/lib/firms": { getFirmContext: async () => ({ firm: { id: "firm-a" }, supabase: { from: () => exportQuery } }) },
  "@/lib/supabase/server": { createAdminClient: () => ({ storage: { from: () => ({ download: async () => {
    downloads++; return { data: new Blob(["synthetic"]) };
  } }) } }) },
});
for (storagePath of ["firm-b/export-b/private.csv", "firm-a/export-b/private.csv",
  "firm-a/export-a/../private.csv", "firm-a/export-a/%2e%2e.csv", "firm-a/export-a/file\r\n.csv", "firm-a/export-a/"]) {
  assert.equal((await download.GET(null, { params: Promise.resolve({ exportId: "export-a" }) })).status, 409);
}
assert.equal(downloads, 0);
for (storagePath of ["firm-a/export-a/transactions-2026-09-01-to-2026-09-30.csv", "firm-a/export-a/gst-summary.pdf"]) {
  const response = await download.GET(null, { params: Promise.resolve({ exportId: "export-a" }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
}
assert.equal(downloads, 2);

// Exercise the real processors before their first financial/provider side effect.
for (const kind of ["document", "export"]) {
  let row;
  let mutationTables = [];
  let filters = [];
  const db = { from(table) {
    const q = { select: () => q, eq: (key, value) => { filters.push([key, value]); return q; },
      single: async () => ({ data: row }),
      update: () => { mutationTables.push(table); return q; },
      then: (resolve) => Promise.resolve({}).then(resolve) };
    return q;
  } };
  const dependencies = { "@/lib/supabase/server": { createAdminClient: () => db } };
  const processor = kind === "document"
    ? load("src/lib/ai/extraction-processor.ts", { ...dependencies,
      "@/lib/ai/extraction-schema": {}, "@/lib/ai/extraction-providers": {},
      "@/lib/jobs/retry": { retryAtIso: () => new Date().toISOString() } }).processDocumentExtraction
    : load("src/lib/exports/generator.ts", { ...dependencies, pdfkit: {},
      "@/lib/export/csv": {}, "@/lib/env": {} }).processExportGeneration;
  const owner = { firmId: "firm-a", clientId: "client-a" };
  for (row of [null, { firm_id: "firm-b", client_id: "client-a" }, { firm_id: "firm-a", client_id: "client-b" }]) {
    mutationTables = [];
    filters = [];
    const result = await processor("entity", kind === "document" ? { jobId: "job-a", expectedOwner: owner } : owner);
    assert.equal(result.ok, false);
    assert.ok(filters.some(([key, value]) => key === "firm_id" && value === "firm-a"));
    assert.ok(mutationTables.every(table => table === "processing_jobs"));
    if (kind === "document") assert.ok(filters.some(([key, value]) => key === "id" && value === "job-a"));
  }
}
for (const kind of ["document", "export"]) {
  const calls = [];
  const job = { id: "job-a", firm_id: "firm-a", client_id: "client-a", entity_type: kind, entity_id: "entity-a" };
  const db = { rpc: async () => ({ data: [job] }), from: () => {
    const q = { update: () => q, eq: () => q, then: resolve => Promise.resolve({}).then(resolve) };
    return q;
  } };
  const common = { "@/lib/supabase/server": { createAdminClient: () => db },
    "@/lib/jobs/keyed-worker-pool": { runKeyedWorkerPool: async ({ items, worker }) => Promise.all(items.map(worker)) },
    "@/lib/observability": { captureOperationalError() {} },
    "@/lib/performance": { withServerTiming: async (_name, operation) => operation() } };
  const worker = kind === "document"
    ? load("src/lib/ai/extraction-worker.ts", { ...common, "@/lib/ai/extraction-processor": {
      processDocumentExtraction: async (...args) => { calls.push(args); return { ok: true, status: "extracted" }; },
    } })
    : load("src/lib/exports/worker.ts", { ...common, "@/lib/exports/generator": {
      processExportGeneration: async (...args) => { calls.push(args); return { ok: true }; },
    } });
  const batch = kind === "document" ? worker.runQueuedAiExtractionJobs : worker.runQueuedExportGenerationJobs;
  const manual = kind === "document" ? worker.runAiExtractionJobNow : worker.runExportGenerationJobNow;
  assert.equal((await batch()).ok, true);
  assert.equal((await manual({ jobId: job.id })).ok, true);
  assert.equal(calls.length, 2);
  for (const [id, options] of calls) {
    assert.equal(id, job.entity_id);
    assert.deepEqual(kind === "document" ? options.expectedOwner : options,
      { firmId: job.firm_id, clientId: job.client_id });
  }
}
const queuedExports = [];
const exportAction = load("src/app/actions/exports.ts", {
  "next/cache": { revalidatePath() {} }, "@/lib/env": { hasSupabaseConfig: () => true },
  "@/lib/firms": { getFirmContext: async () => ({ firm: { id: "firm-a", role: "staff" }, userId: "actor",
    supabase: { rpc: async (name,args) => {
      assert.equal(name,"queue_dashboard_export"); queuedExports.push(args);
      return { data:"export-a",error:null };
    } } }) },
});
const exportForm = new FormData();
exportForm.set("client_id", "client-a");
exportForm.set("gst_period_id", "period-a");
exportForm.set("period_start", "2026-09-01");
exportForm.set("period_end", "2026-09-30");
for (const type of ["csv_transactions", "gst_summary", "pdf_summary"]) {
  exportForm.set("export_type", type);
  assert.equal((await exportAction.createExportAction({}, exportForm)).status, "success");
  const expectedClient = type === "csv_transactions" ? "client-a" : null;
  const request = queuedExports.at(-1);
  assert.equal(request.target_client_id, expectedClient);
  assert.equal(request.target_gst_period_id, type === "csv_transactions" ? null : "period-a");
}
console.log("OK worker authentication, viewer side effects, export path isolation, batch/manual ownership and export selector normalization");
