create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  business_name text not null,
  contact_name text,
  phone text,
  whatsapp_phone text,
  email text,
  gstin text,
  state_code text,
  filing_frequency text not null default 'monthly' check (filing_frequency in ('monthly', 'quarterly', 'annual', 'unknown')),
  assigned_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'onboarding' check (status in ('onboarding', 'active', 'pending_documents', 'review_needed', 'filing_ready', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients add column if not exists firm_id uuid references public.firms(id) on delete cascade;
alter table public.clients add column if not exists business_name text;
alter table public.clients add column if not exists contact_name text;
alter table public.clients add column if not exists phone text;
alter table public.clients add column if not exists whatsapp_phone text;
alter table public.clients add column if not exists email text;
alter table public.clients add column if not exists gstin text;
alter table public.clients add column if not exists state_code text;
alter table public.clients add column if not exists filing_frequency text not null default 'monthly';
alter table public.clients add column if not exists assigned_user_id uuid references auth.users(id) on delete set null;
alter table public.clients add column if not exists status text not null default 'onboarding';
alter table public.clients add column if not exists created_at timestamptz not null default now();
alter table public.clients add column if not exists updated_at timestamptz not null default now();

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs add column if not exists firm_id uuid references public.firms(id) on delete cascade;
alter table public.audit_logs add column if not exists client_id uuid references public.clients(id) on delete set null;
alter table public.audit_logs add column if not exists actor_user_id uuid references auth.users(id) on delete set null;
alter table public.audit_logs add column if not exists action text;
alter table public.audit_logs add column if not exists entity_type text;
alter table public.audit_logs add column if not exists entity_id uuid;
alter table public.audit_logs add column if not exists before_data jsonb;
alter table public.audit_logs add column if not exists after_data jsonb;
alter table public.audit_logs add column if not exists metadata jsonb;
alter table public.audit_logs add column if not exists created_at timestamptz not null default now();

do $$
declare
  legacy_user_id uuid;
  legacy_firm_id uuid;
begin
  if exists (
    select 1
    from public.clients
    where firm_id is null or business_name is null
  ) or exists (
    select 1
    from public.audit_logs
    where firm_id is null or action is null or entity_type is null
  ) then
    select id into legacy_user_id
    from auth.users
    order by created_at asc
    limit 1;

    if legacy_user_id is null then
      raise exception 'Legacy client/audit rows need a firm owner, but no auth.users row exists. Create your first Supabase Auth user, then rerun this migration.';
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

    update public.clients
    set
      firm_id = coalesce(firm_id, legacy_firm_id),
      business_name = coalesce(business_name, 'Legacy Import Client'),
      filing_frequency = coalesce(filing_frequency, 'monthly'),
      status = coalesce(status, 'active')
    where firm_id is null
      or business_name is null
      or filing_frequency is null
      or status is null;

    update public.audit_logs
    set
      firm_id = coalesce(firm_id, legacy_firm_id),
      action = coalesce(action, 'legacy.audit_imported'),
      entity_type = coalesce(entity_type, 'legacy')
    where firm_id is null
      or action is null
      or entity_type is null;
  end if;

  if exists (select 1 from public.clients where firm_id is null) then
    raise exception 'clients.firm_id still has null rows after legacy backfill.';
  end if;

  if exists (select 1 from public.clients where business_name is null) then
    raise exception 'clients.business_name still has null rows after legacy backfill.';
  end if;

  if exists (select 1 from public.audit_logs where firm_id is null) then
    raise exception 'audit_logs.firm_id still has null rows after legacy backfill.';
  end if;

  if exists (select 1 from public.audit_logs where action is null or entity_type is null) then
    raise exception 'audit_logs.action/entity_type still has null rows after legacy backfill.';
  end if;
end $$;

alter table public.clients alter column firm_id set not null;
alter table public.clients alter column business_name set not null;
alter table public.clients alter column filing_frequency set default 'monthly';
alter table public.clients alter column filing_frequency set not null;
alter table public.clients alter column status set default 'onboarding';
alter table public.clients alter column status set not null;
alter table public.clients alter column created_at set default now();
alter table public.clients alter column created_at set not null;
alter table public.clients alter column updated_at set default now();
alter table public.clients alter column updated_at set not null;

alter table public.audit_logs alter column firm_id set not null;
alter table public.audit_logs alter column action set not null;
alter table public.audit_logs alter column entity_type set not null;
alter table public.audit_logs alter column created_at set default now();
alter table public.audit_logs alter column created_at set not null;

alter table public.clients enable row level security;
alter table public.audit_logs enable row level security;

create index if not exists clients_firm_id_idx on public.clients (firm_id);
create index if not exists clients_assigned_user_id_idx on public.clients (assigned_user_id);
create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_gstin_idx on public.clients (gstin);
create index if not exists clients_whatsapp_phone_idx on public.clients (whatsapp_phone);
create unique index if not exists clients_firm_whatsapp_phone_unique_idx
  on public.clients (firm_id, whatsapp_phone)
  where whatsapp_phone is not null and whatsapp_phone <> '';

create index if not exists audit_logs_firm_id_idx on public.audit_logs (firm_id);
create index if not exists audit_logs_client_id_idx on public.audit_logs (client_id);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

drop policy if exists "Firm members can read clients" on public.clients;
create policy "Firm members can read clients"
on public.clients for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create clients" on public.clients;
create policy "Firm staff can create clients"
on public.clients for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm staff can update clients" on public.clients;
create policy "Firm staff can update clients"
on public.clients for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']))
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm members can read audit logs" on public.audit_logs;
create policy "Firm members can read audit logs"
on public.audit_logs for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create audit logs" on public.audit_logs;
create policy "Firm staff can create audit logs"
on public.audit_logs for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();
