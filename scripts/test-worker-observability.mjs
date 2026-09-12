import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import ts from "typescript";

const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);

const migration = readFileSync(
  "supabase/migrations/20260912220000_observe_whatsapp_recovery.sql",
  "utf8",
);

const db = new PGlite();

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

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table firms(id uuid primary key);
    create table clients(id uuid primary key);
    create table processing_jobs(
      id uuid primary key default gen_random_uuid(), firm_id uuid, client_id uuid,
      job_type text, entity_type text, status text, attempt_count integer default 0,
      scheduled_at timestamptz default now(), locked_at timestamptz,
      created_at timestamptz default now(), updated_at timestamptz default now()
    );
    create table whatsapp_webhook_events(
      id uuid primary key default gen_random_uuid(), status text,
      attempt_count integer default 0, scheduled_at timestamptz default now(),
      locked_at timestamptz, ack_sent_at timestamptz, received_at timestamptz default now(),
      created_at timestamptz default now(), updated_at timestamptz default now()
    );
    create table worker_ordering_leases(
      queue_name text, ordering_key text, owner_id uuid, locked_at timestamptz,
      primary key(queue_name, ordering_key)
    );
  `);

  await db.exec(migration);
  await db.exec(`
    insert into whatsapp_webhook_events(status, scheduled_at, received_at, created_at)
    values ('queued', now() - interval '2 minutes', now() - interval '2 minutes', now() - interval '2 minutes');
    insert into whatsapp_webhook_events(status, locked_at, ack_sent_at, received_at, created_at)
    values ('completed', now() - interval '1 hour' + interval '2 seconds',
      now() - interval '1 hour' + interval '3 seconds', now() - interval '1 hour', now() - interval '1 hour');
    insert into whatsapp_webhook_events(status, attempt_count, updated_at)
    values ('failed', 3, now());
    insert into processing_jobs(job_type, entity_type, status, attempt_count, scheduled_at, created_at, updated_at)
    values ('ai_extraction', 'document', 'queued', 1, now() - interval '1 minute', now() - interval '1 minute', now());
    insert into worker_ordering_leases(queue_name, ordering_key, owner_id, locked_at)
    values ('whatsapp_ingestion', 'sender:test', gen_random_uuid(), now() - interval '11 minutes');
  `);

  await db.exec("set role service_role");
  const started = await db.query(
    "select begin_background_worker_run('whatsapp_ingestion','external_scheduler') as id",
  );
  const runId = started.rows[0].id;
  assert.ok(runId);
  const completed = await db.query(
    `select complete_background_worker_run('${runId}',true,1,1,0,0,null) as completed`,
  );
  assert.equal(completed.rows[0].completed, true);

  const health = await db.query("select * from get_whatsapp_pipeline_health()");
  const whatsapp = health.rows.find((row) => row.queue_name === "whatsapp_ingestion");
  const extraction = health.rows.find((row) => row.queue_name === "ai_extraction");
  assert.equal(Number(whatsapp.queued_count), 1);
  assert.equal(Number(whatsapp.p95_claim_delay_ms), 2000);
  assert.equal(Number(whatsapp.p95_ack_delay_ms), 3000);
  assert.equal(Number(whatsapp.stale_lease_count), 1);
  assert.equal(Number(whatsapp.terminal_failure_count), 1);
  assert.ok(whatsapp.last_worker_completed_at);
  assert.ok(whatsapp.last_worker_success_at);
  assert.equal(Number(extraction.queued_count), 1);
  assert.equal(Number(extraction.retrying_count), 1);

  await db.exec("reset role; set role authenticated");
  await assert.rejects(() => db.query("select * from get_whatsapp_pipeline_health()"));
  await assert.rejects(() => db.query("select * from background_worker_runs"));

  console.log(
    "OK service-only worker heartbeats, aggregate latency health, stale leases and browser denial",
  );
} finally {
  await db.close();
}

const nowMs = Date.parse("2026-09-12T12:00:00.000Z");
const runtime = load("src/lib/jobs/worker-observability.ts", {
  "server-only": {},
  "@/lib/env": { getOptionalServerEnv: () => undefined },
  "@/lib/observability": { captureOperationalError() {} },
  "@/lib/supabase/server": { createAdminClient: () => null },
});
const row = {
  queue_name: "whatsapp_ingestion",
  queued_count: 1,
  oldest_queued_at: "2026-09-12T11:58:00.000Z",
  p95_claim_delay_ms: 2000,
  p95_ack_delay_ms: 3000,
  stale_lease_count: 1,
  retrying_count: 0,
  terminal_failure_count: 2,
  recent_failure_count: 1,
  last_worker_completed_at: "2026-09-12T11:50:00.000Z",
  last_worker_success_at: "2026-09-12T11:50:00.000Z",
  last_worker_succeeded: true,
  last_claimed_count: 1,
  last_processed_count: 1,
  last_failed_count: 0,
  last_retrying_count: 0,
};
const alerts = runtime.evaluatePipelineAlerts({
  rows: [row],
  previousRows: [{ ...row, terminal_failure_count: 1 }],
  nowMs,
});
assert.deepEqual(
  alerts.map((alert) => alert.code).sort(),
  ["oldest_inbound", "stale_lease", "terminal_failure_rise", "worker_completion"].sort(),
);
