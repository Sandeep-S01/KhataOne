create extension if not exists "pgcrypto";

do $$
begin
  if exists (
    select 1
    from public.ledger_entries
    group by transaction_id
    having count(*) > 1
  ) then
    raise exception 'Cannot add ledger_entries_transaction_id_unique_idx because duplicate transaction handoffs exist. Reconcile duplicates before applying this migration.';
  end if;
end $$;

create unique index if not exists ledger_entries_transaction_id_unique_idx
on public.ledger_entries (transaction_id);

create or replace function public.approve_transaction_with_handoff(
  target_transaction_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_user_id uuid := auth.uid();
  active_role text;
  transaction_before jsonb;
  transaction_after public.transactions%rowtype;
  ledger_entry_id uuid;
  debit_value numeric(14, 2);
  credit_value numeric(14, 2);
  outcome text := 'approved';
begin
  if actor_user_id is null then
    raise exception 'Unauthorized.';
  end if;

  select *
  into transaction_after
  from public.transactions
  where id = target_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found.';
  end if;

  select firm_users.role
  into active_role
  from public.firm_users
  where firm_users.firm_id = transaction_after.firm_id
    and firm_users.user_id = actor_user_id
    and firm_users.status = 'active'
  limit 1;

  if active_role is null or active_role not in ('owner', 'admin', 'staff') then
    raise exception 'Your workspace role cannot approve transactions.';
  end if;

  if transaction_after.status in ('rejected', 'duplicate', 'exported') then
    raise exception 'Transaction status % cannot be approved.', transaction_after.status;
  end if;

  transaction_before := to_jsonb(transaction_after);

  if transaction_after.status = 'approved' then
    outcome := 'already_approved';
  else
    update public.transactions
    set
      status = 'approved',
      approved_by = actor_user_id,
      approved_at = now()
    where id = transaction_after.id
    returning * into transaction_after;
  end if;

  if transaction_after.transaction_type in ('sales', 'receipt') then
    debit_value := 0;
    credit_value := coalesce(transaction_after.total_amount, 0);
  else
    debit_value := coalesce(transaction_after.total_amount, 0);
    credit_value := 0;
  end if;

  insert into public.ledger_entries (
    firm_id,
    client_id,
    transaction_id,
    entry_date,
    account_name,
    debit_amount,
    credit_amount,
    narration
  )
  values (
    transaction_after.firm_id,
    transaction_after.client_id,
    transaction_after.id,
    transaction_after.transaction_date,
    coalesce(
      nullif(transaction_after.category, ''),
      nullif(transaction_after.party_name, ''),
      transaction_after.transaction_type || ' review account'
    ),
    debit_value,
    credit_value,
    coalesce(
      nullif(transaction_after.description, ''),
      'Approved ' || transaction_after.transaction_type || ' transaction'
    )
  )
  on conflict (transaction_id) do update
  set
    firm_id = excluded.firm_id,
    client_id = excluded.client_id,
    entry_date = excluded.entry_date,
    account_name = excluded.account_name,
    debit_amount = excluded.debit_amount,
    credit_amount = excluded.credit_amount,
    narration = excluded.narration
  returning id into ledger_entry_id;

  if outcome = 'approved' then
    insert into public.audit_logs (
      firm_id,
      client_id,
      actor_user_id,
      action,
      entity_type,
      entity_id,
      before_data,
      after_data,
      metadata
    )
    values (
      transaction_after.firm_id,
      transaction_after.client_id,
      actor_user_id,
      'transaction.approved',
      'transaction',
      transaction_after.id,
      transaction_before,
      to_jsonb(transaction_after),
      jsonb_build_object(
        'ledger_entry_id', ledger_entry_id,
        'approval_boundary', 'approve_transaction_with_handoff'
      )
    );
  end if;

  return jsonb_build_object(
    'transaction_id', transaction_after.id,
    'ledger_entry_id', ledger_entry_id,
    'status', transaction_after.status,
    'outcome', outcome
  );
end;
$$;

revoke all on function public.approve_transaction_with_handoff(uuid) from public;
grant execute on function public.approve_transaction_with_handoff(uuid) to authenticated;

comment on function public.approve_transaction_with_handoff(uuid) is
'Atomically approves one transaction, creates or updates the single ledger handoff, and records the approval audit log after revalidating active firm role membership.';
