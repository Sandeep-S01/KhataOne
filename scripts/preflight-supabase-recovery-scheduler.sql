-- Read-only. Run section 1 first. Run sections 2 and 3 only when their
-- corresponding extension is installed. Secret values are never selected.

-- 1. Extension and scheduler prerequisites.
select
  exists(select 1 from pg_extension where extname = 'pg_cron') as pg_cron_installed,
  exists(select 1 from pg_extension where extname = 'pg_net') as pg_net_installed,
  exists(select 1 from pg_extension where extname = 'supabase_vault') as vault_installed,
  exists(select 1 from pg_available_extensions where name = 'pg_cron') as pg_cron_available,
  exists(select 1 from pg_available_extensions where name = 'pg_net') as pg_net_available,
  exists(select 1 from pg_available_extensions where name = 'supabase_vault') as vault_available,
  current_setting('server_version_num')::integer as server_version_num;

-- 2. Run only when pg_cron_installed is true. These names are reserved for
-- KhataOne's database-owned recovery scheduler.
select jobid, jobname, schedule, active
from cron.job
where jobname in (
  'khataone-whatsapp-ingestion-recovery',
  'khataone-ai-extraction-recovery'
)
order by jobname;

select
  backend_type,
  count(*) as process_count
from pg_stat_activity
where backend_type = 'pg_cron scheduler'
group by backend_type;

-- 3. Run only when vault_installed is true. A boolean/count result confirms
-- configuration without exposing the URL or bearer secret.
select
  count(*) filter (where name = 'khataone_recovery_base_url') as base_url_secret_count,
  count(*) filter (where name = 'khataone_recovery_cron_secret') as cron_secret_count,
  count(*) filter (
    where name in ('khataone_recovery_base_url', 'khataone_recovery_cron_secret')
  ) = 2 as scheduler_secrets_ready
from vault.secrets;

-- 4. Run after migration 20260912240000. This does not invoke either worker.
select
  to_regprocedure('public.dispatch_recovery_worker(text)') is not null
    as dispatcher_function,
  has_function_privilege(
    'anon', 'public.dispatch_recovery_worker(text)', 'EXECUTE'
  ) as anonymous_can_dispatch,
  has_function_privilege(
    'authenticated', 'public.dispatch_recovery_worker(text)', 'EXECUTE'
  ) as browser_can_dispatch;

select
  j.jobname,
  j.schedule,
  j.active,
  latest.status as latest_status,
  latest.start_time as latest_started_at,
  latest.end_time as latest_completed_at
from cron.job j
left join lateral (
  select status, start_time, end_time
  from cron.job_run_details d
  where d.jobid = j.jobid
  order by d.start_time desc
  limit 1
) latest on true
where j.jobname in (
  'khataone-whatsapp-ingestion-recovery',
  'khataone-ai-extraction-recovery'
)
order by j.jobname;
