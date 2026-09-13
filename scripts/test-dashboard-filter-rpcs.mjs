import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { PGlite } = await import(pathToFileURL(resolve(
  ".codex-tmp/db-policy-test/node_modules/@electric-sql/pglite/dist/index.js",
)).href);

const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const sql = (name) =>
  readFileSync(`supabase/migrations/${name}`, "utf8").replace(
    /create extension if not exists "pgcrypto";/g,
    "",
  );

async function actor(n) {
  await db.exec(`
    reset role;
    set request.jwt.claim.sub='${id(n)}';
    set role authenticated;
  `);
}

try {
  await db.exec(`
    create role authenticated;
    create role anon;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function set_updated_at() returns trigger language plpgsql as
      $$ begin new.updated_at=now(); return new; end $$;
  `);
  await db.exec(sql("20260810181500_create_firms_and_memberships.sql"));
  await db.exec(`
    create table clients(
      id uuid primary key,
      firm_id uuid not null references firms(id),
      business_name text,
      contact_name text,
      phone text,
      whatsapp_phone text,
      gstin text,
      state_code text,
      filing_frequency text,
      status text,
      created_at timestamptz default now()
    );
    create table documents(
      id uuid primary key,
      firm_id uuid not null references firms(id),
      client_id uuid not null references clients(id),
      document_type text,
      file_name text
    );
    create table ai_extractions(
      id uuid primary key,
      firm_id uuid not null references firms(id),
      client_id uuid not null references clients(id),
      document_id uuid not null references documents(id),
      risk_flags text[] default '{}',
      model text
    );
    create table transactions(
      id uuid primary key,
      firm_id uuid not null references firms(id),
      client_id uuid not null references clients(id),
      document_id uuid references documents(id),
      ai_extraction_id uuid references ai_extractions(id),
      transaction_type text,
      status text,
      transaction_date date,
      party_name text,
      invoice_number text,
      total_amount numeric,
      confidence_score numeric,
      created_at timestamptz default now()
    );
    create table whatsapp_messages(
      id uuid primary key,
      firm_id uuid references firms(id),
      client_id uuid references clients(id),
      sender_phone text,
      message_type text,
      processing_status text,
      received_at timestamptz default now()
    );

    alter table clients enable row level security;
    alter table documents enable row level security;
    alter table ai_extractions enable row level security;
    alter table transactions enable row level security;
    alter table whatsapp_messages enable row level security;

    create policy clients_read on clients for select to authenticated using(is_firm_member(firm_id));
    create policy documents_read on documents for select to authenticated using(is_firm_member(firm_id));
    create policy extractions_read on ai_extractions for select to authenticated using(is_firm_member(firm_id));
    create policy transactions_read on transactions for select to authenticated using(is_firm_member(firm_id));
    create policy messages_read on whatsapp_messages for select to authenticated using(is_firm_member(firm_id));
  `);
  await db.exec(sql("20260913110000_complete_dashboard_filtered_results.sql"));
  await db.exec(`
    grant usage on schema public, auth to authenticated, anon;
    grant select on all tables in schema public to authenticated, anon;
    insert into auth.users values ('${id(1)}'), ('${id(2)}');
    insert into firms(id,name,slug,owner_user_id)
      values ('${id(10)}','Firm A','firm-a','${id(1)}'), ('${id(20)}','Firm B','firm-b','${id(2)}');
    insert into firm_users(firm_id,user_id,role,status)
      values ('${id(10)}','${id(1)}','staff','active'), ('${id(20)}','${id(2)}','owner','active');
    insert into clients(id,firm_id,business_name,status)
      values ('${id(11)}','${id(10)}','Alpha Traders','active'), ('${id(21)}','${id(20)}','Foreign Client','active');

    insert into documents(id,firm_id,client_id,document_type,file_name)
    select
      ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid,
      '${id(10)}',
      '${id(11)}',
      'receipt',
      'ordinary-' || n || '.pdf'
    from generate_series(1,55) n;
    insert into ai_extractions(id,firm_id,client_id,document_id,risk_flags,model)
    select
      ('00000000-0000-0000-0002-' || lpad(n::text, 12, '0'))::uuid,
      '${id(10)}',
      '${id(11)}',
      ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid,
      '{}',
      'rule_based_text_v1'
    from generate_series(1,55) n;
    insert into transactions(
      id, firm_id, client_id, document_id, ai_extraction_id, transaction_type, status,
      transaction_date, party_name, invoice_number, total_amount, confidence_score, created_at
    )
    select
      ('00000000-0000-0000-0003-' || lpad(n::text, 12, '0'))::uuid,
      '${id(10)}',
      '${id(11)}',
      ('00000000-0000-0000-0001-' || lpad(n::text, 12, '0'))::uuid,
      ('00000000-0000-0000-0002-' || lpad(n::text, 12, '0'))::uuid,
      'purchase',
      'needs_review',
      '2026-09-10',
      case when n = 55 then 'Later Page Needle Vendor' else 'Ordinary Vendor' end,
      'INV-' || n,
      n,
      case when n = 54 then 0.2 else 0.9 end,
      timestamp '2026-09-13 12:00:00' - (n || ' minutes')::interval
    from generate_series(1,55) n;
    update documents set document_type='sales_invoice', file_name='needle-source.pdf'
      where id='00000000-0000-0000-0001-000000000055';
    update ai_extractions set risk_flags=array['DUPLICATE_RISK']
      where id='00000000-0000-0000-0002-000000000055';

    insert into whatsapp_messages(id,firm_id,client_id,sender_phone,message_type,processing_status,received_at)
    select
      ('00000000-0000-0000-0004-' || lpad(n::text, 12, '0'))::uuid,
      '${id(10)}',
      case when n = 55 then null else '${id(11)}'::uuid end,
      case when n = 55 then '+919999555000' else '+910000000000' end,
      case when n = 55 then 'image' else 'text' end,
      case when n = 55 then 'unmatched' else 'matched' end,
      timestamp '2026-09-13 12:00:00' - (n || ' minutes')::interval
    from generate_series(1,55) n;
  `);

  await actor(1);
  let rows = (await db.query(`
    select * from search_review_queue('${id(10)}', null, null, null, null, null, null, 'needle', 51, 0)
  `)).rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].party_name, "Later Page Needle Vendor");

  rows = (await db.query(`
    select * from search_review_queue('${id(10)}', null, null, 'risk', 'sales_invoice', null, null, null, 51, 0)
  `)).rows;
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].risk_flags, ["DUPLICATE_RISK"]);

  rows = (await db.query(`
    select * from search_review_queue('${id(10)}', null, null, 'low_confidence', null, null, null, null, 51, 0)
  `)).rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].confidence_score, "0.2");

  rows = (await db.query(`
    select * from search_whatsapp_inbox('${id(10)}', null, '+919999555000', 51, 0)
  `)).rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].client_business_name, null);
  assert.equal(rows[0].processing_status, "unmatched");

  rows = (await db.query(`
    select * from search_whatsapp_inbox('${id(10)}', 'unmatched', 'image', 51, 0)
  `)).rows;
  assert.equal(rows.length, 1);

  await actor(2);
  rows = (await db.query(`
    select * from search_review_queue('${id(10)}', null, null, null, null, null, null, 'needle', 51, 0)
  `)).rows;
  assert.equal(rows.length, 0);
} finally {
  await db.close();
}

console.log("OK dashboard filter RPCs apply search/status/document/risk before pagination with tenant isolation");
