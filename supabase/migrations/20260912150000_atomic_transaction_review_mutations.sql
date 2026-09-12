create or replace function public.update_transaction_review(
  target_firm_id uuid,
  target_transaction_id uuid,
  reviewed_transaction_type text,
  reviewed_transaction_date date,
  reviewed_party_name text,
  reviewed_party_gstin text,
  reviewed_invoice_number text,
  reviewed_description text,
  reviewed_category text,
  reviewed_place_of_supply text,
  reviewed_taxable_amount numeric,
  reviewed_cgst_amount numeric,
  reviewed_sgst_amount numeric,
  reviewed_igst_amount numeric,
  reviewed_cess_amount numeric,
  reviewed_total_amount numeric,
  reviewed_payment_mode text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  transaction_before public.transactions%rowtype;
  transaction_after public.transactions%rowtype;
begin
  if auth.uid() is null
    or not public.has_firm_role(target_firm_id, array['owner', 'admin', 'staff']) then
    raise exception 'Transaction review not permitted.' using errcode = '42501';
  end if;

  select * into transaction_before
  from public.transactions
  where id = target_transaction_id and firm_id = target_firm_id
  for update;

  if not found or not exists (
    select 1 from public.clients
    where id = transaction_before.client_id and firm_id = target_firm_id
  ) then
    raise exception 'Transaction review not permitted.' using errcode = '42501';
  end if;

  if transaction_before.status in ('approved', 'exported') then
    raise exception 'Posted transactions require a reversal workflow.' using errcode = '42501';
  end if;

  if reviewed_transaction_type not in ('purchase', 'sales', 'expense', 'payment', 'receipt', 'unclear')
    or (reviewed_transaction_date is not null and not isfinite(reviewed_transaction_date))
    or reviewed_taxable_amount::text in ('NaN', 'Infinity', '-Infinity')
    or reviewed_cgst_amount::text in ('NaN', 'Infinity', '-Infinity')
    or reviewed_sgst_amount::text in ('NaN', 'Infinity', '-Infinity')
    or reviewed_igst_amount::text in ('NaN', 'Infinity', '-Infinity')
    or reviewed_cess_amount::text in ('NaN', 'Infinity', '-Infinity')
    or reviewed_total_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Invalid transaction review values.' using errcode = '22023';
  end if;

  update public.transactions
  set
    transaction_type = reviewed_transaction_type,
    transaction_date = reviewed_transaction_date,
    party_name = nullif(btrim(reviewed_party_name), ''),
    party_gstin = nullif(upper(btrim(reviewed_party_gstin)), ''),
    invoice_number = nullif(btrim(reviewed_invoice_number), ''),
    description = nullif(btrim(reviewed_description), ''),
    category = nullif(btrim(reviewed_category), ''),
    place_of_supply = nullif(btrim(reviewed_place_of_supply), ''),
    taxable_amount = reviewed_taxable_amount,
    cgst_amount = reviewed_cgst_amount,
    sgst_amount = reviewed_sgst_amount,
    igst_amount = reviewed_igst_amount,
    cess_amount = reviewed_cess_amount,
    total_amount = reviewed_total_amount,
    payment_mode = nullif(btrim(reviewed_payment_mode), ''),
    approved_by = null,
    approved_at = null
  where id = transaction_before.id
  returning * into transaction_after;

  insert into public.audit_logs (
    firm_id, client_id, actor_user_id, action, entity_type, entity_id,
    before_data, after_data, metadata
  ) values (
    target_firm_id, transaction_before.client_id, auth.uid(),
    'transaction.updated', 'transaction', transaction_before.id,
    to_jsonb(transaction_before), to_jsonb(transaction_after),
    jsonb_build_object('review_boundary', 'update_transaction_review')
  );

  return transaction_after.id;
end;
$$;

create or replace function public.decide_transaction_review(
  target_firm_id uuid,
  target_transaction_id uuid,
  target_status text,
  review_note text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  transaction_before public.transactions%rowtype;
  transaction_after public.transactions%rowtype;
  audit_action text;
begin
  if auth.uid() is null
    or not public.has_firm_role(target_firm_id, array['owner', 'admin', 'staff']) then
    raise exception 'Transaction decision not permitted.' using errcode = '42501';
  end if;

  if target_status not in ('rejected', 'duplicate') then
    raise exception 'Invalid transaction decision.' using errcode = '22023';
  end if;

  select * into transaction_before
  from public.transactions
  where id = target_transaction_id and firm_id = target_firm_id
  for update;

  if not found or not exists (
    select 1 from public.clients
    where id = transaction_before.client_id and firm_id = target_firm_id
  ) then
    raise exception 'Transaction decision not permitted.' using errcode = '42501';
  end if;

  if transaction_before.status in ('approved', 'exported') then
    raise exception 'Posted transactions require a reversal workflow.' using errcode = '42501';
  end if;

  if transaction_before.status = target_status then
    return transaction_before.id;
  end if;

  audit_action := case target_status
    when 'rejected' then 'transaction.rejected'
    else 'transaction.marked_duplicate'
  end;

  update public.transactions
  set status = target_status, approved_by = null, approved_at = null
  where id = transaction_before.id
  returning * into transaction_after;

  insert into public.audit_logs (
    firm_id, client_id, actor_user_id, action, entity_type, entity_id,
    before_data, after_data, metadata
  ) values (
    target_firm_id, transaction_before.client_id, auth.uid(), audit_action,
    'transaction', transaction_before.id, to_jsonb(transaction_before),
    to_jsonb(transaction_after),
    jsonb_build_object('review_note', nullif(btrim(review_note), ''),
      'review_boundary', 'decide_transaction_review')
  );

  return transaction_after.id;
end;
$$;

revoke all on function public.update_transaction_review(uuid,uuid,text,date,text,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,numeric,text) from public, anon;
grant execute on function public.update_transaction_review(uuid,uuid,text,date,text,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,numeric,text) to authenticated;

revoke all on function public.decide_transaction_review(uuid,uuid,text,text) from public, anon;
grant execute on function public.decide_transaction_review(uuid,uuid,text,text) to authenticated;

comment on function public.update_transaction_review(uuid,uuid,text,date,text,text,text,text,text,text,numeric,numeric,numeric,numeric,numeric,numeric,text) is
'Atomically updates a non-posted transaction review and records its before/after audit after tenant, role, ownership and value validation.';

comment on function public.decide_transaction_review(uuid,uuid,text,text) is
'Atomically rejects or duplicate-marks a non-posted transaction and records its before/after audit. Repeating the same decision is idempotent.';
