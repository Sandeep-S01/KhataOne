create or replace function public.create_dashboard_client(
  target_firm_id uuid, target_business_name text, target_contact_name text,
  target_phone text, target_whatsapp_phone text, target_email text,
  target_gstin text, target_state_code text, target_filing_frequency text,
  target_status text
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare created_client public.clients%rowtype;
begin
  if auth.uid() is null or not public.has_firm_role(target_firm_id,array['owner','admin','staff']) then
    raise exception 'Client creation not permitted.' using errcode='42501';
  end if;
  if target_business_name is null or length(btrim(target_business_name)) < 2
    or target_filing_frequency not in ('monthly','quarterly','annual','unknown')
    or target_status not in ('onboarding','active','pending_documents','review_needed','filing_ready','archived')
    or (nullif(btrim(target_email),'') is not null and btrim(target_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    or (nullif(btrim(target_phone),'') is not null and length(btrim(target_phone)) < 8)
    or (nullif(btrim(target_whatsapp_phone),'') is not null and length(btrim(target_whatsapp_phone)) < 8)
    or (nullif(btrim(target_gstin),'') is not null and length(btrim(target_gstin)) <> 15)
    or (nullif(btrim(target_state_code),'') is not null and length(btrim(target_state_code)) <> 2) then
    raise exception 'Invalid client values.' using errcode='22023';
  end if;
  insert into public.clients(firm_id,business_name,contact_name,phone,whatsapp_phone,email,
    gstin,state_code,filing_frequency,status)
  values(target_firm_id,btrim(target_business_name),nullif(btrim(target_contact_name),''),
    nullif(btrim(target_phone),''),nullif(btrim(target_whatsapp_phone),''),
    nullif(btrim(target_email),''),nullif(upper(btrim(target_gstin)),''),
    nullif(upper(btrim(target_state_code)),''),target_filing_frequency,target_status)
  returning * into created_client;
  insert into public.audit_logs(firm_id,client_id,actor_user_id,action,entity_type,
    entity_id,after_data,metadata)
  values(target_firm_id,created_client.id,auth.uid(),'client.created','client',created_client.id,
    to_jsonb(created_client),jsonb_build_object('source','dashboard'));
  return created_client.id;
end; $$;

create or replace function public.update_dashboard_client(
  target_firm_id uuid, target_client_id uuid, target_business_name text,
  target_contact_name text, target_phone text, target_whatsapp_phone text,
  target_email text, target_gstin text, target_state_code text,
  target_filing_frequency text, target_status text
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare client_before public.clients%rowtype; client_after public.clients%rowtype;
begin
  if auth.uid() is null or not public.has_firm_role(target_firm_id,array['owner','admin','staff']) then
    raise exception 'Client update not permitted.' using errcode='42501';
  end if;
  if target_business_name is null or length(btrim(target_business_name)) < 2
    or target_filing_frequency not in ('monthly','quarterly','annual','unknown')
    or target_status not in ('onboarding','active','pending_documents','review_needed','filing_ready','archived')
    or (nullif(btrim(target_email),'') is not null and btrim(target_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    or (nullif(btrim(target_phone),'') is not null and length(btrim(target_phone)) < 8)
    or (nullif(btrim(target_whatsapp_phone),'') is not null and length(btrim(target_whatsapp_phone)) < 8)
    or (nullif(btrim(target_gstin),'') is not null and length(btrim(target_gstin)) <> 15)
    or (nullif(btrim(target_state_code),'') is not null and length(btrim(target_state_code)) <> 2) then
    raise exception 'Invalid client values.' using errcode='22023';
  end if;
  select * into client_before from public.clients
    where id=target_client_id and firm_id=target_firm_id for update;
  if not found then raise exception 'Client update not permitted.' using errcode='42501'; end if;
  update public.clients set business_name=btrim(target_business_name),
    contact_name=nullif(btrim(target_contact_name),''),phone=nullif(btrim(target_phone),''),
    whatsapp_phone=nullif(btrim(target_whatsapp_phone),''),email=nullif(btrim(target_email),''),
    gstin=nullif(upper(btrim(target_gstin)),''),state_code=nullif(upper(btrim(target_state_code)),''),
    filing_frequency=target_filing_frequency,status=target_status
  where id=client_before.id returning * into client_after;
  insert into public.audit_logs(firm_id,client_id,actor_user_id,action,entity_type,
    entity_id,before_data,after_data,metadata)
  values(target_firm_id,client_after.id,auth.uid(),'client.updated','client',client_after.id,
    to_jsonb(client_before),to_jsonb(client_after),jsonb_build_object('source','dashboard'));
  return client_after.id;
end; $$;

create or replace function public.archive_dashboard_client(target_firm_id uuid,target_client_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare client_before public.clients%rowtype; client_after public.clients%rowtype;
begin
  if auth.uid() is null or not public.has_firm_role(target_firm_id,array['owner','admin','staff']) then
    raise exception 'Client archive not permitted.' using errcode='42501';
  end if;
  select * into client_before from public.clients
    where id=target_client_id and firm_id=target_firm_id for update;
  if not found then raise exception 'Client archive not permitted.' using errcode='42501'; end if;
  if client_before.status='archived' then return client_before.id; end if;
  update public.clients set status='archived' where id=client_before.id returning * into client_after;
  insert into public.audit_logs(firm_id,client_id,actor_user_id,action,entity_type,
    entity_id,before_data,after_data,metadata)
  values(target_firm_id,client_after.id,auth.uid(),'client.archived','client',client_after.id,
    to_jsonb(client_before),to_jsonb(client_after),jsonb_build_object('source','dashboard'));
  return client_after.id;
end; $$;

create or replace function public.queue_dashboard_export(
  target_firm_id uuid, target_client_id uuid, target_gst_period_id uuid,
  target_export_type text, target_period_start date, target_period_end date
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare created_export public.exports%rowtype;
begin
  if auth.uid() is null or not public.has_firm_role(target_firm_id,array['owner','admin','staff']) then
    raise exception 'Export request not permitted.' using errcode='42501';
  end if;
  if target_export_type not in ('csv_transactions','gst_summary','pdf_summary') then
    raise exception 'Invalid export type.' using errcode='22023';
  end if;
  if target_export_type='csv_transactions' then
    if target_client_id is null or target_gst_period_id is not null
      or target_period_start is null or target_period_end is null
      or not isfinite(target_period_start) or not isfinite(target_period_end)
      or target_period_start > target_period_end
      or not exists(select 1 from public.clients where id=target_client_id and firm_id=target_firm_id) then
      raise exception 'Invalid transaction export request.' using errcode='22023';
    end if;
  elsif target_client_id is not null or target_gst_period_id is null
    or not exists(select 1 from public.gst_periods where id=target_gst_period_id and firm_id=target_firm_id) then
    raise exception 'Invalid GST export request.' using errcode='22023';
  end if;
  insert into public.exports(firm_id,client_id,gst_period_id,export_type,status,requested_by,metadata)
  values(target_firm_id,target_client_id,target_gst_period_id,target_export_type,'queued',auth.uid(),
    jsonb_build_object('client_id',target_client_id,'gst_period_id',target_gst_period_id,
      'requested_period_start',target_period_start,'requested_period_end',target_period_end))
  returning * into created_export;
  insert into public.processing_jobs(firm_id,client_id,job_type,entity_type,entity_id,status)
  values(target_firm_id,target_client_id,'export_generation','export',created_export.id,'queued');
  insert into public.audit_logs(firm_id,client_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(target_firm_id,target_client_id,auth.uid(),'export.queued','export',created_export.id,
    jsonb_build_object('export_type',target_export_type,'direct_gst_filing',false));
  return created_export.id;
end; $$;

create or replace function public.request_manual_job_run(
  target_firm_id uuid,target_job_id uuid,target_job_type text,target_entity_type text
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare target_job public.processing_jobs%rowtype;
begin
  if auth.uid() is null or not public.has_firm_role(target_firm_id,array['owner','admin','staff']) then
    raise exception 'Manual job request not permitted.' using errcode='42501';
  end if;
  if (target_job_type,target_entity_type) not in
    (('ai_extraction','document'),('export_generation','export')) then
    raise exception 'Invalid manual job type.' using errcode='22023';
  end if;
  select * into target_job from public.processing_jobs where id=target_job_id
    and firm_id=target_firm_id and job_type=target_job_type
    and entity_type=target_entity_type and status in ('queued','failed') for update;
  if not found then raise exception 'Manual job request not permitted.' using errcode='42501'; end if;
  if (target_job_type='ai_extraction' and not exists(select 1 from public.documents
      where id=target_job.entity_id and firm_id=target_firm_id
      and client_id is not distinct from target_job.client_id))
    or (target_job_type='export_generation' and not exists(select 1 from public.exports
      where id=target_job.entity_id and firm_id=target_firm_id
      and client_id is not distinct from target_job.client_id)) then
    raise exception 'Manual job target ownership is inconsistent.' using errcode='42501';
  end if;
  insert into public.audit_logs(firm_id,client_id,actor_user_id,action,entity_type,
    entity_id,before_data,metadata)
  values(target_firm_id,target_job.client_id,auth.uid(),'processing_job.manual_run_requested',
    'processing_job',target_job.id,to_jsonb(target_job),
    jsonb_build_object('job_type',target_job.job_type,'entity_id',target_job.entity_id));
  return to_jsonb(target_job);
end; $$;

revoke all on function public.create_dashboard_client(uuid,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.create_dashboard_client(uuid,text,text,text,text,text,text,text,text,text) to authenticated;
revoke all on function public.update_dashboard_client(uuid,uuid,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.update_dashboard_client(uuid,uuid,text,text,text,text,text,text,text,text,text) to authenticated;
revoke all on function public.archive_dashboard_client(uuid,uuid) from public,anon;
grant execute on function public.archive_dashboard_client(uuid,uuid) to authenticated;
revoke all on function public.queue_dashboard_export(uuid,uuid,uuid,text,date,date) from public,anon;
grant execute on function public.queue_dashboard_export(uuid,uuid,uuid,text,date,date) to authenticated;
revoke all on function public.request_manual_job_run(uuid,uuid,text,text) from public,anon;
grant execute on function public.request_manual_job_run(uuid,uuid,text,text) to authenticated;

create policy client_browser_insert_denied on public.clients as restrictive for insert to authenticated,anon with check(false);
create policy client_browser_update_denied on public.clients as restrictive for update to authenticated,anon using(false) with check(false);
create policy client_browser_delete_denied on public.clients as restrictive for delete to authenticated,anon using(false);
create policy export_browser_all_insert_denied on public.exports as restrictive for insert to authenticated,anon with check(false);
create policy export_browser_all_update_denied on public.exports as restrictive for update to authenticated,anon using(false) with check(false);
create policy export_browser_all_delete_denied on public.exports as restrictive for delete to authenticated,anon using(false);
create policy job_browser_all_insert_denied on public.processing_jobs as restrictive for insert to authenticated,anon with check(false);
create policy job_browser_all_update_denied on public.processing_jobs as restrictive for update to authenticated,anon using(false) with check(false);
create policy job_browser_all_delete_denied on public.processing_jobs as restrictive for delete to authenticated,anon using(false);
create policy audit_browser_insert_denied on public.audit_logs as restrictive for insert to authenticated,anon with check(false);
create policy audit_browser_update_denied on public.audit_logs as restrictive for update to authenticated,anon using(false) with check(false);
create policy audit_browser_delete_denied on public.audit_logs as restrictive for delete to authenticated,anon using(false);
