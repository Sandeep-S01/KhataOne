import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import ts from "typescript";

const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const sql = name => readFileSync(`supabase/migrations/${name}`, "utf8").replace(/create extension if not exists "pgcrypto";/g, "");
const call = (firm = 10, client = 11, start = "2026-09-01", end = "2026-09-30") =>
  `select generate_gst_summary('${id(firm)}','${id(client)}','${start}','${end}','monthly') as id`;
async function actor(n) { await db.exec(`reset role; set request.jwt.claim.sub='${id(n)}'; set role authenticated;`); }
try {
  await db.exec(`
    create role authenticated; create role anon; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at=now(); return new; end $$;
  `);
  await db.exec(sql("20260810181500_create_firms_and_memberships.sql"));
  await db.exec(`
    create table clients(id uuid primary key,firm_id uuid references firms);
    create table transactions(id uuid default gen_random_uuid(),firm_id uuid,client_id uuid,
      status text,transaction_type text,transaction_date date,taxable_amount numeric,
      cgst_amount numeric,sgst_amount numeric,igst_amount numeric,total_amount numeric,party_gstin text,document_id uuid);
    create table audit_logs(id uuid default gen_random_uuid(),firm_id uuid,client_id uuid,actor_user_id uuid,
      action text,entity_type text,entity_id uuid,before_data jsonb,after_data jsonb,metadata jsonb);
  `);
  await db.exec(sql("20260810210000_create_gst_periods_and_summaries.sql"));
  await db.exec(sql("20260912110000_atomic_gst_summary.sql"));
  await db.exec(`
    grant usage on schema public,auth to authenticated,anon;
    grant select,insert,update,delete on all tables in schema public to authenticated,anon;
    insert into auth.users values ('${id(1)}'),('${id(2)}'),('${id(3)}'),('${id(4)}');
    insert into firms(id,name,slug,owner_user_id) values ('${id(10)}','A','a','${id(1)}'),('${id(20)}','B','b','${id(2)}');
    insert into firm_users(firm_id,user_id,role,status) values
      ('${id(10)}','${id(1)}','staff','active'),('${id(20)}','${id(2)}','owner','active'),
      ('${id(10)}','${id(3)}','viewer','active'),('${id(10)}','${id(4)}','staff','disabled');
    insert into clients values ('${id(11)}','${id(10)}'),('${id(21)}','${id(20)}');
    insert into transactions(firm_id,client_id,status,transaction_type,transaction_date,taxable_amount,
      cgst_amount,sgst_amount,igst_amount,total_amount,party_gstin,document_id)
    select '${id(10)}','${id(11)}','approved','sales','2026-09-10',100,9,9,0,118,'fixture','${id(99)}'
    from generate_series(1,1501);
    insert into transactions(firm_id,client_id,status,transaction_type,transaction_date,taxable_amount,
      cgst_amount,sgst_amount,igst_amount,total_amount,party_gstin,document_id)
    values ('${id(20)}','${id(21)}','approved','sales','2026-09-10',999999,1,1,0,1000001,'fixture','${id(99)}');
  `);
  await actor(1);
  const periodId = (await db.query(call())).rows[0].id;
  let summary = (await db.query("select * from gst_summaries")).rows[0];
  assert.equal(Number(summary.sales_taxable_amount), 150100);
  assert.equal(Number(summary.net_tax_payable), 27018);
  assert.equal((await db.query("select status from gst_periods")).rows[0].status, "ready");
  assert.equal((await db.query(call())).rows[0].id, periodId);
  assert.equal((await db.query("select count(*)::int as n from gst_summaries")).rows[0].n, 1);
  assert.equal((await db.query("select count(*)::int as n from audit_logs where before_data is not null")).rows[0].n, 1);
  assert.equal((await db.query("update gst_summaries set net_tax_payable=0 returning id")).rows.length, 0);
  await assert.rejects(db.exec(`insert into gst_periods(firm_id,client_id,period_start,period_end) values ('${id(10)}','${id(11)}','2026-01-01','2026-01-31')`), e => e.code === '42501');
  await assert.rejects(db.exec(call(10,21)), e => e.code === '42501');
  await assert.rejects(db.exec(call(10,11,"2026-10-01","2026-09-01")), e => e.code === '22023');
  for (const user of [2,3,4]) { await actor(user); await assert.rejects(db.exec(call()), e => e.code === '42501'); }
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.exec(call()), e => e.code === '42501');
  await db.exec(`reset role;
    insert into transactions(firm_id,client_id,status,transaction_date) values ('${id(10)}','${id(11)}','needs_review','2026-09-10');`);
  await actor(1);
  await db.exec(call());
  assert.equal((await db.query("select status from gst_periods")).rows[0].status, "needs_review");
  const logsBefore = (await db.query("select count(*)::int as n from audit_logs")).rows[0].n;
  await db.exec(`reset role;
    update transactions set taxable_amount=200 where firm_id='${id(10)}' and status='approved';
    create function reject_test_audit() returns trigger language plpgsql as $$ begin raise exception 'synthetic audit failure'; end $$;
    create trigger test_audit_failure before insert on audit_logs for each row execute function reject_test_audit();`);
  await actor(1);
  await assert.rejects(db.exec(call()), /synthetic audit failure/);
  summary = (await db.query("select * from gst_summaries")).rows[0];
  assert.equal(Number(summary.sales_taxable_amount), 150100, "failed audit rolls back summary update");
  await assert.rejects(db.exec(call(10,11,"2026-10-01","2026-10-31")), /synthetic audit failure/);
  assert.equal((await db.query("select count(*)::int as n from gst_periods")).rows[0].n, 1, "failed audit rolls back new period");
  assert.equal((await db.query("select count(*)::int as n from audit_logs")).rows[0].n, logsBefore);
  await db.exec(`reset role; drop trigger test_audit_failure on audit_logs;
    insert into transactions(firm_id,client_id,status,transaction_type,transaction_date,taxable_amount,
      cgst_amount,sgst_amount,igst_amount,total_amount,party_gstin)
    values ('${id(10)}','${id(11)}','approved','purchase','2026-09-10',100,9,9,0,118,'fixture');`);
  await actor(1); await db.exec(call());
  summary = (await db.query("select * from gst_summaries")).rows[0];
  assert.equal(Number(summary.purchase_taxable_amount),100);
  assert.equal(Number(summary.net_tax_payable),27000);
  assert.equal(summary.missing_document_count,1);
  assert.equal((await db.query("select status from gst_periods")).rows[0].status,"missing_documents");
  const emptyId = (await db.query(call(10,11,"2026-10-01","2026-10-31"))).rows[0].id;
  assert.equal((await db.query(`select status from gst_periods where id='${emptyId}'`)).rows[0].status,"needs_review");
  await db.exec(`reset role; update gst_summaries set firm_id='${id(20)}' where gst_period_id='${periodId}';`);
  await actor(1); await assert.rejects(db.exec(call()),e=>e.code==='42501');
  console.log("OK PostgreSQL GST aggregation >1500 rows, tenant/role checks, direct-write denial, regeneration and audit rollback");
} finally { await db.close(); }

