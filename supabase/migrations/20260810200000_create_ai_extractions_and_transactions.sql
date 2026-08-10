create extension if not exists "pgcrypto";

create table if not exists public.ai_extractions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  model text not null,
  prompt_version text not null,
  schema_version text not null,
  raw_output jsonb,
  normalized_output jsonb,
  confidence_score numeric(5, 4) not null default 0,
  risk_flags text[] not null default '{}',
  status text not null default 'needs_review' check (status in ('extracted', 'needs_review', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.ai_extractions add column if not exists firm_id uuid references public.firms(id) on delete cascade;
alter table public.ai_extractions add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.ai_extractions add column if not exists document_id uuid references public.documents(id) on delete cascade;
alter table public.ai_extractions add column if not exists model text;
alter table public.ai_extractions add column if not exists prompt_version text;
alter table public.ai_extractions add column if not exists schema_version text;
alter table public.ai_extractions add column if not exists raw_output jsonb;
alter table public.ai_extractions add column if not exists normalized_output jsonb;
alter table public.ai_extractions add column if not exists confidence_score numeric(5, 4) not null default 0;
alter table public.ai_extractions add column if not exists risk_flags text[] not null default '{}';
alter table public.ai_extractions add column if not exists status text not null default 'needs_review';
alter table public.ai_extractions add column if not exists created_at timestamptz not null default now();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  ai_extraction_id uuid references public.ai_extractions(id) on delete set null,
  transaction_type text not null default 'unclear' check (transaction_type in ('purchase', 'sales', 'expense', 'payment', 'receipt', 'unclear')),
  status text not null default 'needs_review' check (status in ('draft', 'needs_review', 'approved', 'rejected', 'duplicate', 'exported')),
  transaction_date date,
  party_name text,
  party_gstin text,
  invoice_number text,
  description text,
  category text,
  place_of_supply text,
  taxable_amount numeric(14, 2),
  cgst_amount numeric(14, 2),
  sgst_amount numeric(14, 2),
  igst_amount numeric(14, 2),
  cess_amount numeric(14, 2),
  total_amount numeric(14, 2),
  payment_mode text,
  confidence_score numeric(5, 4) not null default 0,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions add column if not exists firm_id uuid references public.firms(id) on delete cascade;
alter table public.transactions add column if not exists client_id uuid references public.clients(id) on delete cascade;
alter table public.transactions add column if not exists document_id uuid references public.documents(id) on delete set null;
alter table public.transactions add column if not exists ai_extraction_id uuid references public.ai_extractions(id) on delete set null;
alter table public.transactions add column if not exists transaction_type text not null default 'unclear';
alter table public.transactions add column if not exists status text not null default 'needs_review';
alter table public.transactions add column if not exists transaction_date date;
alter table public.transactions add column if not exists party_name text;
alter table public.transactions add column if not exists party_gstin text;
alter table public.transactions add column if not exists invoice_number text;
alter table public.transactions add column if not exists description text;
alter table public.transactions add column if not exists category text;
alter table public.transactions add column if not exists place_of_supply text;
alter table public.transactions add column if not exists taxable_amount numeric(14, 2);
alter table public.transactions add column if not exists cgst_amount numeric(14, 2);
alter table public.transactions add column if not exists sgst_amount numeric(14, 2);
alter table public.transactions add column if not exists igst_amount numeric(14, 2);
alter table public.transactions add column if not exists cess_amount numeric(14, 2);
alter table public.transactions add column if not exists total_amount numeric(14, 2);
alter table public.transactions add column if not exists payment_mode text;
alter table public.transactions add column if not exists confidence_score numeric(5, 4) not null default 0;
alter table public.transactions add column if not exists approved_by uuid references auth.users(id) on delete set null;
alter table public.transactions add column if not exists approved_at timestamptz;
alter table public.transactions add column if not exists created_at timestamptz not null default now();
alter table public.transactions add column if not exists updated_at timestamptz not null default now();

do $$
declare
  legacy_user_id uuid;
  legacy_firm_id uuid;
  legacy_client_id uuid;
  legacy_document_id uuid;
begin
  if exists (
    select 1
    from public.transactions
    where firm_id is null or client_id is null
  ) or exists (
    select 1
    from public.ai_extractions
    where firm_id is null
      or client_id is null
      or document_id is null
      or model is null
      or prompt_version is null
      or schema_version is null
  ) then
    select id into legacy_user_id
    from auth.users
    order by created_at asc
    limit 1;

    if legacy_user_id is null then
      raise exception 'Legacy transaction/extraction rows need a firm owner, but no auth.users row exists. Create your first Supabase Auth user, then rerun this migration.';
    end if;

    select id into legacy_firm_id
    from public.firms
    where slug = 'legacy-import-firm'
    limit 1;

    if legacy_firm_id is null then
      insert into public.firms (
        name,
        slug,
        owner_user_id,
        status
      )
      values (
        'Legacy Import Firm',
        'legacy-import-firm',
        legacy_user_id,
        'active'
      )
      returning id into legacy_firm_id;
    end if;

    insert into public.firm_users (
      firm_id,
      user_id,
      role,
      status
    )
    values (
      legacy_firm_id,
      legacy_user_id,
      'owner',
      'active'
    )
    on conflict (firm_id, user_id) do nothing;

    select id into legacy_client_id
    from public.clients
    where firm_id = legacy_firm_id
      and business_name = 'Legacy Import Client'
    limit 1;

    if legacy_client_id is null then
      insert into public.clients (
        firm_id,
        business_name,
        status,
        filing_frequency
      )
      values (
        legacy_firm_id,
        'Legacy Import Client',
        'active',
        'monthly'
      )
      returning id into legacy_client_id;
    end if;

    select id into legacy_document_id
    from public.documents
    where firm_id = legacy_firm_id
      and client_id = legacy_client_id
      and file_name = 'legacy-import-placeholder.txt'
    limit 1;

    if legacy_document_id is null then
      insert into public.documents (
        firm_id,
        client_id,
        document_type,
        file_name,
        file_mime_type,
        source_text,
        status,
        received_at
      )
      values (
        legacy_firm_id,
        legacy_client_id,
        'unclear',
        'legacy-import-placeholder.txt',
        'text/plain',
        'Placeholder document created during migration for legacy rows that predated KhataOne tenant fields.',
        'needs_review',
        now()
      )
      returning id into legacy_document_id;
    end if;

    update public.transactions
    set
      firm_id = legacy_firm_id,
      client_id = legacy_client_id
    where firm_id is null or client_id is null;

    update public.ai_extractions
    set
      firm_id = coalesce(firm_id, legacy_firm_id),
      client_id = coalesce(client_id, legacy_client_id),
      document_id = coalesce(document_id, legacy_document_id),
      model = coalesce(model, 'legacy-import'),
      prompt_version = coalesce(prompt_version, 'legacy-import'),
      schema_version = coalesce(schema_version, 'legacy-import')
    where firm_id is null
      or client_id is null
      or document_id is null
      or model is null
      or prompt_version is null
      or schema_version is null;
  end if;

  if exists (select 1 from public.ai_extractions where firm_id is null or client_id is null or document_id is null) then
    raise exception 'ai_extractions still has null firm/client/document rows after legacy backfill.';
  end if;

  if exists (select 1 from public.ai_extractions where model is null or prompt_version is null or schema_version is null) then
    raise exception 'ai_extractions still has null model/prompt/schema rows after legacy backfill.';
  end if;

  if exists (select 1 from public.transactions where firm_id is null or client_id is null) then
    raise exception 'transactions still has null firm/client rows after legacy backfill.';
  end if;
end $$;

alter table public.ai_extractions alter column firm_id set not null;
alter table public.ai_extractions alter column client_id set not null;
alter table public.ai_extractions alter column document_id set not null;
alter table public.ai_extractions alter column model set not null;
alter table public.ai_extractions alter column prompt_version set not null;
alter table public.ai_extractions alter column schema_version set not null;
alter table public.ai_extractions alter column confidence_score set default 0;
alter table public.ai_extractions alter column confidence_score set not null;
alter table public.ai_extractions alter column risk_flags set default '{}';
alter table public.ai_extractions alter column risk_flags set not null;
alter table public.ai_extractions alter column status set default 'needs_review';
alter table public.ai_extractions alter column status set not null;
alter table public.ai_extractions alter column created_at set default now();
alter table public.ai_extractions alter column created_at set not null;

alter table public.transactions alter column firm_id set not null;
alter table public.transactions alter column client_id set not null;
alter table public.transactions alter column transaction_type set default 'unclear';
alter table public.transactions alter column transaction_type set not null;
alter table public.transactions alter column status set default 'needs_review';
alter table public.transactions alter column status set not null;
alter table public.transactions alter column confidence_score set default 0;
alter table public.transactions alter column confidence_score set not null;
alter table public.transactions alter column created_at set default now();
alter table public.transactions alter column created_at set not null;
alter table public.transactions alter column updated_at set default now();
alter table public.transactions alter column updated_at set not null;

alter table public.ai_extractions enable row level security;
alter table public.transactions enable row level security;

create index if not exists ai_extractions_firm_id_idx on public.ai_extractions (firm_id);
create index if not exists ai_extractions_client_id_idx on public.ai_extractions (client_id);
create index if not exists ai_extractions_document_id_idx on public.ai_extractions (document_id);
create index if not exists ai_extractions_status_idx on public.ai_extractions (status);
create index if not exists ai_extractions_created_at_idx on public.ai_extractions (created_at desc);

create index if not exists transactions_firm_id_idx on public.transactions (firm_id);
create index if not exists transactions_client_id_idx on public.transactions (client_id);
create index if not exists transactions_document_id_idx on public.transactions (document_id);
create index if not exists transactions_ai_extraction_id_idx on public.transactions (ai_extraction_id);
create index if not exists transactions_status_idx on public.transactions (status);
create index if not exists transactions_transaction_date_idx on public.transactions (transaction_date);
create index if not exists transactions_invoice_number_idx on public.transactions (invoice_number);

drop policy if exists "Firm members can read AI extractions" on public.ai_extractions;
create policy "Firm members can read AI extractions"
on public.ai_extractions for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can update AI extractions" on public.ai_extractions;
create policy "Firm staff can update AI extractions"
on public.ai_extractions for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']))
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm members can read transactions" on public.transactions;
create policy "Firm members can read transactions"
on public.transactions for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create transactions" on public.transactions;
create policy "Firm staff can create transactions"
on public.transactions for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm staff can update transactions" on public.transactions;
create policy "Firm staff can update transactions"
on public.transactions for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']))
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();
