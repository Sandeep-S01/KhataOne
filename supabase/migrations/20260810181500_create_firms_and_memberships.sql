create extension if not exists "pgcrypto";

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  gstin text,
  phone text,
  email text,
  address text,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.firm_users (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'staff', 'viewer')),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, user_id)
);

alter table public.firms enable row level security;
alter table public.firm_users enable row level security;

create index if not exists firms_owner_user_id_idx on public.firms (owner_user_id);
create index if not exists firms_status_idx on public.firms (status);
create index if not exists firm_users_firm_id_idx on public.firm_users (firm_id);
create index if not exists firm_users_user_id_idx on public.firm_users (user_id);
create index if not exists firm_users_status_idx on public.firm_users (status);

create or replace function public.is_firm_member(target_firm_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.firm_users
    where firm_id = target_firm_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.has_firm_role(target_firm_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.firm_users
    where firm_id = target_firm_id
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

drop policy if exists "Firm members can read firms" on public.firms;
create policy "Firm members can read firms"
on public.firms for select
to authenticated
using (public.is_firm_member(id));

drop policy if exists "Authenticated users can create owned firms" on public.firms;
create policy "Authenticated users can create owned firms"
on public.firms for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "Firm owners and admins can update firms" on public.firms;
create policy "Firm owners and admins can update firms"
on public.firms for update
to authenticated
using (public.has_firm_role(id, array['owner', 'admin']))
with check (public.has_firm_role(id, array['owner', 'admin']));

drop policy if exists "Firm members can read memberships" on public.firm_users;
create policy "Firm members can read memberships"
on public.firm_users for select
to authenticated
using (public.is_firm_member(firm_id) or user_id = auth.uid());

drop policy if exists "Users can attach themselves as owner during firm setup" on public.firm_users;
create policy "Users can attach themselves as owner during firm setup"
on public.firm_users for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1 from public.firms
    where firms.id = firm_users.firm_id
      and firms.owner_user_id = auth.uid()
  )
);

drop policy if exists "Firm owners and admins can manage memberships" on public.firm_users;
create policy "Firm owners and admins can manage memberships"
on public.firm_users for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin']))
with check (public.has_firm_role(firm_id, array['owner', 'admin']));

drop trigger if exists firms_set_updated_at on public.firms;
create trigger firms_set_updated_at
before update on public.firms
for each row execute function public.set_updated_at();

drop trigger if exists firm_users_set_updated_at on public.firm_users;
create trigger firm_users_set_updated_at
before update on public.firm_users
for each row execute function public.set_updated_at();
