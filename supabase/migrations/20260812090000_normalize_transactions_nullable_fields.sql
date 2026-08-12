do $$
declare
  nullable_column text;
  constrained_column record;
begin
  foreach nullable_column in array array[
    'document_id',
    'ai_extraction_id',
    'transaction_date',
    'party_name',
    'party_gstin',
    'invoice_number',
    'description',
    'category',
    'place_of_supply',
    'taxable_amount',
    'cgst_amount',
    'sgst_amount',
    'igst_amount',
    'cess_amount',
    'total_amount',
    'payment_mode',
    'approved_by',
    'approved_at'
  ] loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'transactions'
        and column_name = nullable_column
    ) then
      execute format(
        'alter table public.transactions alter column %I drop not null',
        nullable_column
      );
    end if;
  end loop;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'date'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'transaction_date'
  ) then
    update public.transactions
    set transaction_date = coalesce(transaction_date, "date")
    where transaction_date is null
      and "date" is not null;

    update public.transactions
    set "date" = coalesce("date", transaction_date)
    where "date" is null
      and transaction_date is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'amount'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'total_amount'
  ) then
    update public.transactions
    set total_amount = coalesce(total_amount, amount)
    where total_amount is null
      and amount is not null;

    update public.transactions
    set amount = coalesce(amount, total_amount, 0)
    where amount is null;

    alter table public.transactions
    alter column amount set default 0;
  end if;

  for constrained_column in
    select a.attname
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'transactions'
      and a.attnum > 0
      and not a.attisdropped
      and a.attnotnull
      and a.attname <> all(array[
        'id',
        'firm_id',
        'client_id',
        'transaction_type',
        'status',
        'confidence_score',
        'created_at',
        'updated_at'
      ])
  loop
    execute format(
      'alter table public.transactions alter column %I drop not null',
      constrained_column.attname
    );
  end loop;
end $$;

comment on table public.transactions is
'KhataOne canonical transaction table. AI-created rows are draft/needs-review and may have null accounting fields until CA review.';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'transaction_date'
  ) then
    comment on column public.transactions.transaction_date is
      'Canonical KhataOne transaction date. Nullable until CA review confirms incomplete or rule-based extractions.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'category'
  ) then
    comment on column public.transactions.category is
      'Optional CA-reviewed ledger category. Rule-based extraction may leave this null.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'total_amount'
  ) then
    comment on column public.transactions.total_amount is
      'Canonical KhataOne total amount. Legacy amount, when present, is compatibility-only.';
  end if;
end $$;
