create extension if not exists "pgcrypto";

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  entry_date date,
  account_name text not null,
  debit_amount numeric(14, 2) not null default 0,
  credit_amount numeric(14, 2) not null default 0,
  narration text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ledger_entries enable row level security;

create index if not exists ledger_entries_firm_id_idx on public.ledger_entries (firm_id);
create index if not exists ledger_entries_client_id_idx on public.ledger_entries (client_id);
create index if not exists ledger_entries_transaction_id_idx on public.ledger_entries (transaction_id);
create index if not exists ledger_entries_entry_date_idx on public.ledger_entries (entry_date);

drop policy if exists "Firm members can read ledger entries" on public.ledger_entries;
create policy "Firm members can read ledger entries"
on public.ledger_entries for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can create ledger entries" on public.ledger_entries;
create policy "Firm staff can create ledger entries"
on public.ledger_entries for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm staff can update ledger entries" on public.ledger_entries;
create policy "Firm staff can update ledger entries"
on public.ledger_entries for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']))
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop trigger if exists ledger_entries_set_updated_at on public.ledger_entries;
create trigger ledger_entries_set_updated_at
before update on public.ledger_entries
for each row execute function public.set_updated_at();
