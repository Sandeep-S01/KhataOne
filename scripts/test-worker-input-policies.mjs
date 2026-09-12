import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Optional isolated test dependency; never connects to a configured Supabase project.
const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const migration = "20260912100000_protect_worker_inputs.sql";
async function apply(name) {
  // gen_random_uuid is built into this PostgreSQL runtime; pgcrypto is not needed here.
  await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8")
    .replace(/create extension if not exists "pgcrypto";/g, ""));
}
async function denied(sql) {
  await assert.rejects(db.exec(sql), e => e.code === "42501");
}
async function actor(user) {
  await db.exec(`reset role; set request.jwt.claim.sub = '${id(user)}'; set role authenticated;`);
}
try {
  await db.exec(`
    create role authenticated; create role anon; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function public.set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at = now(); return new; end $$;
    create table storage.buckets(id text primary key, name text, public boolean);
  `);
  await apply("20260810181500_create_firms_and_memberships.sql");
  await db.exec(`
    create table public.clients(id uuid primary key, firm_id uuid not null references firms);
    create table public.gst_periods(id uuid primary key, firm_id uuid not null references firms, client_id uuid references clients);
    alter table clients enable row level security; alter table gst_periods enable row level security;
    create policy client_read on clients for select to authenticated using (is_firm_member(firm_id));
    create policy period_read on gst_periods for select to authenticated using (is_firm_member(firm_id));
  `);
  await apply("20260810193000_create_whatsapp_ingestion.sql");
  await apply("20260810213000_create_exports.sql");
  await apply("20260811110000_add_ai_extraction_job_worker.sql");
  await apply("20260910170000_export_generation_jobs.sql");
  await db.exec(`
    grant usage on schema public, auth to authenticated, anon, service_role;
    grant select, insert, update, delete on all tables in schema public to authenticated, anon, service_role;
    insert into auth.users values ('${id(1)}'), ('${id(2)}'), ('${id(3)}'), ('${id(4)}');
    insert into firms(id,name,slug,owner_user_id) values
      ('${id(10)}','A','a','${id(1)}'), ('${id(20)}','B','b','${id(2)}');
    insert into firm_users(firm_id,user_id,role,status) values
      ('${id(10)}','${id(1)}','staff','active'), ('${id(20)}','${id(2)}','owner','active'),
      ('${id(10)}','${id(3)}','viewer','active'), ('${id(10)}','${id(4)}','staff','disabled');
    insert into clients values ('${id(11)}','${id(10)}'), ('${id(21)}','${id(20)}');
    insert into gst_periods values ('${id(12)}','${id(10)}','${id(11)}'), ('${id(22)}','${id(20)}','${id(21)}');
    insert into documents(id,firm_id,client_id,document_type) values
      ('${id(13)}','${id(10)}','${id(11)}','text_note'), ('${id(23)}','${id(20)}','${id(21)}','text_note');
  `);
  await apply(migration);
  const exportSql = (n, client = 11, extra = "") => `insert into exports(id,firm_id,client_id,export_type,requested_by${extra ? ",storage_path" : ""})
    values ('${id(n)}','${id(10)}','${id(client)}','csv_transactions','${id(1)}'${extra ? `,'${extra}'` : ""});`;
  await actor(1);
  await db.exec(exportSql(30));
  await denied(exportSql(31, 21));
  await denied(exportSql(32, 11, "foreign/file.csv"));
  await denied(`insert into exports(firm_id,client_id,export_type,requested_by,created_at)
    values ('${id(10)}','${id(11)}','csv_transactions','${id(1)}',now()+interval '1 year');`);
  await denied(`update exports set storage_path='foreign/file.csv',status='failed' where id='${id(30)}';`);
  await denied(`update exports set status='completed' where id='${id(30)}';`);
  await denied(`update exports set created_at=now()-interval '1 year',status='failed' where id='${id(30)}';`);
  await denied(`insert into exports(firm_id,gst_period_id,export_type,requested_by) values ('${id(10)}','${id(22)}','pdf_summary','${id(1)}');`);
  await db.exec(`insert into exports(id,firm_id,gst_period_id,export_type,requested_by) values ('${id(33)}','${id(10)}','${id(12)}','pdf_summary','${id(1)}');`);
  const jobSql = (entity, client, type = "ai_extraction", entityType = "document") =>
    `insert into processing_jobs(firm_id,client_id,job_type,entity_type,entity_id) values
     ('${id(10)}',${client === null ? "null" : `'${id(client)}'`},'${type}','${entityType}','${id(entity)}');`;
  await denied(jobSql(23, 21));
  await denied(jobSql(13, 21));
  await denied(jobSql(13, 11, "export_generation"));
  await db.exec(jobSql(13, 11));
  await db.exec(jobSql(30, 11, "export_generation", "export"));
  await db.exec(jobSql(33, null, "export_generation", "export"));
  const result = await db.query(`update documents set storage_path='foreign' where id='${id(13)}' returning id`);
  assert.equal(result.rows.length, 0);
  assert.equal((await db.query("update processing_jobs set status='completed' returning id")).rows.length, 0);
  assert.equal((await db.query("delete from exports returning id")).rows.length, 0);
  await db.exec(`update exports set status='failed',metadata='{"error":"enqueue failed"}' where id='${id(30)}';`);
  await denied(`update exports set status='queued' where id='${id(30)}';`);
  for (const user of [2, 3, 4]) { await actor(user); await denied(exportSql(40 + user)); }
  await db.exec("reset role; set role anon;");
  await denied(exportSql(49));
  // Service-role behavior remains available for existing privileged processors.
  await db.exec(`reset role; set role service_role;
    update exports set status='completed',storage_path='${id(10)}/${id(30)}/file.csv',completed_at=now() where id='${id(30)}';
    update documents set status='extracted' where id='${id(13)}';`);
  assert.equal((await db.query(`select status from exports where id='${id(30)}'`)).rows[0].status, "completed");
  console.log("OK real PostgreSQL policy/trigger execution: two firms, staff/viewer/revoked/anon, job ownership, artifact protection, compensation and service-role writes");
} finally { await db.close(); }
