import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);
const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const migration = readFileSync(
  "supabase/migrations/20260912210000_bound_worker_concurrency_ordering.sql",
  "utf8",
);

try {
  await db.exec(`
    create role authenticated;
    create role anon;
    create role service_role bypassrls;
    create table whatsapp_webhook_events (
      id uuid primary key, provider_message_id text, raw_payload jsonb,
      message_payload jsonb, status text, attempt_count integer,
      ack_status text, ack_attempt_count integer, scheduled_at timestamptz,
      locked_at timestamptz, locked_by text, last_error text,
      processed_at timestamptz, created_at timestamptz
    );
    create table processing_jobs (
      id uuid primary key, firm_id uuid, client_id uuid, job_type text,
      entity_type text, entity_id uuid, status text, attempt_count integer,
      last_error text, scheduled_at timestamptz, completed_at timestamptz,
      created_at timestamptz, updated_at timestamptz, locked_at timestamptz,
      locked_by text
    );
  `);
  await db.exec(migration);
  await db.exec(`
    grant select, update on whatsapp_webhook_events to service_role;
    grant select, update on processing_jobs to service_role;
    insert into whatsapp_webhook_events (
      id,provider_message_id,raw_payload,message_payload,status,attempt_count,
      ack_status,ack_attempt_count,scheduled_at,created_at
    ) values
      ('${id(1)}','wa-1','{}','{"message":{"from":"+1 (555) 100"}}','queued',0,'not_sent',0,now()-interval '3 minutes',now()-interval '3 minutes'),
      ('${id(2)}','wa-2','{}','{"message":{"from":"1555100"}}','queued',0,'not_sent',0,now()-interval '2 minutes',now()-interval '2 minutes'),
      ('${id(3)}','wa-3','{}','{"message":{"from":"1555200"}}','queued',0,'not_sent',0,now()-interval '1 minute',now()-interval '1 minute');
    insert into processing_jobs (
      id,firm_id,client_id,job_type,entity_type,entity_id,status,attempt_count,
      scheduled_at,created_at,updated_at
    ) values
      ('${id(11)}','${id(100)}','${id(200)}','ai_extraction','document','${id(301)}','queued',0,now()-interval '3 minutes',now()-interval '3 minutes',now()-interval '3 minutes'),
      ('${id(12)}','${id(100)}','${id(200)}','ai_extraction','document','${id(302)}','queued',0,now()-interval '2 minutes',now()-interval '2 minutes',now()-interval '2 minutes'),
      ('${id(13)}','${id(100)}','${id(201)}','ai_extraction','document','${id(303)}','queued',0,now()-interval '1 minute',now()-interval '1 minute',now()-interval '1 minute');
    set role service_role;
  `);

  const whatsappClaim = (await db.query(
    "select id from claim_whatsapp_webhook_events(10,'wa-worker',interval '10 minutes',3)",
  )).rows.map((row) => row.id).sort();
  assert.deepEqual(whatsappClaim, [id(1), id(3)]);
  assert.equal((await db.query(
    "select count(*)::int as n from claim_whatsapp_webhook_events(10,'wa-worker-2',interval '10 minutes',3)",
  )).rows[0].n, 0);
  await db.exec(`update whatsapp_webhook_events set status='completed' where id='${id(1)}'`);
  assert.deepEqual((await db.query(
    "select id from claim_whatsapp_webhook_events(10,'wa-worker-3',interval '10 minutes',3)",
  )).rows.map((row) => row.id), [id(2)]);

  const aiClaim = (await db.query(
    "select id from claim_ai_extraction_jobs(10,'ai-worker')",
  )).rows.map((row) => row.id).sort();
  assert.deepEqual(aiClaim, [id(11), id(13)]);
  assert.equal((await db.query(
    `select count(*)::int as n from claim_ai_extraction_job('${id(12)}','exact-blocked')`,
  )).rows[0].n, 0);
  await db.exec(`update processing_jobs set status='completed' where id='${id(11)}'`);
  assert.deepEqual((await db.query(
    `select id from claim_ai_extraction_job('${id(12)}','exact-ready')`,
  )).rows.map((row) => row.id), [id(12)]);

  await db.exec(`
    reset role;
    insert into processing_jobs (
      id,firm_id,client_id,job_type,entity_type,entity_id,status,attempt_count,
      scheduled_at,created_at,updated_at
    ) values (
      '${id(14)}','${id(100)}','${id(202)}','ai_extraction','document','${id(304)}',
      'queued',0,now()-interval '1 minute',now()-interval '1 minute',now()-interval '1 minute'
    );
    insert into worker_ordering_leases(queue_name,ordering_key,owner_id,locked_at)
    values ('ai_extraction','${id(100)}:${id(202)}','${id(99)}',now()-interval '20 minutes');
    set role service_role;
  `);
  assert.deepEqual((await db.query(
    `select id from claim_ai_extraction_job('${id(14)}','stale-lease-recovery')`,
  )).rows.map((row) => row.id), [id(14)]);

  await db.exec("reset role; set role authenticated;");
  await assert.rejects(() => db.query("select * from worker_ordering_leases"));

  console.log("OK global sender/client ordering leases, independent claims, release triggers, exact-claim blocking and browser denial");
} finally {
  await db.close();
}
