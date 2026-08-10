create extension if not exists "pgcrypto";

create table if not exists public.gst_periods (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  filing_type text not null default 'monthly' check (filing_type in ('monthly', 'quarterly', 'annual')),
  status text not null default 'open' check (status in ('open', 'missing_documents', 'needs_review', 'ready', 'exported', 'filed_future')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, client_id, period_start, period_end, filing_type)
);

create table if not exists public.gst_summaries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  gst_period_id uuid not null references public.gst_periods(id) on delete cascade,
  sales_taxable_amount numeric(14, 2) not null default 0,
  purchase_taxable_amount numeric(14, 2) not null default 0,
  output_cgst numeric(14, 2) not null default 0,
  output_sgst numeric(14, 2) not null default 0,
  output_igst numeric(14, 2) not null default 0,
  input_cgst numeric(14, 2) not null default 0,
  input_sgst numeric(14, 2) not null default 0,
  input_igst numeric(14, 2) not null default 0,
  net_tax_payable numeric(14, 2) not null default 0,
  mismatch_count integer not null default 0,
  missing_document_count integer not null default 0,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (gst_period_id)
);

alter table public.gst_periods enable row level security;
alter table public.gst_summaries enable row level security;

create index if not exists gst_periods_firm_id_idx on public.gst_periods (firm_id);
create index if not exists gst_periods_client_id_idx on public.gst_periods (client_id);
create index if not exists gst_periods_status_idx on public.gst_periods (status);
create index if not exists gst_periods_range_idx on public.gst_periods (period_start, period_end);

create index if not exists gst_summaries_firm_id_idx on public.gst_summaries (firm_id);
create index if not exists gst_summaries_client_id_idx on public.gst_summaries (client_id);
create index if not exists gst_summaries_gst_period_id_idx on public.gst_summaries (gst_period_id);
create index if not exists gst_summaries_generated_at_idx on public.gst_summaries (generated_at desc);

drop policy if exists "Firm members can read GST periods" on public.gst_periods;
create policy "Firm members can read GST periods"
on public.gst_periods for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create GST periods" on public.gst_periods;
create policy "Firm staff can create GST periods"
on public.gst_periods for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm staff can update GST periods" on public.gst_periods;
create policy "Firm staff can update GST periods"
on public.gst_periods for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']))
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm members can read GST summaries" on public.gst_summaries;
create policy "Firm members can read GST summaries"
on public.gst_summaries for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create GST summaries" on public.gst_summaries;
create policy "Firm staff can create GST summaries"
on public.gst_summaries for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm staff can update GST summaries" on public.gst_summaries;
create policy "Firm staff can update GST summaries"
on public.gst_summaries for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']))
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop trigger if exists gst_periods_set_updated_at on public.gst_periods;
create trigger gst_periods_set_updated_at
before update on public.gst_periods
for each row execute function public.set_updated_at();
