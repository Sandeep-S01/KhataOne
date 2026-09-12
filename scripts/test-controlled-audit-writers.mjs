import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
const sql = name => readFileSync(`supabase/migrations/${name}`,"utf8").replace(/create extension if not exists "pgcrypto";/g,"");
async function actor(n) { await db.exec(`reset role; set request.jwt.claim.sub='${id(n)}'; set role authenticated;`); }
const clientArgs = (firm=10,name="Client One") => `'${id(firm)}','${name}','Contact','12345678','12345678',
  'client@example.test','27ABCDE1234F1Z5','27','monthly','active'`;

try {
  await db.exec(`create role authenticated; create role anon; create role service_role bypassrls; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at=now(); return new; end $$;`);
  await db.exec(sql("20260810181500_create_firms_and_memberships.sql"));
  await db.exec(`
    create table clients(id uuid primary key default gen_random_uuid(),firm_id uuid,business_name text,
      contact_name text,phone text,whatsapp_phone text,email text,gstin text,state_code text,
      filing_frequency text,status text,assigned_user_id uuid,created_at timestamptz default now(),updated_at timestamptz default now());
    create table gst_periods(id uuid primary key,firm_id uuid,client_id uuid,period_start date,
      period_end date,filing_type text,status text,created_at timestamptz default now(),updated_at timestamptz default now());
    create table exports(id uuid primary key default gen_random_uuid(),firm_id uuid,client_id uuid,gst_period_id uuid,
      export_type text,status text default 'queued',storage_path text,requested_by uuid,completed_at timestamptz,
      metadata jsonb default '{}',created_at timestamptz default now(),updated_at timestamptz default now());
    create table processing_jobs(id uuid primary key default gen_random_uuid(),firm_id uuid,client_id uuid,
      job_type text,entity_type text,entity_id uuid,status text default 'queued',attempt_count int default 0,
      last_error text,scheduled_at timestamptz default now(),completed_at timestamptz,created_at timestamptz default now());
    create table documents(id uuid primary key,firm_id uuid,client_id uuid);
    create table audit_logs(id uuid primary key default gen_random_uuid(),firm_id uuid,client_id uuid,actor_user_id uuid,
      action text,entity_type text,entity_id uuid,before_data jsonb,after_data jsonb,metadata jsonb,created_at timestamptz default now());
    alter table clients enable row level security; alter table exports enable row level security;
    alter table processing_jobs enable row level security; alter table audit_logs enable row level security;
    create policy clients_all on clients for all to authenticated using(has_firm_role(firm_id,array['owner','admin','staff']))
      with check(has_firm_role(firm_id,array['owner','admin','staff']));
    create policy exports_all on exports for all to authenticated using(has_firm_role(firm_id,array['owner','admin','staff']))
      with check(has_firm_role(firm_id,array['owner','admin','staff']));
    create policy jobs_all on processing_jobs for all to authenticated using(has_firm_role(firm_id,array['owner','admin','staff']))
      with check(has_firm_role(firm_id,array['owner','admin','staff']));
    create policy audits_all on audit_logs for all to authenticated using(has_firm_role(firm_id,array['owner','admin','staff']))
      with check(has_firm_role(firm_id,array['owner','admin','staff']));
  `);
  await db.exec(sql("20260912170000_control_dashboard_audit_writers.sql"));
  await db.exec(`grant usage on schema public,auth to authenticated,anon,service_role;
    grant select,insert,update,delete on all tables in schema public to authenticated,anon,service_role;
    insert into auth.users values('${id(1)}'),('${id(2)}'),('${id(3)}'),('${id(4)}');
    insert into firms(id,name,slug,owner_user_id) values('${id(10)}','A','a','${id(1)}'),('${id(20)}','B','b','${id(2)}');
    insert into firm_users(firm_id,user_id,role,status) values
      ('${id(10)}','${id(1)}','staff','active'),('${id(20)}','${id(2)}','owner','active'),
      ('${id(10)}','${id(3)}','viewer','active'),('${id(10)}','${id(4)}','staff','disabled');
    insert into clients(id,firm_id,business_name,filing_frequency,status) values
      ('${id(11)}','${id(10)}','Existing','monthly','active'),('${id(21)}','${id(20)}','Foreign','monthly','active');
    insert into gst_periods values('${id(31)}','${id(10)}','${id(11)}','2026-09-01','2026-09-30','monthly','ready',now(),now());
    insert into documents values('${id(41)}','${id(10)}','${id(11)}');
    insert into processing_jobs(id,firm_id,client_id,job_type,entity_type,entity_id,status)
      values('${id(51)}','${id(10)}','${id(11)}','ai_extraction','document','${id(41)}','queued');`);

  await actor(1);
  const created=(await db.query(`select create_dashboard_client(${clientArgs()}) as id`)).rows[0].id;
  assert.ok(created);
  assert.equal((await db.query("select count(*)::int as n from audit_logs where action='client.created'")).rows[0].n,1);
  await db.exec(`select update_dashboard_client('${id(10)}','${created}','Updated','Contact','12345678',
    '12345678','client@example.test','27ABCDE1234F1Z5','27','quarterly','review_needed')`);
  assert.equal((await db.query(`select business_name from clients where id='${created}'`)).rows[0].business_name,"Updated");
  await db.exec(`select archive_dashboard_client('${id(10)}','${created}')`);
  await db.exec(`select archive_dashboard_client('${id(10)}','${created}')`);
  assert.equal((await db.query("select count(*)::int as n from audit_logs where action='client.archived'")).rows[0].n,1);

  const exportId=(await db.query(`select queue_dashboard_export('${id(10)}','${id(11)}',null,
    'csv_transactions','2026-09-01','2026-09-30') as id`)).rows[0].id;
  assert.equal((await db.query(`select count(*)::int as n from processing_jobs where entity_id='${exportId}'`)).rows[0].n,1);
  assert.equal((await db.query(`select count(*)::int as n from audit_logs where entity_id='${exportId}'`)).rows[0].n,1);
  const job=(await db.query(`select request_manual_job_run('${id(10)}','${id(51)}','ai_extraction','document') as job`)).rows[0].job;
  assert.equal(job.id,id(51));

  assert.equal((await db.query(`update clients set business_name='Forged' where id='${id(11)}' returning id`)).rows.length,0);
  await assert.rejects(db.exec(`insert into audit_logs(firm_id,actor_user_id,action,entity_type)
    values('${id(10)}','${id(1)}','forged','client')`),e=>e.code==='42501');
  await assert.rejects(db.exec(`insert into exports(firm_id,export_type,status) values('${id(10)}','csv_transactions','queued')`),e=>e.code==='42501');
  await assert.rejects(db.exec(`select update_dashboard_client('${id(10)}','${id(21)}','Nope',null,null,null,null,null,null,'monthly','active')`),e=>e.code==='42501');
  await assert.rejects(db.exec(`select queue_dashboard_export('${id(10)}','${id(21)}',null,'csv_transactions','2026-09-01','2026-09-30')`),e=>e.code==='22023');

  for(const user of [2,3,4]) { await actor(user); await assert.rejects(db.exec(`select create_dashboard_client(${clientArgs()})`),e=>e.code==='42501'); }
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.exec(`select create_dashboard_client(${clientArgs()})`),e=>e.code==='42501');

  await db.exec(`reset role; set role service_role;
    insert into audit_logs(firm_id,action,entity_type) values('${id(10)}','worker.audit','worker');
    update exports set status='processing' where id='${exportId}';`);
  await db.exec(`reset role;
    create function reject_test_audit() returns trigger language plpgsql as $$ begin raise exception 'synthetic audit failure'; end $$;
    create trigger test_audit_failure before insert on audit_logs for each row execute function reject_test_audit();`);
  await actor(1);
  await assert.rejects(db.exec(`select create_dashboard_client(${clientArgs(10,"Rollback Client")})`),/synthetic audit failure/);
  assert.equal((await db.query("select count(*)::int as n from clients where business_name='Rollback Client'")).rows[0].n,0);
  await assert.rejects(db.exec(`select queue_dashboard_export('${id(10)}','${id(11)}',null,
    'csv_transactions','2026-08-01','2026-08-31')`),/synthetic audit failure/);
  assert.equal((await db.query("select count(*)::int as n from exports where metadata->>'requested_period_start'='2026-08-01'")).rows[0].n,0);
  console.log("OK controlled client/export/job audit writers, direct-write denial, service-role access and rollback");
} finally { await db.close(); }
