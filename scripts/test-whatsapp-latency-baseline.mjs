import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { NextResponse } from "next/server.js";

function load(path, dependencies) {
  const mod = { exports: {} };
  const js = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  new Function("require", "module", "exports", js)(
    (id) => {
      assert.ok(id in dependencies, `Unexpected dependency: ${id}`);
      return dependencies[id];
    },
    mod,
    mod.exports,
  );

  return mod.exports;
}

const timingCalls = [];
async function withServerTiming(name, operation, metadata = {}) {
  timingCalls.push({ name, metadata });
  return operation();
}

const verify = load("src/lib/whatsapp/verify.ts", { crypto: await import("node:crypto") });
const keyedWorkerPool = load("src/lib/jobs/keyed-worker-pool.ts", {});
const signedBody = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
const secret = "fixture-app-secret";
const signature = `sha256=${createHmac("sha256", secret).update(signedBody).digest("hex")}`;
assert.equal(
  verify.verifyMetaSignature({ rawBody: signedBody, signatureHeader: signature, appSecret: secret }),
  true,
);
assert.equal(
  verify.verifyMetaSignature({ rawBody: signedBody, signatureHeader: "sha256=00", appSecret: secret }),
  false,
);

{
  let enqueues = 0;
  let immediateRuns = 0;
  let immediateAiRuns = 0;
  let immediateEnabled = false;
  let immediateAiEnabled = false;
  let ingestionResults = [];
  const deferred = [];
  const route = load("src/app/api/webhooks/whatsapp/route.ts", {
    "@/lib/jobs/keyed-worker-pool": keyedWorkerPool,
    "next/server": { after: (callback) => deferred.push(callback), NextResponse },
    "@/lib/env": {
      getOptionalServerEnv: (name) =>
        name === "WHATSAPP_IMMEDIATE_INGESTION_ENABLED"
          ? String(immediateEnabled)
          : name === "WHATSAPP_IMMEDIATE_AI_ENABLED"
            ? String(immediateAiEnabled)
          : secret,
    },
    "@/lib/ai/extraction-worker": {
      runAiExtractionJobNow: async ({ jobId }) => {
        immediateAiRuns += 1;
        assert.equal(jobId, "job-new");
        return { ok: true, claimed: 1, failed: 0 };
      },
    },
    "@/lib/observability": { captureOperationalError() {} },
    "@/lib/performance": { withServerTiming },
    "@/lib/rate-limit": {
      checkRateLimit: async () => ({ ok: true, available: true }),
      clientRateLimitKey: () => "fixture",
      configuredRateLimitPerWindow: (_key, fallback) => fallback,
      retryAfterSeconds: () => 1,
    },
    "@/lib/whatsapp/ingestion-worker": {
      enqueueWhatsAppWebhookEvents: async () => {
        enqueues += 1;
        return { ok: true, accepted: 1, duplicateOrExisting: 0, received: 1 };
      },
      runQueuedWhatsAppIngestionEvents: async () => {
        immediateRuns += 1;
        return { ok: true, claimed: 1, failed: 0, results: ingestionResults };
      },
    },
    "@/lib/whatsapp/verify": {
      verifyMetaSignature: ({ signatureHeader }) => signatureHeader === "sha256=valid",
    },
  });
  const request = (providedSignature) =>
    new Request("https://example.test/api/webhooks/whatsapp", {
      method: "POST",
      headers: { "x-hub-signature-256": providedSignature },
      body: JSON.stringify({ entry: [{ changes: [] }] }),
    });
  assert.equal((await route.POST(request("sha256=invalid"))).status, 401);
  assert.equal(enqueues, 0);
  const accepted = await route.POST(request("sha256=valid"));
  assert.equal(accepted.status, 200);
  assert.equal(enqueues, 1);
  assert.equal((await accepted.json()).accepted, 1);
  assert.equal(deferred.length, 0);
  assert.equal(immediateRuns, 0);

  immediateEnabled = true;
  const immediate = await route.POST(request("sha256=valid"));
  assert.equal(immediate.status, 200);
  assert.equal(deferred.length, 1);
  assert.equal(immediateRuns, 0);
  await deferred[0]();
  assert.equal(immediateRuns, 1);
  assert.equal(immediateAiRuns, 0);

  ingestionResults = [{
    processingJobId: "job-new",
    processingJobCreated: true,
  }, {
    processingJobId: "job-existing",
    processingJobCreated: false,
  }];
  immediateAiEnabled = true;
  const immediateAi = await route.POST(request("sha256=valid"));
  assert.equal(immediateAi.status, 200);
  assert.equal(deferred.length, 2);
  assert.equal(immediateAiRuns, 0);
  await deferred[1]();
  assert.equal(immediateAiRuns, 1);
}

