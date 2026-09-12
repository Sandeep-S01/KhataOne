import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);
const db=new PGlite();
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
const migration=readFileSync("supabase/migrations/20260912180000_recover_ai_extraction_jobs.sql","utf8");
try {
  await db.exec(`create role authenticated; create role anon; create role service_role bypassrls;
    create table processing_jobs(id uuid primary key,firm_id uuid,client_id uuid,job_type text,
      entity_type text,entity_id uuid,status text,attempt_count int,last_error text,
      scheduled_at timestamptz,completed_at timestamptz,created_at timestamptz,
      updated_at timestamptz,locked_at timestamptz,locked_by text);`);
  await db.exec(migration);
  await db.exec(`grant select,insert,update on processing_jobs to service_role;
    insert into processing_jobs values
      ('${id(1)}','${id(10)}',null,'ai_extraction','document','${id(101)}','queued',0,null,now()-interval '1 minute',null,now()-interval '1 hour',now()-interval '1 hour',null,null),
      ('${id(2)}','${id(10)}',null,'ai_extraction','document','${id(102)}','failed',1,'temporary',now()-interval '1 minute',now(),now()-interval '1 hour',now()-interval '1 hour',null,null),
      ('${id(3)}','${id(10)}',null,'ai_extraction','document','${id(103)}','processing',1,null,now()-interval '1 hour',null,now()-interval '1 hour',now()-interval '20 minutes',now()-interval '20 minutes','dead'),
      ('${id(4)}','${id(10)}',null,'ai_extraction','document','${id(104)}','processing',1,null,now()-interval '1 hour',null,now()-interval '1 hour',now(),now(),'live'),
      ('${id(5)}','${id(10)}',null,'ai_extraction','document','${id(105)}','processing',3,null,now()-interval '1 hour',null,now()-interval '1 hour',now()-interval '20 minutes',now()-interval '20 minutes','dead'),
      ('${id(6)}','${id(10)}',null,'ai_extraction','document','${id(106)}','queued',0,null,now()+interval '1 hour',null,now(),now(),null,null),
      ('${id(7)}','${id(10)}',null,'export_generation','export','${id(107)}','queued',0,null,now()-interval '1 hour',null,now(),now(),null,null),
      ('${id(8)}','${id(10)}',null,'ai_extraction','document','${id(108)}','processing',1,null,now()-interval '1 hour',null,now()-interval '1 hour',now()-interval '20 minutes',null,'dead');
    set role service_role;`);
  const claimed=(await db.query("select * from claim_ai_extraction_jobs(20,'worker-a')")).rows;
  assert.deepEqual(claimed.map(row=>row.id).sort(),[id(1),id(3),id(8)]);
  assert.ok(claimed.every(row=>row.attempt_count>=1));
  assert.equal((await db.query(`select status from processing_jobs where id='${id(4)}'`)).rows[0].status,"processing");
  assert.equal((await db.query(`select status from processing_jobs where id='${id(2)}'`)).rows[0].status,"failed");
  const exhausted=(await db.query(`select status,locked_at,completed_at from processing_jobs where id='${id(5)}'`)).rows[0];
  assert.equal(exhausted.status,"failed"); assert.equal(exhausted.locked_at,null); assert.ok(exhausted.completed_at);
  assert.equal((await db.query("select count(*)::int as n from claim_ai_extraction_jobs(20,'worker-b')")).rows[0].n,0);
  await db.exec(`reset role; update processing_jobs set status='processing',attempt_count=1,
    locked_at=now()-interval '20 minutes',updated_at=now()-interval '20 minutes' where id='${id(4)}'; set role service_role;`);
  const manual=(await db.query(`select * from claim_ai_extraction_job('${id(4)}','manual')`)).rows;
  assert.equal(manual.length,1); assert.equal(manual[0].attempt_count,2);
  assert.equal((await db.query(`select count(*)::int as n from claim_ai_extraction_job('${id(6)}','manual')`)).rows[0].n,0);
  console.log("OK AI queued claims, stale lease recovery, failed-job isolation, retry exhaustion, live/future isolation and manual reclaim");
} finally { await db.close(); }
