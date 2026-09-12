create or replace function public.correct_ledger_entry(
  target_firm_id uuid, target_entry_id uuid, corrected_entry_date date,
  corrected_account_name text, corrected_debit_amount numeric,
  corrected_credit_amount numeric, corrected_narration text, correction_note text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  entry_before public.ledger_entries%rowtype;
  entry_after public.ledger_entries%rowtype;
  debit_value numeric(14,2);
  credit_value numeric(14,2);
begin
  if auth.uid() is null or not public.has_firm_role(target_firm_id, array['owner','admin','staff']) then
    raise exception 'Ledger correction not permitted.' using errcode = '42501';
  end if;
  if corrected_account_name is null or length(btrim(corrected_account_name)) < 2
    or corrected_debit_amount is null or corrected_credit_amount is null
    or corrected_debit_amount::text in ('NaN','Infinity','-Infinity')
    or corrected_credit_amount::text in ('NaN','Infinity','-Infinity')
    or corrected_debit_amount < 0 or corrected_credit_amount < 0
    or (corrected_entry_date is not null and not isfinite(corrected_entry_date)) then
    raise exception 'Invalid ledger correction.' using errcode = '22023';
  end if;
  debit_value := corrected_debit_amount;
  credit_value := corrected_credit_amount;
  if (debit_value > 0 and credit_value > 0) or (debit_value = 0 and credit_value = 0)
    or (corrected_debit_amount > 0 and corrected_credit_amount > 0) then
    raise exception 'Use one nonzero debit or credit amount.' using errcode = '22023';
  end if;

  select * into entry_before from public.ledger_entries
  where id = target_entry_id and firm_id = target_firm_id for update;
  if not found then
    raise exception 'Ledger correction not permitted.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.transactions t join public.clients c on c.id = t.client_id
    where t.id = entry_before.transaction_id and t.firm_id = target_firm_id
      and t.client_id = entry_before.client_id and c.firm_id = target_firm_id) then
    raise exception 'Ledger source ownership is inconsistent.' using errcode = '42501';
  end if;

  update public.ledger_entries set entry_date = corrected_entry_date,
    account_name = btrim(corrected_account_name), debit_amount = debit_value,
    credit_amount = credit_value, narration = nullif(btrim(corrected_narration),'')
  where id = entry_before.id returning * into entry_after;
  insert into public.audit_logs(firm_id,client_id,actor_user_id,action,entity_type,entity_id,
    before_data,after_data,metadata)
  values (target_firm_id,entry_before.client_id,auth.uid(),'ledger_entry.corrected','ledger_entry',
    entry_before.id,to_jsonb(entry_before),to_jsonb(entry_after),
    jsonb_build_object('correction_note',nullif(btrim(correction_note),''),
      'source_transaction_id',entry_before.transaction_id));
  return entry_after.id;
end;
$$;

revoke all on function public.correct_ledger_entry(uuid,uuid,date,text,numeric,numeric,text,text) from public, anon;
grant execute on function public.correct_ledger_entry(uuid,uuid,date,text,numeric,numeric,text,text) to authenticated;

-- Authorized SECURITY DEFINER handoff/correction functions retain write access.
create policy ledger_browser_insert_denied on public.ledger_entries as restrictive
  for insert to authenticated, anon with check (false);
create policy ledger_browser_update_denied on public.ledger_entries as restrictive
  for update to authenticated, anon using (false) with check (false);
create policy ledger_browser_delete_denied on public.ledger_entries as restrictive
  for delete to authenticated, anon using (false);
