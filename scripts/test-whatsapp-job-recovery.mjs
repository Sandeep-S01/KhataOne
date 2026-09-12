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
  "supabase/migrations/20260912200000_classify_whatsapp_retries.sql",
  "utf8",
);

try {
  await db.exec(`
    create role authenticated;
    create role anon;
    create role service_role bypassrls;
    create table whatsapp_webhook_events (
      id uuid primary key,
      provider_message_id text,
      raw_payload jsonb,
      message_payload jsonb,
      status text,
      attempt_count integer,
      ack_status text,
      ack_attempt_count integer,
      scheduled_at timestamptz,
      locked_at timestamptz,
      locked_by text,
      last_error text,
      processed_at timestamptz,
      created_at timestamptz
    );
  `);
  await db.exec(migration);
  await db.exec(`
    grant select, update on whatsapp_webhook_events to service_role;
    insert into whatsapp_webhook_events values
      ('${id(1)}','queued','{}','{}','queued',0,'not_sent',0,now()-interval '1 minute',null,null,null,null,now()-interval '2 minutes'),
      ('${id(2)}','terminal','{}','{}','failed',1,'failed',1,now()-interval '1 minute',null,null,'terminal',null,now()-interval '2 minutes'),
      ('${id(3)}','future','{}','{}','queued',1,'failed',1,now()+interval '1 hour',null,null,'retry',null,now()-interval '2 minutes'),
      ('${id(4)}','stale','{}','{}','processing',1,'sent',1,now()-interval '1 hour',now()-interval '20 minutes','dead',null,null,now()-interval '1 hour'),
      ('${id(5)}','live','{}','{}','processing',1,'sent',1,now()-interval '1 hour',now(),'live',null,null,now()-interval '1 hour');
    set role service_role;
  `);

  const claimed = (await db.query(
    "select * from claim_whatsapp_webhook_events(10,'worker-a',interval '10 minutes',3)",
  )).rows;
  assert.deepEqual(claimed.map((row) => row.id).sort(), [id(1), id(4)]);
  assert.ok(claimed.every((row) => row.status === "processing"));
  assert.equal(
    (await db.query(`select status from whatsapp_webhook_events where id='${id(2)}'`)).rows[0].status,
    "failed",
  );
  assert.equal(
    (await db.query(`select status from whatsapp_webhook_events where id='${id(3)}'`)).rows[0].status,
    "queued",
  );
  assert.equal(
    (await db.query(`select status from whatsapp_webhook_events where id='${id(5)}'`)).rows[0].status,
    "processing",
  );
  console.log("OK WhatsApp due-queue claims, stale recovery, terminal-failure isolation and future/live isolation");
} finally {
  await db.close();
}
