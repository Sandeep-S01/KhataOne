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
const updateCall = (firm = 10, transaction = 12, total = "118") => `select update_transaction_review(
  '${id(firm)}','${id(transaction)}','purchase','2026-09-12',' Vendor ','gstin-1','INV-1',
  ' Description ',' Supplies ','27',100,9,9,0,0,${total},'bank') as id`;
const decisionCall = (firm = 10, transaction = 12, status = "rejected") =>
  `select decide_transaction_review('${id(firm)}','${id(transaction)}','${status}',' Checked ') as id`;
async function actor(n) { await db.exec(`reset role; set request.jwt.claim.sub='${id(n)}'; set role authenticated;`); }

try {
  await db.exec(`create role authenticated; create role anon; create role service_role bypassrls; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at=now(); return new; end $$;`);
  await db.exec(sql("20260810181500_create_firms_and_memberships.sql"));
  await db.exec(`create table clients(id uuid primary key,firm_id uuid references firms);
    create table transactions(id uuid primary key,firm_id uuid,client_id uuid,document_id uuid,
      ai_extraction_id uuid,transaction_type text,status text,transaction_date date,party_name text,
      party_gstin text,invoice_number text,description text,category text,place_of_supply text,
      taxable_amount numeric(14,2),cgst_amount numeric(14,2),sgst_amount numeric(14,2),
      igst_amount numeric(14,2),cess_amount numeric(14,2),total_amount numeric(14,2),
      payment_mode text,confidence_score numeric(5,4) default 0,approved_by uuid,
      approved_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now());
    create table audit_logs(id uuid default gen_random_uuid(),firm_id uuid,client_id uuid,actor_user_id uuid,
      action text,entity_type text,entity_id uuid,before_data jsonb,after_data jsonb,metadata jsonb);
    alter table transactions enable row level security;
    create policy transaction_read on transactions for select to authenticated
      using (is_firm_member(firm_id));
    create policy transaction_insert on transactions for insert to authenticated
      with check (has_firm_role(firm_id,array['owner','admin','staff']));
    create policy transaction_update on transactions for update to authenticated
      using (has_firm_role(firm_id,array['owner','admin','staff']))
      with check (has_firm_role(firm_id,array['owner','admin','staff']));`);
  await db.exec(sql("20260912140000_protect_posted_transaction_lifecycle.sql"));
  await db.exec(sql("20260912150000_atomic_transaction_review_mutations.sql"));
  await db.exec(sql("20260912160000_control_transaction_clarification_and_writes.sql"));
  await db.exec(`grant usage on schema public,auth to authenticated,anon;
    grant select,insert,update,delete on all tables in schema public to authenticated,anon;
    grant select,insert,update,delete on all tables in schema public to service_role;
    insert into auth.users values ('${id(1)}'),('${id(2)}'),('${id(3)}'),('${id(4)}');
    insert into firms(id,name,slug,owner_user_id) values ('${id(10)}','A','a','${id(1)}'),('${id(20)}','B','b','${id(2)}');
    insert into firm_users(firm_id,user_id,role,status) values
      ('${id(10)}','${id(1)}','staff','active'),('${id(20)}','${id(2)}','owner','active'),
      ('${id(10)}','${id(3)}','viewer','active'),('${id(10)}','${id(4)}','staff','disabled');
    insert into clients values ('${id(11)}','${id(10)}'),('${id(21)}','${id(20)}');
    insert into transactions(id,firm_id,client_id,transaction_type,status,total_amount) values
      ('${id(12)}','${id(10)}','${id(11)}','unclear','needs_review',10),
      ('${id(13)}','${id(10)}','${id(11)}','sales','approved',20),
      ('${id(14)}','${id(10)}','${id(11)}','expense','draft',30),
      ('${id(16)}','${id(10)}','${id(11)}','expense','draft',35),
      ('${id(17)}','${id(10)}','${id(11)}','expense','draft',36),
      ('${id(22)}','${id(20)}','${id(21)}','sales','needs_review',40);`);

  await actor(1);
  assert.equal((await db.query(updateCall())).rows[0].id,id(12));
  let row = (await db.query(`select * from transactions where id='${id(12)}'`)).rows[0];
  assert.equal(row.party_name,"Vendor"); assert.equal(row.party_gstin,"GSTIN-1");
  assert.equal(row.total_amount,"118.00"); assert.equal(row.status,"needs_review");
  let audit = (await db.query("select * from audit_logs where action='transaction.updated'")).rows[0];
  assert.equal(audit.actor_user_id,id(1)); assert.equal(audit.before_data.total_amount,10);
  assert.equal(audit.after_data.total_amount,118); assert.equal(audit.metadata.review_boundary,"update_transaction_review");

  assert.equal((await db.query(decisionCall())).rows[0].id,id(12));
  assert.equal((await db.query(`select status from transactions where id='${id(12)}'`)).rows[0].status,"rejected");
  assert.equal((await db.query("select count(*)::int as n from audit_logs where action='transaction.rejected'")).rows[0].n,1);
  await db.exec(decisionCall());
  assert.equal((await db.query("select count(*)::int as n from audit_logs where action='transaction.rejected'")).rows[0].n,1,"same decision is idempotent");
  await db.exec(decisionCall(10,12,"duplicate"));
  assert.equal((await db.query(`select status from transactions where id='${id(12)}'`)).rows[0].status,"duplicate");

  const request = (await db.query(`select request_transaction_clarification(
    '${id(10)}','${id(16)}',' Need invoice ') as result`)).rows[0].result;
  assert.equal(request.client_id,id(11));
  assert.equal((await db.query(`select status from transactions where id='${id(16)}'`)).rows[0].status,"needs_review");
  const deliveryId = (await db.query(`select record_transaction_clarification_delivery(
    '${id(10)}','${id(16)}','${request.request_audit_id}',true,null) as id`)).rows[0].id;
  assert.ok(deliveryId);
  assert.equal((await db.query("select count(*)::int as n from audit_logs where action='transaction.clarification_delivered'")).rows[0].n,1);
  await assert.rejects(db.exec(`select record_transaction_clarification_delivery(
    '${id(10)}','${id(16)}','${id(99)}',true,null)`),e=>e.code==='42501');
  await assert.rejects(db.exec(`select request_transaction_clarification(
    '${id(10)}','${id(16)}','')`),e=>e.code==='22023');
  await assert.rejects(db.exec(`select request_transaction_clarification(
    '${id(10)}','${id(13)}','Need invoice')`),e=>e.code==='42501');
  assert.equal((await db.query(`update transactions set description='forged' where id='${id(16)}' returning id`)).rows.length,0);
  await assert.rejects(db.exec(`insert into transactions(id,firm_id,client_id,transaction_type,status)
    values ('${id(18)}','${id(10)}','${id(11)}','expense','draft')`),e=>e.code==='42501');
  await db.exec(`reset role; set role service_role;
    insert into transactions(id,firm_id,client_id,transaction_type,status)
      values ('${id(18)}','${id(10)}','${id(11)}','expense','draft');
    update transactions set description='service maintenance' where id='${id(13)}';`);
  await actor(1);
  assert.equal((await db.query(`select description from transactions where id='${id(13)}'`)).rows[0].description,"service maintenance");

  for (const statement of [updateCall(10,13),decisionCall(10,13),updateCall(10,22),decisionCall(10,22),
    updateCall(20,22),decisionCall(10,14,"approved"),updateCall(10,14,"'NaN'")]) {
    await assert.rejects(db.exec(statement),e=>["42501","22023"].includes(e.code));
  }
  for (const user of [2,3,4]) { await actor(user); await assert.rejects(db.exec(updateCall()),e=>e.code==='42501'); }
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.exec(updateCall()),e=>e.code==='42501');

  await db.exec(`reset role;
    create function reject_test_audit() returns trigger language plpgsql as $$ begin raise exception 'synthetic audit failure'; end $$;
    create trigger test_audit_failure before insert on audit_logs for each row execute function reject_test_audit();`);
  await actor(1);
  await assert.rejects(db.exec(updateCall(10,14,"75")),/synthetic audit failure/);
  row = (await db.query(`select * from transactions where id='${id(14)}'`)).rows[0];
  assert.equal(row.total_amount,"30.00"); assert.equal(row.status,"draft");
  await assert.rejects(db.exec(decisionCall(10,14)),/synthetic audit failure/);
  assert.equal((await db.query(`select status from transactions where id='${id(14)}'`)).rows[0].status,"draft");
  await assert.rejects(db.exec(`select request_transaction_clarification(
    '${id(10)}','${id(17)}','Need proof')`),/synthetic audit failure/);
  assert.equal((await db.query(`select status from transactions where id='${id(17)}'`)).rows[0].status,"draft");
  console.log("OK PostgreSQL atomic review edits/decisions, validation, tenant/role/status denial, idempotency and audit rollback");
} finally { await db.close(); }

