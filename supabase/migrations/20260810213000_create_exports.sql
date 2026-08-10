create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values
  ('exports', 'exports', false),
  ('generated-reports', 'generated-reports', false)
on conflict (id) do update set public = excluded.public;

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  gst_period_id uuid references public.gst_periods(id) on delete set null,
  export_type text not null check (export_type in ('csv_transactions', 'pdf_summary', 'tally_ready', 'gst_summary')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  storage_path text,
  requested_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exports enable row level security;

create index if not exists exports_firm_id_idx on public.exports (firm_id);
create index if not exists exports_client_id_idx on public.exports (client_id);
create index if not exists exports_gst_period_id_idx on public.exports (gst_period_id);
create index if not exists exports_status_idx on public.exports (status);
create index if not exists exports_created_at_idx on public.exports (created_at desc);

drop policy if exists "Firm members can read exports" on public.exports;
create policy "Firm members can read exports"
on public.exports for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create exports" on public.exports;
create policy "Firm staff can create exports"
on public.exports for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm staff can update exports" on public.exports;
create policy "Firm staff can update exports"
on public.exports for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']))
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop trigger if exists exports_set_updated_at on public.exports;
create trigger exports_set_updated_at
before update on public.exports
for each row execute function public.set_updated_at();
