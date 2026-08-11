alter table public.processing_jobs
add column if not exists locked_at timestamptz,
add column if not exists locked_by text,
add column if not exists updated_at timestamptz not null default now();

create index if not exists processing_jobs_ai_queue_idx
on public.processing_jobs (job_type, status, scheduled_at, created_at)
where job_type = 'ai_extraction';

drop trigger if exists processing_jobs_set_updated_at on public.processing_jobs;
create trigger processing_jobs_set_updated_at
before update on public.processing_jobs
for each row execute function public.set_updated_at();

create or replace function public.claim_ai_extraction_jobs(
  batch_size integer default 5,
  worker_id text default 'khataone-worker'
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
set search_path = public
as $$
begin
  return query
  with candidates as (
    select processing_jobs.id
    from public.processing_jobs
    where processing_jobs.job_type = 'ai_extraction'
      and processing_jobs.entity_type = 'document'
      and processing_jobs.status = 'queued'
      and processing_jobs.scheduled_at <= now()
      and processing_jobs.attempt_count < 3
    order by processing_jobs.scheduled_at asc, processing_jobs.created_at asc
    limit greatest(least(batch_size, 20), 1)
    for update skip locked
  )
  update public.processing_jobs
  set
    status = 'processing',
    attempt_count = public.processing_jobs.attempt_count + 1,
    locked_at = now(),
    locked_by = coalesce(worker_id, 'khataone-worker'),
    last_error = null,
    completed_at = null
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

revoke all on function public.claim_ai_extraction_jobs(integer, text)
from public, anon, authenticated;

grant execute on function public.claim_ai_extraction_jobs(integer, text)
to service_role;

create or replace function public.claim_ai_extraction_job(
  target_job_id uuid,
  worker_id text default 'khataone-manual-worker'
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
set search_path = public
as $$
begin
  return query
  update public.processing_jobs
  set
    status = 'processing',
    attempt_count = public.processing_jobs.attempt_count + 1,
    locked_at = now(),
    locked_by = coalesce(worker_id, 'khataone-manual-worker'),
    last_error = null,
    completed_at = null
  where public.processing_jobs.id = target_job_id
    and public.processing_jobs.job_type = 'ai_extraction'
    and public.processing_jobs.entity_type = 'document'
    and public.processing_jobs.status in ('queued', 'failed')
    and public.processing_jobs.attempt_count < 3
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

revoke all on function public.claim_ai_extraction_job(uuid, text)
from public, anon, authenticated;

grant execute on function public.claim_ai_extraction_job(uuid, text)
to service_role;