let role = "staff", status = "needs_review", rpcError = null, rpcCalls = [];
const query = { select() { return this; }, eq() { return this; }, single: async () => ({
  data: { id: id(12), firm_id: id(10), client_id: id(11), status }, error: null,
}) };
const dependencies = {
  "next/cache": { revalidatePath() {} },
  "next/navigation": { redirect: () => { throw new Error("REDIRECT"); } },
  "@/lib/env": { hasSupabaseConfig: () => true },
  "@/lib/firms": { getFirmContext: async () => ({ firm: { id: id(10), role }, userId: id(1),
    supabase: { from: () => query, rpc: async (name,args) => { rpcCalls.push([name,args]); return { data: rpcError ? null : id(12), error: rpcError }; } } }) },
  "@/lib/observability": { captureOperationalError() {} },
  "@/lib/whatsapp/client": { sendWhatsAppText: async () => ({ok:true}) },
};
const source = ts.transpileModule(readFileSync("src/app/actions/review.ts","utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiled = { exports: {} };
new Function("require","module","exports",source)(name => {
  assert.ok(name in dependencies,`Unexpected dependency ${name}`); return dependencies[name];
},compiled,compiled.exports);
const form = new FormData();
form.set("transaction_id",id(12)); form.set("transaction_type","purchase"); form.set("total_amount","118");
await assert.rejects(compiled.exports.updateTransactionAction({status:"idle",message:""},form),/REDIRECT/);
assert.equal(rpcCalls[0][0],"update_transaction_review");
assert.equal(rpcCalls[0][1].target_firm_id,id(10)); assert.equal(rpcCalls[0][1].reviewed_total_amount,118);
rpcError={message:"private database detail"};
assert.ok(!(await compiled.exports.updateTransactionAction({status:"idle",message:""},form)).message.includes("private database"));
rpcError=null; rpcCalls=[];
const decision = new FormData(); decision.set("transaction_id",id(12)); decision.set("review_note","Checked");
await assert.rejects(compiled.exports.rejectTransactionAction(decision),/REDIRECT/);
assert.equal(rpcCalls[0][0],"decide_transaction_review"); assert.equal(rpcCalls[0][1].target_status,"rejected");
console.log("OK review actions use scoped atomic RPCs and keep database errors private");
