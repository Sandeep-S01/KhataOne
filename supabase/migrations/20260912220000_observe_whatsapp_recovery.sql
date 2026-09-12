create table if not exists public.background_worker_runs (
  id uuid primary key default gen_random_uuid(),
  worker_name text not null check (worker_name in ('whatsapp_ingestion', 'ai_extraction')),
  trigger_source text not null check (trigger_source in ('external_scheduler', 'vercel_cron', 'job_runner')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  succeeded boolean,
  claimed_count integer check (claimed_count is null or claimed_count >= 0),
  processed_count integer check (processed_count is null or processed_count >= 0),
  failed_count integer check (failed_count is null or failed_count >= 0),
  retrying_count integer check (retrying_count is null or retrying_count >= 0),
  error_message text,
  constraint background_worker_runs_completion_check check (
    (completed_at is null and succeeded is null)
    or (completed_at is not null and succeeded is not null and completed_at >= started_at)
  )
);

alter table public.background_worker_runs enable row level security;

create index if not exists background_worker_runs_worker_completed_idx
  on public.background_worker_runs (worker_name, completed_at desc);

revoke all on table public.background_worker_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.background_worker_runs to service_role;

create or replace function public.begin_background_worker_run(
  target_worker_name text,
  target_trigger_source text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_run_id uuid;
begin
  if target_worker_name not in ('whatsapp_ingestion', 'ai_extraction')
    or target_trigger_source not in ('external_scheduler', 'vercel_cron', 'job_runner') then
    raise exception 'Invalid background worker run.' using errcode = '22023';
  end if;

  insert into public.background_worker_runs(worker_name, trigger_source)
  values(target_worker_name, target_trigger_source)
  returning id into created_run_id;

  with expired as (
    select id
    from public.background_worker_runs
    where started_at < now() - interval '30 days'
    order by started_at
    limit 100
  )
  delete from public.background_worker_runs runs
  using expired
  where runs.id = expired.id;

  return created_run_id;
end;
$$;

create or replace function public.complete_background_worker_run(
  target_run_id uuid,
  target_succeeded boolean,
  target_claimed_count integer,
  target_processed_count integer,
  target_failed_count integer,
  target_retrying_count integer,
  target_error_message text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if target_succeeded is null
    or target_claimed_count is null or target_claimed_count < 0
    or target_processed_count is null or target_processed_count < 0
    or target_failed_count is null or target_failed_count < 0
    or target_retrying_count is null or target_retrying_count < 0 then
    raise exception 'Invalid background worker result.' using errcode = '22023';
  end if;

  update public.background_worker_runs
  set completed_at = greatest(clock_timestamp(), started_at),
    succeeded = target_succeeded,
    claimed_count = target_claimed_count,
    processed_count = target_processed_count,
    failed_count = target_failed_count,
    retrying_count = target_retrying_count,
    error_message = case
      when target_error_message is null then null
      else left(target_error_message, 500)
    end
  where id = target_run_id and completed_at is null;

  return found;
end;
$$;

create or replace function public.get_whatsapp_pipeline_health()
returns table (
  queue_name text,
  queued_count bigint,
  oldest_queued_at timestamptz,
  p95_claim_delay_ms bigint,
  p95_ack_delay_ms bigint,
  stale_lease_count bigint,
  retrying_count bigint,
  terminal_failure_count bigint,
  recent_failure_count bigint,
  last_worker_completed_at timestamptz,
  last_worker_success_at timestamptz,
  last_worker_succeeded boolean,
  last_claimed_count integer,
  last_processed_count integer,
  last_failed_count integer,
  last_retrying_count integer
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  with queue_health as (
    select
      'whatsapp_ingestion'::text as queue_name,
      count(*) filter (where e.status = 'queued' and e.scheduled_at <= now())::bigint as queued_count,
      min(e.received_at) filter (where e.status = 'queued' and e.scheduled_at <= now()) as oldest_queued_at,
      percentile_cont(0.95) within group (
        order by extract(epoch from (e.locked_at - e.created_at)) * 1000
      ) filter (where e.locked_at is not null and e.created_at >= now() - interval '24 hours')::bigint as p95_claim_delay_ms,
      percentile_cont(0.95) within group (
        order by extract(epoch from (e.ack_sent_at - e.created_at)) * 1000
      ) filter (where e.ack_sent_at is not null and e.created_at >= now() - interval '24 hours')::bigint as p95_ack_delay_ms,
      (select count(*) from public.worker_ordering_leases l
        where l.queue_name = 'whatsapp_ingestion'
          and l.locked_at < now() - interval '10 minutes')::bigint as stale_lease_count,
      count(*) filter (where e.status = 'queued' and e.attempt_count > 0)::bigint as retrying_count,
      count(*) filter (where e.status = 'failed')::bigint as terminal_failure_count,
      count(*) filter (where e.status = 'failed'
        and e.updated_at >= now() - interval '15 minutes')::bigint as recent_failure_count
    from public.whatsapp_webhook_events e

    union all

    select
      'ai_extraction'::text,
      count(*) filter (where j.status = 'queued' and j.scheduled_at <= now())::bigint,
      min(j.created_at) filter (where j.status = 'queued' and j.scheduled_at <= now()),
      percentile_cont(0.95) within group (
        order by extract(epoch from (j.locked_at - j.created_at)) * 1000
      ) filter (where j.locked_at is not null and j.created_at >= now() - interval '24 hours')::bigint,
      null::bigint,
      (select count(*) from public.worker_ordering_leases l
        where l.queue_name = 'ai_extraction'
          and l.locked_at < now() - interval '10 minutes')::bigint,
      count(*) filter (where j.status = 'queued' and j.attempt_count > 0)::bigint,
      count(*) filter (where j.status = 'failed')::bigint,
      count(*) filter (where j.status = 'failed'
        and j.updated_at >= now() - interval '15 minutes')::bigint
    from public.processing_jobs j
    where j.job_type = 'ai_extraction' and j.entity_type = 'document'
  )
  select
    q.queue_name,
    q.queued_count,
    q.oldest_queued_at,
    q.p95_claim_delay_ms,
    q.p95_ack_delay_ms,
    q.stale_lease_count,
    q.retrying_count,
    q.terminal_failure_count,
    q.recent_failure_count,
    latest.completed_at,
    successful.completed_at,
    latest.succeeded,
    latest.claimed_count,
    latest.processed_count,
    latest.failed_count,
    latest.retrying_count
  from queue_health q
  left join lateral (
    select r.completed_at, r.succeeded, r.claimed_count, r.processed_count,
      r.failed_count, r.retrying_count
    from public.background_worker_runs r
    where r.worker_name = q.queue_name and r.completed_at is not null
    order by r.completed_at desc
    limit 1
  ) latest on true
  left join lateral (
    select r.completed_at
    from public.background_worker_runs r
    where r.worker_name = q.queue_name and r.succeeded = true
      and r.completed_at is not null
    order by r.completed_at desc
    limit 1
  ) successful on true
  order by q.queue_name;
$$;

revoke all on function public.begin_background_worker_run(text,text)
  from public, anon, authenticated;
grant execute on function public.begin_background_worker_run(text,text) to service_role;
revoke all on function public.complete_background_worker_run(uuid,boolean,integer,integer,integer,integer,text)
  from public, anon, authenticated;
grant execute on function public.complete_background_worker_run(uuid,boolean,integer,integer,integer,integer,text)
  to service_role;
revoke all on function public.get_whatsapp_pipeline_health()
  from public, anon, authenticated;
grant execute on function public.get_whatsapp_pipeline_health() to service_role;

comment on table public.background_worker_runs is
'Service-only recovery worker telemetry retained for 30 days; it contains aggregate counts and sanitized errors, never webhook payloads or document content.';

comment on function public.get_whatsapp_pipeline_health() is
'Returns aggregate WhatsApp ingestion and AI extraction recovery health for trusted readiness and Operations surfaces.';
