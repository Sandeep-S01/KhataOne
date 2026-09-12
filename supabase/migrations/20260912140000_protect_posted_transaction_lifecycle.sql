create or replace function public.guard_posted_transaction_browser_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user in ('authenticated', 'anon')
    and old.status in ('approved', 'exported') then
    raise exception 'Posted transactions require a reversal workflow.' using errcode = '42501';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists protect_posted_transaction_browser_mutation on public.transactions;
create trigger protect_posted_transaction_browser_mutation
before update or delete on public.transactions
for each row execute function public.guard_posted_transaction_browser_mutation();

comment on function public.guard_posted_transaction_browser_mutation() is
'Prevents authenticated browser sessions from changing or deleting approved/exported financial records until an audited reversal workflow is implemented. Privileged service and SECURITY DEFINER workflows remain responsible for controlled lifecycle changes.';