function createScenario({ matched = true, duplicate = false, existingJob = false, ackStatus = "not_sent", ackAttempts = 0 } = {}) {
  const state = {
    matched,
    duplicate,
    existingJob,
    ack: {
      ack_status: ackStatus,
      ack_attempt_count: ackAttempts,
      ack_last_attempt_at: null,
    },
    events: {},
    sends: [],
    uploads: [],
    mediaLookups: 0,
    mediaDownloads: 0,
    documentInserts: 0,
    jobInserts: 0,
    order: [],
  };

  class Query {
    constructor(table) {
      this.table = table;
      this.action = "select";
      this.payload = null;
    }

    select() { return this; }
    or() { return this; }
    neq() { return this; }
    limit() { return this; }
    eq() { return this; }
    upsert(payload) { this.action = "upsert"; this.payload = payload; return this; }
    insert(payload) { this.action = "insert"; this.payload = payload; return this; }
    update(payload) { this.action = "update"; this.payload = payload; return this; }
    single() { return this.execute(); }
    maybeSingle() { return this.execute(); }
    then(resolve, reject) { return this.execute().then(resolve, reject); }

    async execute() {
      if (this.table === "clients") {
        return {
          data: state.matched
            ? [{ id: "client-a", firm_id: "firm-a", business_name: "Fixture Books" }]
            : [],
          error: null,
        };
      }

      if (this.table === "whatsapp_webhook_events") {
        if (this.action === "select") return { data: state.ack, error: null };
        Object.assign(state.ack, this.payload);
        Object.assign(state.events, this.payload);
        return { data: null, error: null };
      }

      if (this.table === "whatsapp_messages") {
        if (this.action === "upsert") {
          return { data: state.duplicate ? null : { id: "message-row-a" }, error: null };
        }
        return { data: null, error: null };
      }

      if (this.table === "documents") {
        if (this.action === "insert") {
          state.order.push("document_insert");
          state.documentInserts += 1;
          return { data: { id: "document-a" }, error: null };
        }
        return { data: null, error: null };
      }

      if (this.table === "processing_jobs") {
        if (this.action === "select") {
          return { data: state.existingJob ? { id: "job-existing" } : null, error: null };
        }
        if (this.action === "insert") {
          state.order.push("job_insert");
          state.jobInserts += 1;
          return { data: { id: "job-a" }, error: null };
        }
        return { data: null, error: null };
      }

      throw new Error(`Unexpected table: ${this.table}`);
    }
  }

  const db = {
    from: (table) => new Query(table),
    storage: {
      from: () => ({
        upload: async (path) => {
          state.order.push("media_upload");
          state.uploads.push(path);
          return { error: null };
        },
      }),
    },
  };

  return { state, db };
}

function loadIngestion(scenario) {
  return load("src/lib/whatsapp/ingestion.ts", {
    "@/lib/supabase/server": { createAdminClient: () => scenario.db },
    "@/lib/performance": { withServerTiming },
    "@/lib/whatsapp/client": {
      sendWhatsAppText: async ({ to, body }) => {
        scenario.state.order.push("acknowledgment");
        scenario.state.sends.push({ to, body });
        return { ok: true };
      },
      getWhatsAppMediaUrl: async () => {
        scenario.state.order.push("media_lookup");
        scenario.state.mediaLookups += 1;
        return {
          ok: true,
          media: { url: "https://media.example.test/file", mime_type: "image/jpeg" },
        };
      },
      downloadWhatsAppMedia: async () => {
        scenario.state.order.push("media_download");
        scenario.state.mediaDownloads += 1;
        return { ok: true, data: Buffer.from("fixture"), contentType: "image/jpeg" };
      },
    },
  });
}

const value = { messaging_product: "whatsapp", metadata: {} };
const message = (id, type, extra = {}) => ({
  id,
  from: "919999999999",
  timestamp: "1789200000",
  type,
  ...extra,
});

