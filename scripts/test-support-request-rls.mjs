import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);
const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const migration = (file) => readFileSync(`supabase/migrations/${file}`, "utf8")
  .replace(/create extension if not exists "pgcrypto";/g, "");
const submit = (firm, author) => `insert into support_requests(firm_id,created_by,category,subject,description)
  values('${id(firm)}','${id(author)}','access','Cannot sign in','The workspace sign-in fails after submitting the form.')`;

async function actor(user) {
  await db.exec(`reset role; set request.jwt.claim.sub='${id(user)}'; set role authenticated;`);
}

try {
  await db.exec(`create role authenticated; create role anon; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function public.set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at=now(); return new; end $$;`);
  await db.exec(migration("20260810181500_create_firms_and_memberships.sql"));
  await db.exec(`grant usage on schema public, auth to authenticated, anon;
    grant select on firms, firm_users to authenticated;
    insert into auth.users values('${id(1)}'),('${id(2)}'),('${id(3)}');
    insert into firms(id,name,slug,owner_user_id) values
      ('${id(10)}','Firm A','firm-a','${id(1)}'),
      ('${id(20)}','Firm B','firm-b','${id(2)}');
    insert into firm_users(firm_id,user_id,role,status) values
      ('${id(10)}','${id(1)}','owner','active'),
      ('${id(10)}','${id(3)}','staff','active'),
      ('${id(20)}','${id(2)}','owner','active');`);
  await db.exec(migration("20260917120000_create_support_requests.sql"));

  await actor(1);
  await db.exec(submit(10, 1));
  assert.equal((await db.query("select count(*)::int as n from support_requests")).rows[0].n, 1);
  await db.exec("reset role;");
  await db.exec(migration("20260917120000_create_support_requests.sql"));
  await actor(1);
  assert.equal((await db.query("select count(*)::int as n from support_requests")).rows[0].n, 1);
  await assert.rejects(db.exec(submit(20, 1)), (error) => error.code === "42501");
  await assert.rejects(db.exec(submit(10, 3)), (error) => error.code === "42501");
  await assert.rejects(db.exec("update support_requests set status='resolved'"), (error) => error.code === "42501");

  await actor(3);
  assert.equal((await db.query("select count(*)::int as n from support_requests")).rows[0].n, 0);
  await db.exec(submit(10, 3));
  assert.equal((await db.query("select count(*)::int as n from support_requests")).rows[0].n, 1);

  await db.exec(`reset role; update firm_users set status='disabled' where user_id='${id(3)}';`);
  await actor(3);
  assert.equal((await db.query("select count(*)::int as n from support_requests")).rows[0].n, 0);
  await assert.rejects(db.exec(submit(10, 3)), (error) => error.code === "42501");

  await db.exec("reset role; set role anon;");
  await assert.rejects(db.exec("select * from support_requests"), (error) => error.code === "42501");
  console.log("OK support request RLS isolation and write restrictions passed");
} finally {
  await db.close();
}
