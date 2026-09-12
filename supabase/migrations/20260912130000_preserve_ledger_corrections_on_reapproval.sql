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
begin
  if actor_user_id is null then
    raise exception 'Unauthorized.' using errcode = '42501';
  end if;

  select * into transaction_after
  from public.transactions
  where id = target_transaction_id
  for update;

  if not found then
    raise exception 'Transaction not found.';
  end if;

  select firm_users.role into active_role
  from public.firm_users
  where firm_users.firm_id = transaction_after.firm_id
    and firm_users.user_id = actor_user_id
    and firm_users.status = 'active'
  limit 1;

  if active_role is null or active_role not in ('owner', 'admin', 'staff') then
    raise exception 'Your workspace role cannot approve transactions.' using errcode = '42501';
  end if;

  if transaction_after.status in ('rejected', 'duplicate', 'exported') then
    raise exception 'Transaction status % cannot be approved.', transaction_after.status;
  end if;

  transaction_before := to_jsonb(transaction_after);
  if transaction_after.transaction_type in ('sales', 'receipt') then
    debit_value := 0;
    credit_value := coalesce(transaction_after.total_amount, 0);
  else
    debit_value := coalesce(transaction_after.total_amount, 0);
    credit_value := 0;
  end if;

  if transaction_after.status = 'approved' then
    select id into ledger_entry_id
    from public.ledger_entries
    where transaction_id = transaction_after.id;

    if found then
      return jsonb_build_object(
        'transaction_id', transaction_after.id,
        'ledger_entry_id', ledger_entry_id,
        'status', transaction_after.status,
        'outcome', 'already_approved'
      );
    end if;

    insert into public.ledger_entries (
      firm_id, client_id, transaction_id, entry_date, account_name,
      debit_amount, credit_amount, narration
    ) values (
      transaction_after.firm_id, transaction_after.client_id, transaction_after.id,
      transaction_after.transaction_date,
      coalesce(nullif(transaction_after.category, ''), nullif(transaction_after.party_name, ''),
        transaction_after.transaction_type || ' review account'),
      debit_value, credit_value,
      coalesce(nullif(transaction_after.description, ''),
        'Approved ' || transaction_after.transaction_type || ' transaction')
    ) returning id into ledger_entry_id;

    insert into public.audit_logs (
      firm_id, client_id, actor_user_id, action, entity_type, entity_id,
      before_data, after_data, metadata
    ) values (
      transaction_after.firm_id, transaction_after.client_id, actor_user_id,
      'transaction.ledger_handoff_repaired', 'transaction', transaction_after.id,
      transaction_before, to_jsonb(transaction_after),
      jsonb_build_object('ledger_entry_id', ledger_entry_id,
        'approval_boundary', 'approve_transaction_with_handoff')
    );

    return jsonb_build_object(
      'transaction_id', transaction_after.id,
      'ledger_entry_id', ledger_entry_id,
      'status', transaction_after.status,
      'outcome', 'repaired_handoff'
    );
  end if;

  update public.transactions
  set status = 'approved', approved_by = actor_user_id, approved_at = now()
  where id = transaction_after.id
  returning * into transaction_after;

  insert into public.ledger_entries (
    firm_id, client_id, transaction_id, entry_date, account_name,
    debit_amount, credit_amount, narration
  ) values (
    transaction_after.firm_id, transaction_after.client_id, transaction_after.id,
    transaction_after.transaction_date,
    coalesce(nullif(transaction_after.category, ''), nullif(transaction_after.party_name, ''),
      transaction_after.transaction_type || ' review account'),
    debit_value, credit_value,
    coalesce(nullif(transaction_after.description, ''),
      'Approved ' || transaction_after.transaction_type || ' transaction')
  ) returning id into ledger_entry_id;

  insert into public.audit_logs (
    firm_id, client_id, actor_user_id, action, entity_type, entity_id,
    before_data, after_data, metadata
  ) values (
    transaction_after.firm_id, transaction_after.client_id, actor_user_id,
    'transaction.approved', 'transaction', transaction_after.id,
    transaction_before, to_jsonb(transaction_after),
    jsonb_build_object('ledger_entry_id', ledger_entry_id,
      'approval_boundary', 'approve_transaction_with_handoff')
  );

  return jsonb_build_object(
    'transaction_id', transaction_after.id,
    'ledger_entry_id', ledger_entry_id,
    'status', transaction_after.status,
    'outcome', 'approved'
  );
end;
$$;

revoke all on function public.approve_transaction_with_handoff(uuid) from public, anon;
grant execute on function public.approve_transaction_with_handoff(uuid) to authenticated;

comment on function public.approve_transaction_with_handoff(uuid) is
'Atomically approves a transaction and creates one ledger handoff. Repeated approval preserves an existing corrected handoff; an approved transaction missing its handoff is repaired and audited.';