{
  const scenario = createScenario();
  const ingestion = loadIngestion(scenario);
  const items = ingestion.extractWhatsAppInboundItems({
    entry: [{ changes: [{ value: { ...value, messages: [message("one", "text", { text: { body: "hello" } })] } }] }],
  });
  assert.equal(items.length, 1);
  const result = await ingestion.processWhatsAppInboundMessage(items[0].message, items[0].value, { eventId: "event-help" });
  assert.equal(result.terminalStatus, "ignored");
  assert.equal(scenario.state.sends.length, 1);
  assert.match(scenario.state.sends[0].body, /Fixture Books/);
  assert.equal(scenario.state.documentInserts, 0);
  assert.equal(scenario.state.jobInserts, 0);
}

{
  const scenario = createScenario({ matched: false });
  const ingestion = loadIngestion(scenario);
  const result = await ingestion.processWhatsAppInboundMessage(
    message("unmatched", "text", { text: { body: "invoice 100" } }),
    value,
    { eventId: "event-unmatched" },
  );
  assert.equal(result.terminalStatus, "unmatched");
  assert.equal(scenario.state.sends.length, 0);
  assert.equal(scenario.state.documentInserts, 0);
}

{
  const scenario = createScenario();
  const ingestion = loadIngestion(scenario);
  const result = await ingestion.processWhatsAppInboundMessage(
    message("text", "text", { text: { body: "Invoice INV-1 total 11800" } }),
    value,
    { eventId: "event-text" },
  );
  assert.equal(result.terminalStatus, "completed");
  assert.equal(scenario.state.documentInserts, 1);
  assert.equal(scenario.state.jobInserts, 1);
  assert.equal(result.processingJobCreated, true);
  assert.equal(scenario.state.sends.length, 1);
  assert.equal(scenario.state.mediaLookups, 0);
  assert.ok(
    scenario.state.order.indexOf("acknowledgment") <
      scenario.state.order.indexOf("document_insert"),
  );
}

{
  const scenario = createScenario();
  const ingestion = loadIngestion(scenario);
  const result = await ingestion.processWhatsAppInboundMessage(
    message("image", "image", { image: { id: "media-a", mime_type: "image/jpeg" } }),
    value,
    { eventId: "event-image" },
  );
  assert.equal(result.terminalStatus, "completed");
  assert.equal(scenario.state.mediaLookups, 1);
  assert.equal(scenario.state.mediaDownloads, 1);
  assert.equal(scenario.state.uploads.length, 1);
  assert.equal(scenario.state.documentInserts, 1);
  assert.equal(scenario.state.jobInserts, 1);
  assert.equal(result.processingJobCreated, true);
  assert.equal(scenario.state.sends.length, 1);
  assert.ok(
    scenario.state.order.indexOf("acknowledgment") <
      scenario.state.order.indexOf("media_lookup"),
  );
}

{
  const scenario = createScenario({ existingJob: true });
  const ingestion = loadIngestion(scenario);
  const result = await ingestion.processWhatsAppInboundMessage(
    message("existing-job", "text", { text: { body: "invoice" } }),
    value,
    { eventId: "event-existing-job" },
  );
  assert.equal(result.processingJobId, "job-existing");
  assert.equal(result.processingJobCreated, false);
  assert.equal(scenario.state.jobInserts, 0);
}

{
  const scenario = createScenario({ duplicate: true });
  const ingestion = loadIngestion(scenario);
  const result = await ingestion.processWhatsAppInboundMessage(
    message("duplicate", "text", { text: { body: "invoice" } }),
    value,
  );
  assert.equal(result.status, "duplicate");
  assert.equal(scenario.state.sends.length, 0);
  assert.equal(scenario.state.documentInserts, 0);
}

{
  const scenario = createScenario({ ackStatus: "failed", ackAttempts: 2 });
  const ingestion = loadIngestion(scenario);
  await ingestion.processWhatsAppInboundMessage(
    message("retry", "text", { text: { body: "invoice" } }),
    value,
    { eventId: "event-retry" },
  );
  assert.equal(scenario.state.sends.length, 1);
  assert.equal(scenario.state.ack.ack_status, "sent");
  assert.equal(scenario.state.ack.ack_attempt_count, 3);
}

