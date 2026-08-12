do $$
begin
  alter table public.transactions
  drop constraint if exists transactions_status_check;

  alter table public.transactions
  add constraint transactions_status_check
  check (status in (
    'draft',
    'needs_review',
    'approved',
    'rejected',
    'duplicate',
    'exported'
  ));

  alter table public.transactions
  drop constraint if exists transactions_transaction_type_check;

  alter table public.transactions
  add constraint transactions_transaction_type_check
  check (transaction_type in (
    'purchase',
    'sales',
    'expense',
    'payment',
    'receipt',
    'unclear'
  ));
end $$;

comment on constraint transactions_status_check on public.transactions is
'KhataOne transaction lifecycle states for draft AI extraction, CA review, approval, rejection, duplicate marking, and export.';

comment on constraint transactions_transaction_type_check on public.transactions is
'KhataOne transaction type values used by extraction, review, ledger, GST, and export workflows.';
