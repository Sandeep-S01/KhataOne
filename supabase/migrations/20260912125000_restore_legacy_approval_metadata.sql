-- Some legacy transaction tables predate approval metadata even when later
-- approval functions exist. Restore the expected nullable columns idempotently.
alter table public.transactions
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

alter table public.transactions
  add column if not exists approved_at timestamptz;
