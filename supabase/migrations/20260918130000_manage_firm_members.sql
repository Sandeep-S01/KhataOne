-- Settings may show only the active firm's members to its owner or admins.
create or replace function public.list_firm_members(target_firm_id uuid)
returns table (
  membership_id uuid,
  user_id uuid,
  email text,
  role text,
  status text,
  joined_at timestamptz
)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null
    or not public.has_firm_role(target_firm_id, array['owner', 'admin'])
    or not exists (
      select 1 from public.firms f
      where f.id = target_firm_id and f.status = 'active'
    ) then
    raise exception 'Team access not permitted.' using errcode = '42501';
  end if;

  return query
  select fu.id, fu.user_id, au.email::text, fu.role, fu.status, fu.created_at
  from public.firm_users fu
  join auth.users au on au.id = fu.user_id
  where fu.firm_id = target_firm_id
  order by case when fu.role = 'owner' then 0 else 1 end,
    fu.created_at, fu.id;
end;
$$;

-- Role and access changes are authorized and audited in one transaction.
create or replace function public.update_firm_member(
  target_firm_id uuid,
  target_membership_id uuid,
  target_role text,
  target_status text
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  actor_role text;
  member_before public.firm_users%rowtype;
  member_after public.firm_users%rowtype;
begin
  select fu.role into actor_role from public.firm_users fu
  join public.firms f on f.id = fu.firm_id and f.status = 'active'
  where fu.firm_id = target_firm_id
    and fu.user_id = auth.uid() and fu.status = 'active';
  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Member update not permitted.' using errcode = '42501';
  end if;
  if target_role is null or target_role not in ('admin', 'staff', 'viewer')
    or target_status is null or target_status not in ('active', 'disabled') then
    raise exception 'Invalid member values.' using errcode = '22023';
  end if;

  select * into member_before from public.firm_users
  where id = target_membership_id and firm_id = target_firm_id for update;
  if not found or member_before.user_id = auth.uid()
    or member_before.role = 'owner' or member_before.status = 'invited'
    or (actor_role = 'admin'
      and (member_before.role = 'admin' or target_role = 'admin')) then
    raise exception 'Member update not permitted.' using errcode = '42501';
  end if;

  if member_before.role = target_role and member_before.status = target_status then
    return member_before.id;
  end if;

  update public.firm_users set role = target_role, status = target_status
  where id = member_before.id returning * into member_after;

  insert into public.audit_logs(
    firm_id, actor_user_id, action, entity_type, entity_id,
    before_data, after_data, metadata
  ) values (
    target_firm_id, auth.uid(), 'firm.member_updated', 'firm_user', member_after.id,
    jsonb_build_object('role', member_before.role, 'status', member_before.status),
    jsonb_build_object('role', member_after.role, 'status', member_after.status),
    jsonb_build_object('source', 'dashboard')
  );
  return member_after.id;
end;
$$;

revoke all on function public.list_firm_members(uuid) from public, anon;
grant execute on function public.list_firm_members(uuid) to authenticated;
revoke all on function public.update_firm_member(uuid, uuid, text, text) from public, anon;
grant execute on function public.update_firm_member(uuid, uuid, text, text) to authenticated;

-- Existing broad RLS updates could otherwise allow self-promotion or owner edits.
create policy firm_users_browser_update_denied on public.firm_users as restrictive
  for update to authenticated, anon using (false) with check (false);
