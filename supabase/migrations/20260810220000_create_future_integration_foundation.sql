create extension if not exists "pgcrypto";

create table if not exists public.gst_integrations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  provider text not null,
  status text not null default 'planned' check (status in ('planned', 'sandbox', 'active', 'paused', 'disabled')),
  credentials_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, provider)
);

create table if not exists public.gst_integration_logs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  gst_period_id uuid references public.gst_periods(id) on delete set null,
  provider text not null,
  operation text not null,
  request_reference text,
  response_summary jsonb,
  status text not null default 'planned' check (status in ('planned', 'sandbox', 'success', 'failed', 'blocked')),
  created_at timestamptz not null default now()
);

create table if not exists public.external_integrations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  integration_type text not null check (integration_type in ('tally', 'zoho_books', 'quickbooks', 'banking', 'billing', 'analytics')),
  provider text not null,
  status text not null default 'planned' check (status in ('planned', 'sandbox', 'active', 'paused', 'disabled')),
  credentials_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, integration_type, provider)
);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  integration_id uuid references public.external_integrations(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  status text not null default 'queued' check (status in ('queued', 'processing', 'success', 'failed', 'blocked')),
  request_reference text,
  response_summary jsonb,
  created_at timestamptz not null default now()
);

alter table public.gst_integrations enable row level security;
alter table public.gst_integration_logs enable row level security;
alter table public.external_integrations enable row level security;
alter table public.integration_events enable row level security;

create index if not exists gst_integrations_firm_id_idx on public.gst_integrations (firm_id);
create index if not exists gst_integrations_status_idx on public.gst_integrations (status);
create index if not exists gst_integration_logs_firm_id_idx on public.gst_integration_logs (firm_id);
create index if not exists gst_integration_logs_client_id_idx on public.gst_integration_logs (client_id);
create index if not exists gst_integration_logs_period_id_idx on public.gst_integration_logs (gst_period_id);
create index if not exists gst_integration_logs_created_at_idx on public.gst_integration_logs (created_at desc);
create index if not exists external_integrations_firm_id_idx on public.external_integrations (firm_id);
create index if not exists external_integrations_type_idx on public.external_integrations (integration_type);
create index if not exists integration_events_firm_id_idx on public.integration_events (firm_id);
create index if not exists integration_events_client_id_idx on public.integration_events (client_id);
create index if not exists integration_events_status_idx on public.integration_events (status);
create index if not exists integration_events_created_at_idx on public.integration_events (created_at desc);

drop policy if exists "Firm members can read GST integrations" on public.gst_integrations;
create policy "Firm members can read GST integrations"
on public.gst_integrations for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm admins can manage GST integrations" on public.gst_integrations;
create policy "Firm admins can manage GST integrations"
on public.gst_integrations for all
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin']))
with check (public.has_firm_role(firm_id, array['owner', 'admin']));

drop policy if exists "Firm members can read GST integration logs" on public.gst_integration_logs;
create policy "Firm members can read GST integration logs"
on public.gst_integration_logs for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create GST integration logs" on public.gst_integration_logs;
create policy "Firm staff can create GST integration logs"
on public.gst_integration_logs for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm members can read external integrations" on public.external_integrations;
create policy "Firm members can read external integrations"
on public.external_integrations for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm admins can manage external integrations" on public.external_integrations;
create policy "Firm admins can manage external integrations"
on public.external_integrations for all
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin']))
with check (public.has_firm_role(firm_id, array['owner', 'admin']));

drop policy if exists "Firm members can read integration events" on public.integration_events;
create policy "Firm members can read integration events"
on public.integration_events for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create integration events" on public.integration_events;
create policy "Firm staff can create integration events"
on public.integration_events for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop trigger if exists gst_integrations_set_updated_at on public.gst_integrations;
create trigger gst_integrations_set_updated_at
before update on public.gst_integrations
for each row execute function public.set_updated_at();

drop trigger if exists external_integrations_set_updated_at on public.external_integrations;
create trigger external_integrations_set_updated_at
before update on public.external_integrations
for each row execute function public.set_updated_at();
