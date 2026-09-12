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
const call = (firm = 10, entry = 31, debit = "125", credit = "0") =>
  `select correct_ledger_entry('${id(firm)}','${id(entry)}','2026-09-12','Corrected',${debit},${credit},'Note','Reason') as id`;
async function actor(n) { await db.exec(`reset role; set request.jwt.claim.sub='${id(n)}'; set role authenticated;`); }
try {
  await db.exec(`create role authenticated; create role anon; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at=now(); return new; end $$;`);
  await db.exec(sql("20260810181500_create_firms_and_memberships.sql"));
  await db.exec(`create table clients(id uuid primary key,firm_id uuid references firms);
    create table transactions(id uuid primary key,firm_id uuid,client_id uuid,status text,
      transaction_type text,total_amount numeric,transaction_date date,category text,
      party_name text,description text,approved_by uuid,approved_at timestamptz);
    create table audit_logs(id uuid default gen_random_uuid(),firm_id uuid,client_id uuid,actor_user_id uuid,
      action text,entity_type text,entity_id uuid,before_data jsonb,after_data jsonb,metadata jsonb);`);
  await db.exec(sql("20260810203000_create_ledger_entries_and_review_policies.sql"));
  await db.exec(sql("20260910160000_atomic_transaction_approval.sql"));
  await db.exec(sql("20260912120000_atomic_ledger_correction.sql"));
  await db.exec(sql("20260912125000_restore_legacy_approval_metadata.sql"));
  await db.exec(sql("20260912130000_preserve_ledger_corrections_on_reapproval.sql"));
  await db.exec(sql("20260912140000_protect_posted_transaction_lifecycle.sql"));
  await db.exec(`grant usage on schema public,auth to authenticated,anon;
    grant select,insert,update,delete on all tables in schema public to authenticated,anon;
    insert into auth.users values ('${id(1)}'),('${id(2)}'),('${id(3)}'),('${id(4)}');
    insert into firms(id,name,slug,owner_user_id) values ('${id(10)}','A','a','${id(1)}'),('${id(20)}','B','b','${id(2)}');
    insert into firm_users(firm_id,user_id,role,status) values
      ('${id(10)}','${id(1)}','staff','active'),('${id(20)}','${id(2)}','owner','active'),
      ('${id(10)}','${id(3)}','viewer','active'),('${id(10)}','${id(4)}','staff','disabled');
    insert into clients values ('${id(11)}','${id(10)}'),('${id(21)}','${id(20)}');
    insert into transactions(id,firm_id,client_id,status,transaction_type,total_amount)
      values ('${id(12)}','${id(10)}','${id(11)}','needs_review','sales',100),
      ('${id(13)}','${id(10)}','${id(11)}','approved','purchase',50),
      ('${id(14)}','${id(10)}','${id(11)}','needs_review','expense',75),
      ('${id(15)}','${id(10)}','${id(11)}','approved','receipt',80),
      ('${id(22)}','${id(20)}','${id(21)}','approved','sales',100);
    insert into ledger_entries(id,firm_id,client_id,transaction_id,account_name,credit_amount)
      values ('${id(32)}','${id(20)}','${id(21)}','${id(22)}','Foreign',100);`);
  await actor(1);
  await assert.rejects(db.exec(`update transactions set status='rejected' where id='${id(13)}'`),e=>e.code==='42501');
  assert.equal((await db.query(`update transactions set description='review edit' where id='${id(14)}' returning id`)).rows.length,1);
  const approved = (await db.query(`select approve_transaction_with_handoff('${id(12)}') as result`)).rows[0].result;
  assert.equal(approved.outcome,"approved","existing approval still writes through restrictive policies");
  await db.exec(`reset role; update ledger_entries set id='${id(31)}' where transaction_id='${id(12)}';`);
  await actor(1);
  assert.equal((await db.query(call())).rows[0].id,id(31));
  const snapshot = (await db.query(`select * from ledger_entries where id='${id(31)}'`)).rows[0];
  assert.equal(Number(snapshot.debit_amount),125);
  assert.equal(snapshot.transaction_id,id(12));
  const audit = (await db.query("select * from audit_logs where action='ledger_entry.corrected'")).rows[0];
  assert.equal(audit.actor_user_id,id(1));
  assert.equal(audit.before_data.credit_amount,100);
  assert.equal(audit.after_data.debit_amount,125);
  assert.equal(audit.metadata.correction_note,"Reason");
  assert.equal((await db.query(`select total_amount from transactions where id='${id(12)}'`)).rows[0].total_amount,"100");
  const reapproval = (await db.query(`select approve_transaction_with_handoff('${id(12)}') as result`)).rows[0].result;
  assert.equal(reapproval.outcome,"already_approved");
  const preserved = (await db.query(`select * from ledger_entries where id='${id(31)}'`)).rows[0];
  assert.equal(Number(preserved.debit_amount),125,"reapproval preserves a manual ledger correction");
  assert.equal(preserved.account_name,"Corrected");
  assert.equal((await db.query("select count(*)::int as n from audit_logs where action='transaction.approved'")).rows[0].n,1);
  const repaired = (await db.query(`select approve_transaction_with_handoff('${id(13)}') as result`)).rows[0].result;
  assert.equal(repaired.outcome,"repaired_handoff");
  assert.equal((await db.query(`select count(*)::int as n from ledger_entries where transaction_id='${id(13)}'`)).rows[0].n,1);
  assert.equal((await db.query("select count(*)::int as n from audit_logs where action='transaction.ledger_handoff_repaired'")).rows[0].n,1);
  assert.equal((await db.query("update ledger_entries set debit_amount=999 returning id")).rows.length,0);
  assert.equal((await db.query("delete from ledger_entries returning id")).rows.length,0);
  await assert.rejects(db.exec(`insert into ledger_entries(firm_id,client_id,transaction_id,account_name)
    values ('${id(10)}','${id(11)}','${id(12)}','Forged')`),e=>e.code==='42501');
  for (const [debit,credit] of [["-1","0"],["0","0"],["1","1"],["'NaN'","0"],["'Infinity'","0"],["null","0"],["0.001","0"]]) {
    await assert.rejects(db.exec(call(10,31,debit,credit)),e=>e.code==='22023');
  }
  await assert.rejects(db.exec(call(10,32)),e=>e.code==='42501');
  await assert.rejects(db.exec(call(20,32)),e=>e.code==='42501');
  for (const user of [2,3,4]) { await actor(user); await assert.rejects(db.exec(call()),e=>e.code==='42501'); }
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.exec(call()),e=>e.code==='42501');
  await db.exec(`reset role;
    create function reject_test_audit() returns trigger language plpgsql as $$ begin raise exception 'synthetic audit failure'; end $$;
    create trigger test_audit_failure before insert on audit_logs for each row execute function reject_test_audit();`);
  await actor(1);
  await assert.rejects(db.exec(call(10,31,"250")),/synthetic audit failure/);
  assert.deepEqual((await db.query(`select * from ledger_entries where id='${id(31)}'`)).rows[0],snapshot);
  await assert.rejects(db.exec(`select approve_transaction_with_handoff('${id(14)}')`),/synthetic audit failure/);
  assert.equal((await db.query(`select status from transactions where id='${id(14)}'`)).rows[0].status,"needs_review");
  assert.equal((await db.query(`select count(*)::int as n from ledger_entries where transaction_id='${id(14)}'`)).rows[0].n,0);
  await assert.rejects(db.exec(`select approve_transaction_with_handoff('${id(15)}')`),/synthetic audit failure/);
  assert.equal((await db.query(`select count(*)::int as n from ledger_entries where transaction_id='${id(15)}'`)).rows[0].n,0);
  await db.exec("reset role; drop trigger test_audit_failure on audit_logs;");
  await db.exec(sql("20260912135000_backfill_missing_ledger_handoffs.sql"));
  assert.equal((await db.query(`select count(*)::int as n from ledger_entries where transaction_id='${id(15)}'`)).rows[0].n,1);
  const legacyRepairAudit = (await db.query(`select * from audit_logs where action='transaction.ledger_handoff_repaired'
    and entity_id='${id(15)}'`)).rows[0];
  assert.equal(legacyRepairAudit.actor_user_id,null);
  assert.equal(legacyRepairAudit.metadata.repair_actor,"database_migration");
  assert.equal(legacyRepairAudit.metadata.historical_approval_metadata,"unavailable");
  await db.exec(`
    update transactions set client_id='${id(21)}' where id='${id(12)}';`);
  await actor(1); await assert.rejects(db.exec(call()),e=>e.code==='42501');
  console.log("OK PostgreSQL ledger correction, audit rollback, ownership/roles, direct-write denial and approval compatibility");
} finally { await db.close(); }

