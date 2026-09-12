-- Read-only. Run after migration 20260912220000 has been applied.
select
  to_regclass('public.background_worker_runs') is not null as worker_runs_table,
  to_regprocedure('public.begin_background_worker_run(text,text)') is not null as begin_run_function,
  to_regprocedure(
    'public.complete_background_worker_run(uuid,boolean,integer,integer,integer,integer,text)'
  ) is not null as complete_run_function,
  to_regprocedure('public.get_whatsapp_pipeline_health()') is not null as health_function,
  has_function_privilege('anon', 'public.get_whatsapp_pipeline_health()', 'EXECUTE')
    as anonymous_can_read_health,
  has_function_privilege('authenticated', 'public.get_whatsapp_pipeline_health()', 'EXECUTE')
    as browser_can_read_health;

select * from public.get_whatsapp_pipeline_health();

select
  worker_name,
  count(*) filter (where completed_at >= now() - interval '1 hour') as completed_last_hour,
  max(completed_at) as last_completed_at,
  max(completed_at) filter (where succeeded) as last_success_at,
  max(extract(epoch from (completed_at - started_at)) * 1000)::bigint
    filter (where completed_at >= now() - interval '1 hour') as max_runtime_ms
from public.background_worker_runs
group by worker_name
order by worker_name;
