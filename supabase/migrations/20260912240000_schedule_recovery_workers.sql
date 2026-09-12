create or replace function public.dispatch_recovery_worker(target_worker_name text)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recovery_base_url text;
  recovery_cron_secret text;
  worker_path text;
  request_id bigint;
begin
  worker_path := case target_worker_name
    when 'whatsapp_ingestion' then '/api/jobs/whatsapp-ingestion/run-queued?batch_size=10'
    when 'ai_extraction' then '/api/jobs/ai-extraction/run-queued?batch_size=10'
    else null
  end;

  if worker_path is null then
    raise exception 'Invalid recovery worker.' using errcode = '22023';
  end if;

  select max(decrypted_secret) filter (where name = 'khataone_recovery_base_url'),
    max(decrypted_secret) filter (where name = 'khataone_recovery_cron_secret')
  into recovery_base_url, recovery_cron_secret
  from vault.decrypted_secrets
  where name in ('khataone_recovery_base_url', 'khataone_recovery_cron_secret');

  if recovery_base_url is null
    or recovery_base_url !~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?/?$'
    or recovery_cron_secret is null
    or length(recovery_cron_secret) < 32 then
    raise exception 'Recovery scheduler is not configured.' using errcode = '55000';
  end if;

  select net.http_get(
    url := rtrim(recovery_base_url, '/') || worker_path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || recovery_cron_secret,
      'User-Agent', 'khataone-supabase-cron/1.0'
    ),
    timeout_milliseconds := 290000
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function public.dispatch_recovery_worker(text)
  from public, anon, authenticated;
grant execute on function public.dispatch_recovery_worker(text) to service_role;

comment on function public.dispatch_recovery_worker(text) is
'Queues one authenticated asynchronous request to a fixed KhataOne recovery route using configuration stored in Supabase Vault.';

select cron.schedule(
  'khataone-whatsapp-ingestion-recovery',
  '* * * * *',
  $cron$select public.dispatch_recovery_worker('whatsapp_ingestion');$cron$
);

select cron.schedule(
  'khataone-ai-extraction-recovery',
  '* * * * *',
  $cron$select public.dispatch_recovery_worker('ai_extraction');$cron$
);
