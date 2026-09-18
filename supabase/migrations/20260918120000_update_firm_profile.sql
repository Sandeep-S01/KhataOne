-- Firm profile edits are limited to contact details and recorded atomically.
create or replace function public.update_firm_profile(
  target_firm_id uuid,
  target_name text,
  target_phone text,
  target_email text,
  target_address text
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  firm_before public.firms%rowtype;
  firm_after public.firms%rowtype;
  profile_before jsonb;
  profile_after jsonb;
begin
  if auth.uid() is null
    or not public.has_firm_role(target_firm_id, array['owner', 'admin']) then
    raise exception 'Firm profile update not permitted.' using errcode = '42501';
  end if;

  if target_name is null or char_length(btrim(target_name)) not between 2 and 120
    or (nullif(btrim(target_phone), '') is not null
      and btrim(target_phone) !~ '^\+?[0-9]{8,15}$')
    or (nullif(btrim(target_email), '') is not null
      and (char_length(btrim(target_email)) > 254
        or btrim(target_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
    or (target_address is not null and char_length(btrim(target_address)) > 500) then
    raise exception 'Invalid firm profile values.' using errcode = '22023';
  end if;

  select * into firm_before from public.firms
    where id = target_firm_id and status = 'active' for update;
  if not found then
    raise exception 'Firm profile update not permitted.' using errcode = '42501';
  end if;

  profile_before := jsonb_build_object(
    'name', firm_before.name, 'phone', firm_before.phone,
    'email', firm_before.email, 'address', firm_before.address
  );
  profile_after := jsonb_build_object(
    'name', btrim(target_name), 'phone', nullif(btrim(target_phone), ''),
    'email', nullif(btrim(target_email), ''), 'address', nullif(btrim(target_address), '')
  );
  if profile_before = profile_after then
    return firm_before.id;
  end if;

  update public.firms set
    name = btrim(target_name),
    phone = nullif(btrim(target_phone), ''),
    email = nullif(btrim(target_email), ''),
    address = nullif(btrim(target_address), '')
  where id = firm_before.id returning * into firm_after;

  insert into public.audit_logs(
    firm_id, actor_user_id, action, entity_type, entity_id,
    before_data, after_data, metadata
  ) values (
    target_firm_id, auth.uid(), 'firm.profile_updated', 'firm', firm_after.id,
    profile_before, profile_after, jsonb_build_object('source', 'dashboard')
  );
  return firm_after.id;
end;
$$;

revoke all on function public.update_firm_profile(uuid, text, text, text, text) from public, anon;
grant execute on function public.update_firm_profile(uuid, text, text, text, text) to authenticated;

-- Direct table updates could otherwise change slug, owner, GSTIN or status.
create policy firm_browser_update_denied on public.firms as restrictive
  for update to authenticated, anon using (false) with check (false);
