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
const save = (firm = 10, name = "Updated Firm") =>
  `select public.update_firm_profile('${id(firm)}','${name}','+919876543210',
    'firm@example.test','Updated address')`;
async function actor(n) {
  await db.exec(`reset role; set request.jwt.claim.sub='${id(n)}'; set role authenticated;`);
}

try {
  await db.exec(`
    create role authenticated; create role anon; create schema auth;
    create table auth.users(id uuid primary key);
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
  await db.exec(migration("20260918120000_update_firm_profile.sql"));
  await db.exec(`
    grant usage on schema public, auth to authenticated, anon;
    grant select, insert, update on all tables in schema public to authenticated, anon;
    insert into auth.users(id) values
      ('${id(1)}'), ('${id(2)}'), ('${id(3)}'),
      ('${id(4)}'), ('${id(5)}'), ('${id(6)}');
    insert into public.firms(id, name, slug, owner_user_id, gstin) values
      ('${id(10)}', 'Original Firm', 'original', '${id(1)}', '27ABCDE1234F1Z5'),
      ('${id(20)}', 'Other Firm', 'other', '${id(6)}', null);
    insert into public.firm_users(firm_id, user_id, role, status) values
      ('${id(10)}', '${id(1)}', 'owner', 'active'),
      ('${id(10)}', '${id(2)}', 'admin', 'active'),
      ('${id(10)}', '${id(3)}', 'staff', 'active'),
      ('${id(10)}', '${id(4)}', 'viewer', 'active'),
      ('${id(10)}', '${id(5)}', 'admin', 'disabled'),
      ('${id(20)}', '${id(6)}', 'owner', 'active');
  `);

  await actor(1);
  await db.exec(save());
  const updated = (await db.query(`select name, slug, gstin, status, owner_user_id, phone
    from public.firms where id = '${id(10)}'`)).rows[0];
  assert.equal(updated.name, "Updated Firm");
  assert.equal(updated.phone, "+919876543210");
  assert.equal(updated.slug, "original");
  assert.equal(updated.gstin, "27ABCDE1234F1Z5");
  assert.equal(updated.status, "active");
  assert.equal(updated.owner_user_id, id(1));
  const audits = (await db.query(`select actor_user_id, before_data, after_data from public.audit_logs
    where action = 'firm.profile_updated'`)).rows;
  assert.equal(audits.length, 1);
  assert.equal(audits[0].actor_user_id, id(1));
  assert.equal(audits[0].before_data.name, "Original Firm");
  assert.equal(audits[0].after_data.name, "Updated Firm");
  assert.deepEqual(Object.keys(audits[0].after_data).sort(), ["address", "email", "name", "phone"]);

  await db.exec(save());
  assert.equal((await db.query("select count(*)::int as n from public.audit_logs")).rows[0].n, 1);
  assert.equal((await db.query(`update public.firms set status = 'archived'
    where id = '${id(10)}' returning id`)).rows.length, 0);
  await assert.rejects(db.exec(save(10, "X")), error => error.code === "22023");
  await assert.rejects(db.exec(`select public.update_firm_profile('${id(10)}',
    'Valid Name', 'bad phone', null, null)`), error => error.code === "22023");
  await assert.rejects(db.exec(`select public.update_firm_profile('${id(10)}',
    'Valid Name', null, 'invalid-email', null)`), error => error.code === "22023");
  await assert.rejects(db.query(`select public.update_firm_profile($1, $2, $3, $4, $5)`,
    [id(10), "Valid Name", null, null, "x".repeat(501)]), error => error.code === "22023");
  await assert.rejects(db.exec(save(20)), error => error.code === "42501");

  await actor(2);
  await db.exec(save(10, "Admin Edited Firm"));
  await db.exec(`reset role; update public.firms set status = 'suspended' where id = '${id(10)}'`);
  await actor(1);
  await assert.rejects(db.exec(save()), error => error.code === "42501");
  await db.exec(`reset role; update public.firms set status = 'active' where id = '${id(10)}'`);
  for (const user of [3, 4, 5, 6]) {
    await actor(user);
    await assert.rejects(db.exec(save()), error => error.code === "42501");
  }
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.exec(save()), error => error.code === "42501");

  await db.exec(`reset role;
    create function reject_firm_audit() returns trigger language plpgsql as
      $$ begin raise exception 'synthetic audit failure'; end $$;
    create trigger reject_firm_audit before insert on public.audit_logs
      for each row execute function reject_firm_audit();
  `);
  await actor(1);
  await assert.rejects(db.exec(save(10, "Rolled Back")), /synthetic audit failure/);
  assert.equal((await db.query(`select name from public.firms where id = '${id(10)}'`)).rows[0].name,
    "Admin Edited Firm");
  console.log("OK firm profile owner/admin access, direct-write denial, audit and rollback");
} finally {
  await db.close();
}
