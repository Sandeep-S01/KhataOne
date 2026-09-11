do $$
begin
  if exists (
    select 1
    from public.processing_jobs
    where job_type = 'export_generation'
      and entity_type = 'export'
    group by job_type, entity_type, entity_id
    having count(*) > 1
  ) then
    raise exception 'Cannot add processing_jobs_export_generation_unique_idx because duplicate export generation jobs exist.';
  end if;
end;
$$;

create unique index if not exists processing_jobs_export_generation_unique_idx
on public.processing_jobs (job_type, entity_type, entity_id)
where job_type = 'export_generation' and entity_type = 'export';

drop policy if exists "Firm staff can create processing jobs" on public.processing_jobs;
create policy "Firm staff can create processing jobs"
on public.processing_jobs for insert
to authenticated
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

create or replace function public.claim_export_generation_jobs(
  batch_size integer default 5,
  worker_id text default 'khataone-export-worker',
  stale_after interval default interval '10 minutes',
  max_attempts integer default 3
)
returns table (
  id uuid,
  firm_id uuid,
  client_id uuid,
  entity_type text,
  entity_id uuid,
  attempt_count integer,
  scheduled_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidates as (
    select processing_jobs.id
    from public.processing_jobs
    where processing_jobs.job_type = 'export_generation'
      and processing_jobs.entity_type = 'export'
      and processing_jobs.scheduled_at <= now()
      and processing_jobs.attempt_count < greatest(max_attempts, 1)
      and (
        processing_jobs.status = 'queued'
        or (
          processing_jobs.status = 'failed'
          and processing_jobs.attempt_count < greatest(max_attempts, 1)
        )
        or (
          processing_jobs.status = 'processing'
          and processing_jobs.locked_at is not null
          and processing_jobs.locked_at < now() - coalesce(stale_after, interval '10 minutes')
        )
      )
    order by processing_jobs.scheduled_at asc, processing_jobs.created_at asc
    limit greatest(least(batch_size, 20), 1)
    for update skip locked
  )
  update public.processing_jobs
  set
    status = 'processing',
    attempt_count = public.processing_jobs.attempt_count + 1,
    locked_at = now(),
    locked_by = coalesce(worker_id, 'khataone-export-worker'),
    last_error = null
  from candidates
  where public.processing_jobs.id = candidates.id
  returning
    public.processing_jobs.id,
    public.processing_jobs.firm_id,
    public.processing_jobs.client_id,
    public.processing_jobs.entity_type,
    public.processing_jobs.entity_id,
    public.processing_jobs.attempt_count,
    public.processing_jobs.scheduled_at,
    public.processing_jobs.created_at;
end;
$$;

revoke all on function public.claim_export_generation_jobs(integer, text, interval, integer)
from public, anon, authenticated;

grant execute on function public.claim_export_generation_jobs(integer, text, interval, integer)
to service_role;

create or replace function public.claim_export_generation_job(
  target_job_id uuid,
  worker_id text default 'khataone-export-manual-worker',
  max_attempts integer default 3
)
returns table (
  id uuid,
  firm_id uuid,
  client_id uuid,
  entity_type text,
  entity_id uuid,
  attempt_count integer,
  scheduled_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  update public.processing_jobs
  set
    status = 'processing',
    attempt_count = public.processing_jobs.attempt_count + 1,
    locked_at = now(),
    locked_by = coalesce(worker_id, 'khataone-export-manual-worker'),
    last_error = null,
    completed_at = null
  where public.processing_jobs.id = target_job_id
    and public.processing_jobs.job_type = 'export_generation'
    and public.processing_jobs.entity_type = 'export'
    and public.processing_jobs.status in ('queued', 'failed')
    and public.processing_jobs.attempt_count < greatest(max_attempts, 1)
  returning
    public.processing_jobs.id,
    public.processing_jobs.firm_id,
    public.processing_jobs.client_id,
    public.processing_jobs.entity_type,
    public.processing_jobs.entity_id,
    public.processing_jobs.attempt_count,
    public.processing_jobs.scheduled_at,
    public.processing_jobs.created_at;
end;
$$;

revoke all on function public.claim_export_generation_job(uuid, text, integer)
from public, anon, authenticated;

grant execute on function public.claim_export_generation_job(uuid, text, integer)
to service_role;
