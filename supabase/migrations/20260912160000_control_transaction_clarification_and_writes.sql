create or replace function public.request_transaction_clarification(
  target_firm_id uuid,
  target_transaction_id uuid,
  clarification_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  transaction_before public.transactions%rowtype;
  transaction_after public.transactions%rowtype;
  request_audit_id uuid;
begin
  if auth.uid() is null
    or not public.has_firm_role(target_firm_id, array['owner', 'admin', 'staff']) then
    raise exception 'Clarification request not permitted.' using errcode = '42501';
  end if;

  if clarification_note is null or length(btrim(clarification_note)) = 0
    or length(clarification_note) > 2000 then
    raise exception 'Enter a valid clarification note.' using errcode = '22023';
  end if;

  select * into transaction_before
  from public.transactions
  where id = target_transaction_id and firm_id = target_firm_id
  for update;

  if not found or not exists (
    select 1 from public.clients
    where id = transaction_before.client_id and firm_id = target_firm_id
  ) then
    raise exception 'Clarification request not permitted.' using errcode = '42501';
  end if;

  if transaction_before.status in ('approved', 'exported') then
    raise exception 'Posted transactions require a reversal workflow.' using errcode = '42501';
  end if;

  update public.transactions
  set status = 'needs_review', approved_by = null, approved_at = null
  where id = transaction_before.id
  returning * into transaction_after;

  insert into public.audit_logs (
    firm_id, client_id, actor_user_id, action, entity_type, entity_id,
    before_data, after_data, metadata
  ) values (
    target_firm_id, transaction_before.client_id, auth.uid(),
    'transaction.clarification_requested', 'transaction', transaction_before.id,
    to_jsonb(transaction_before), to_jsonb(transaction_after),
    jsonb_build_object('clarification_note', btrim(clarification_note),
      'delivery_status', 'pending',
      'review_boundary', 'request_transaction_clarification')
  ) returning id into request_audit_id;

  return jsonb_build_object(
    'transaction_id', transaction_after.id,
    'client_id', transaction_after.client_id,
    'request_audit_id', request_audit_id
  );
end;
$$;

create or replace function public.record_transaction_clarification_delivery(
  target_firm_id uuid,
  target_transaction_id uuid,
  target_request_audit_id uuid,
  delivered boolean,
  delivery_error text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_client_id uuid;
  delivery_audit_id uuid;
begin
  if auth.uid() is null
    or not public.has_firm_role(target_firm_id, array['owner', 'admin', 'staff']) then
    raise exception 'Clarification delivery audit not permitted.' using errcode = '42501';
  end if;

  select client_id into target_client_id
  from public.transactions
  where id = target_transaction_id and firm_id = target_firm_id;

  if not found or not exists (
    select 1 from public.audit_logs
    where id = target_request_audit_id
      and firm_id = target_firm_id
      and client_id = target_client_id
      and entity_type = 'transaction'
      and entity_id = target_transaction_id
      and action = 'transaction.clarification_requested'
      and actor_user_id = auth.uid()
  ) then
    raise exception 'Clarification delivery audit not permitted.' using errcode = '42501';
  end if;

  insert into public.audit_logs (
    firm_id, client_id, actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    target_firm_id, target_client_id, auth.uid(),
    case when delivered then 'transaction.clarification_delivered'
      else 'transaction.clarification_delivery_failed' end,
    'transaction', target_transaction_id,
    jsonb_build_object(
      'request_audit_id', target_request_audit_id,
      'whatsapp_sent', delivered,
      'whatsapp_error', case when delivered then null else left(delivery_error, 500) end,
      'review_boundary', 'record_transaction_clarification_delivery'
    )
  ) returning id into delivery_audit_id;

  return delivery_audit_id;
end;
$$;

revoke all on function public.request_transaction_clarification(uuid,uuid,text) from public, anon;
grant execute on function public.request_transaction_clarification(uuid,uuid,text) to authenticated;
revoke all on function public.record_transaction_clarification_delivery(uuid,uuid,uuid,boolean,text) from public, anon;
grant execute on function public.record_transaction_clarification_delivery(uuid,uuid,uuid,boolean,text) to authenticated;

create policy transaction_browser_insert_denied on public.transactions as restrictive
  for insert to authenticated, anon with check (false);
create policy transaction_browser_update_denied on public.transactions as restrictive
  for update to authenticated, anon using (false) with check (false);
create policy transaction_browser_delete_denied on public.transactions as restrictive
  for delete to authenticated, anon using (false);

comment on function public.request_transaction_clarification(uuid,uuid,text) is
'Authorizes and records a clarification request before any external message is sent, while atomically returning the transaction to needs_review.';
comment on function public.record_transaction_clarification_delivery(uuid,uuid,uuid,boolean,text) is
'Records the delivery outcome for a clarification request created by the same active reviewer.';