{
  const scenario = createScenario({ ackStatus: "sent", ackAttempts: 1 });
  const ingestion = loadIngestion(scenario);
  await ingestion.processWhatsAppInboundMessage(
    message("ack-sent", "text", { text: { body: "invoice" } }),
    value,
    { eventId: "event-ack-sent" },
  );
  assert.equal(scenario.state.sends.length, 0);
}

const timingNames = new Set(timingCalls.map((call) => call.name));
for (const expected of [
  "whatsapp.ingestion.client_match",
  "whatsapp.ingestion.media",
  "whatsapp.ingestion.queue_extraction",
  "whatsapp.ingestion.acknowledgment",
]) {
  assert.ok(timingNames.has(expected), `Missing timing coverage: ${expected}`);
}
assert.doesNotMatch(JSON.stringify(timingCalls), /919999999999|INV-1|fixture-app-secret/);

{
  const eventCreatedAt = new Date(Date.now() - 2_000).toISOString();
  const db = {
    rpc: async () => ({
      data: [{
        id: "event-a",
        provider_message_id: "provider-a",
        message_payload: { message: message("worker", "text", { text: { body: "invoice" } }), value },
        status: "processing",
        attempt_count: 1,
        ack_status: "not_sent",
        ack_attempt_count: 0,
        locked_at: new Date().toISOString(),
        created_at: eventCreatedAt,
      }],
      error: null,
    }),
    from: () => {
      const query = { update: () => query, eq: () => query, then: (resolve) => Promise.resolve({}).then(resolve) };
      return query;
    },
  };
  const worker = load("src/lib/whatsapp/ingestion-worker.ts", {
    "@/lib/jobs/keyed-worker-pool": keyedWorkerPool,
    "@/lib/jobs/retry": { retryAtIso: () => new Date(Date.now() + 5_000).toISOString() },
    "@/lib/observability": { captureOperationalError() {} },
    "@/lib/performance": { withServerTiming },
    "@/lib/supabase/server": { createAdminClient: () => db },
    "@/lib/whatsapp/ingestion": {
      extractWhatsAppInboundItems: () => [],
      processWhatsAppInboundMessage: async () => ({
        status: "stored",
        terminalStatus: "completed",
        processingJobId: "job-worker-new",
        processingJobCreated: true,
      }),
    },
  });
  const result = await worker.runQueuedWhatsAppIngestionEvents();
  assert.equal(result.completed, 1);
  assert.equal(result.results[0].processingJobId, "job-worker-new");
  assert.equal(result.results[0].processingJobCreated, true);
  const timing = timingCalls.find((call) => call.name === "whatsapp.ingestion.event");
  assert.ok(timing.metadata.queue_wait_ms >= 1_500);
  assert.equal(timing.metadata.message_type, "text");
}

{
  const jobCreatedAt = new Date(Date.now() - 3_000).toISOString();
  const db = {
    rpc: async () => ({
      data: [{
        id: "job-worker-a",
        firm_id: "firm-a",
        client_id: "client-a",
        entity_type: "document",
        entity_id: "document-worker-a",
        attempt_count: 1,
        scheduled_at: jobCreatedAt,
        created_at: jobCreatedAt,
      }],
      error: null,
    }),
  };
  const worker = load("src/lib/ai/extraction-worker.ts", {
    "@/lib/jobs/keyed-worker-pool": keyedWorkerPool,
    "@/lib/ai/extraction-processor": {
      processDocumentExtraction: async () => ({ ok: true, status: "extracted", message: "done" }),
    },
    "@/lib/observability": { captureOperationalError() {} },
    "@/lib/performance": { withServerTiming },
    "@/lib/supabase/server": { createAdminClient: () => db },
  });
  const result = await worker.runQueuedAiExtractionJobs();
  assert.equal(result.completed, 1);
  const timing = timingCalls.find((call) => call.name === "ai.extraction.job");
  assert.ok(timing.metadata.queue_wait_ms >= 2_500);
  assert.equal(timing.metadata.attempt_count, 1);
}

assert.ok(timingNames.has("whatsapp.webhook.enqueue"));

console.log("OK WhatsApp signature, help, unmatched, text, media, duplicate, acknowledgment retry and timing baseline");
