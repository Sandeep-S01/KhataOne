import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const migration = name => readFileSync(`supabase/migrations/${name}`, "utf8")
  .replace(/create extension if not exists "pgcrypto";/g, "");
const update = (member, role, status = "active", firm = 10) =>
  `select public.update_firm_member('${id(firm)}','${id(member)}','${role}','${status}')`;
async function actor(n) {
  await db.exec(`reset role; set request.jwt.claim.sub='${id(n)}'; set role authenticated;`);
}

try {
  await db.exec(`
    create role authenticated; create role anon; create schema auth;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function public.set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at = now(); return new; end $$;
  `);
  await db.exec(migration("20260810181500_create_firms_and_memberships.sql"));
  await db.exec(`
    create table public.audit_logs(
      id uuid primary key default gen_random_uuid(),
      firm_id uuid not null references public.firms(id),
      client_id uuid, actor_user_id uuid references auth.users(id),
      action text not null, entity_type text not null, entity_id uuid,
      before_data jsonb, after_data jsonb, metadata jsonb,
      created_at timestamptz default now()
    );
    alter table public.audit_logs enable row level security;
    create policy audit_member_read on public.audit_logs for select to authenticated
      using (public.is_firm_member(firm_id));
    create policy audit_browser_insert_denied on public.audit_logs as restrictive
      for insert to authenticated, anon with check (false);
  `);
  await db.exec(migration("20260918130000_manage_firm_members.sql"));
  await db.exec(`
    grant usage on schema public, auth to authenticated, anon;
    grant select, insert, update on all tables in schema public to authenticated, anon;
    insert into auth.users(id, email) values
      ('${id(1)}','owner@example.test'), ('${id(2)}','admin@example.test'),
      ('${id(3)}','staff@example.test'), ('${id(4)}','viewer@example.test'),
      ('${id(5)}','disabled@example.test'), ('${id(6)}','other@example.test');
    insert into public.firms(id, name, slug, owner_user_id) values
      ('${id(10)}','Firm A','firm-a','${id(1)}'),
      ('${id(20)}','Firm B','firm-b','${id(6)}');
    insert into public.firm_users(id, firm_id, user_id, role, status) values
      ('${id(11)}','${id(10)}','${id(1)}','owner','active'),
      ('${id(12)}','${id(10)}','${id(2)}','admin','active'),
      ('${id(13)}','${id(10)}','${id(3)}','staff','active'),
      ('${id(14)}','${id(10)}','${id(4)}','viewer','active'),
      ('${id(15)}','${id(10)}','${id(5)}','admin','disabled'),
      ('${id(21)}','${id(20)}','${id(6)}','owner','active');
  `);

  await actor(1);
  const team = (await db.query(`select * from public.list_firm_members('${id(10)}')`)).rows;
  assert.equal(team.length, 5);
  assert.equal(team[0].email, "owner@example.test");
  assert.ok(team.every(member => member.user_id !== id(6)));
  await db.exec(update(13, "viewer"));
  assert.equal((await db.query(`select role from public.firm_users where id='${id(13)}'`)).rows[0].role, "viewer");
  assert.equal((await db.query(`select count(*)::int as n from public.audit_logs
    where action='firm.member_updated'`)).rows[0].n, 1);
  const audit = (await db.query(`select before_data, after_data from public.audit_logs
    where entity_id='${id(13)}'`)).rows[0];
  assert.deepEqual(audit.before_data, { role: "staff", status: "active" });
  assert.deepEqual(audit.after_data, { role: "viewer", status: "active" });
  await db.exec(update(13, "viewer"));
  assert.equal((await db.query("select count(*)::int as n from public.audit_logs")).rows[0].n, 1);
  assert.equal((await db.query(`update public.firm_users set role='owner'
    where id='${id(13)}' returning id`)).rows.length, 0);
  await assert.rejects(db.exec(update(11, "staff")), error => error.code === "42501");
  await assert.rejects(db.exec(update(21, "viewer")), error => error.code === "42501");
  await assert.rejects(db.exec(update(13, "owner")), error => error.code === "22023");

  await actor(2);
  assert.equal((await db.query(`select count(*)::int as n from public.list_firm_members('${id(10)}')`)).rows[0].n, 5);
  await db.exec(update(14, "staff", "disabled"));
  await assert.rejects(db.exec(update(12, "staff")), error => error.code === "42501");
  await assert.rejects(db.exec(update(11, "viewer")), error => error.code === "42501");
  await assert.rejects(db.exec(update(13, "admin")), error => error.code === "42501");
  await actor(1);
  await db.exec(update(13, "admin"));
  await actor(2);
  await assert.rejects(db.exec(update(13, "staff")), error => error.code === "42501");
  await actor(3);
  assert.equal((await db.query(`select count(*)::int as n from public.list_firm_members('${id(10)}')`)).rows[0].n, 5);

  for (const user of [4, 5, 6]) {
    await actor(user);
    await assert.rejects(db.exec(`select public.list_firm_members('${id(10)}')`),
      error => error.code === "42501");
    await assert.rejects(db.exec(update(14, "viewer")), error => error.code === "42501");
  }
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.exec(`select public.list_firm_members('${id(10)}')`),
    error => error.code === "42501");

  await db.exec(`reset role;
    create function reject_team_audit() returns trigger language plpgsql as
      $$ begin raise exception 'synthetic audit failure'; end $$;
    create trigger reject_team_audit before insert on public.audit_logs
      for each row execute function reject_team_audit();
  `);
  await actor(1);
  await assert.rejects(db.exec(update(14, "viewer", "active")), /synthetic audit failure/);
  assert.equal((await db.query(`select status from public.firm_users where id='${id(14)}'`)).rows[0].status,
    "disabled");
  console.log("OK firm member roster, role boundaries, direct-write denial, audit and rollback");
} finally {
  await db.close();
}