let role = "viewer", calls = 0, error = null;
const dependencies = {
  "next/cache": { revalidatePath() {} },
  "next/navigation": { redirect: () => { throw new Error("REDIRECT"); } },
  "@/lib/env": { hasSupabaseConfig: () => true },
  "@/lib/firms": { getFirmContext: async () => ({ firm: { id: id(10), role },
    supabase: { rpc: async (name, args) => { calls++; assert.equal(name,"generate_gst_summary");
      assert.equal(args.target_firm_id,id(10)); return { data: id(30), error }; } } }) },
};
const mod = { exports: {} };
new Function("require","module","exports", ts.transpileModule(readFileSync("src/app/actions/gst.ts","utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(name => { assert.ok(name in dependencies); return dependencies[name]; },mod,mod.exports);
const form = new FormData();
form.set("client_id",id(11)); form.set("period_start","2026-09-01"); form.set("period_end","2026-09-30");
const action = () => mod.exports.generateGstSummaryAction({},form);
assert.equal((await action()).status,"error"); assert.equal(calls,0);
role = "staff"; error = { message: "PRIVATE DB error" };
const failure = await action(); assert.equal(failure.status,"error"); assert.ok(!failure.message.includes("PRIVATE"));
error = null; await assert.rejects(action(),/REDIRECT/);
form.set("period_start","2026-02-30"); const before = calls;
assert.equal((await action()).status,"error"); assert.equal(calls,before);
console.log("OK GST action role/date validation, RPC contract and error privacy");