let role = "viewer", calls = 0, error = null;
const dependencies = {
  "next/cache": { revalidatePath() {} },
  "next/navigation": { redirect: () => { throw new Error("REDIRECT"); } },
  "@/lib/env": { hasSupabaseConfig: () => true },
  "@/lib/firms": { getFirmContext: async () => ({ firm: { id: id(10), role },
    supabase: { rpc: async (name, args) => { calls++; assert.equal(name,"correct_ledger_entry");
      assert.equal(args.target_firm_id,id(10)); assert.equal(args.target_entry_id,id(31));
      assert.equal(args.corrected_debit_amount,125); return { data: id(31), error }; } } }) },
};
const source = ts.transpileModule(readFileSync("src/app/actions/ledger.ts","utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiled = { exports: {} };
new Function("require","module","exports",source)(name => {
  assert.ok(name in dependencies,`Unexpected dependency ${name}`); return dependencies[name];
},compiled,compiled.exports);
const form = new FormData();
for (const [key,value] of Object.entries({entry_id:id(31),account_name:"Corrected",debit_amount:"125",credit_amount:"0"})) form.set(key,value);
const run = () => compiled.exports.updateLedgerEntryAction({status:"idle",message:""},form);
assert.equal((await run()).status,"error"); assert.equal(calls,0);
role="staff"; error={message:"private database detail"};
assert.ok(!(await run()).message.includes("private database"));
error=null; await assert.rejects(run(),/REDIRECT/);
form.set("credit_amount","5");
const before=calls; assert.equal((await run()).status,"error"); assert.equal(calls,before);
console.log("OK ledger action role/amount checks, scoped single RPC, private errors and redirect");
