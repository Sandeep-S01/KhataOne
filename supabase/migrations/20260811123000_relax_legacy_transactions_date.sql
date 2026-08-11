do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'date'
  ) then
    update public.transactions
    set transaction_date = coalesce(transaction_date, "date")
    where transaction_date is null
      and "date" is not null;

    update public.transactions
    set "date" = coalesce("date", transaction_date)
    where "date" is null
      and transaction_date is not null;

    alter table public.transactions
    alter column "date" drop not null;
  end if;
end $$;

comment on column public.transactions.transaction_date is
'Canonical KhataOne transaction date. Nullable until CA review confirms incomplete or rule-based extractions.';
