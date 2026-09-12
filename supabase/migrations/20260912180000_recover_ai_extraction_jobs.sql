create or replace function public.claim_ai_extraction_jobs(
  batch_size integer default 5,
  worker_id text default 'khataone-worker'
)
returns table(id uuid,firm_id uuid,client_id uuid,entity_type text,entity_id uuid,
  attempt_count integer,scheduled_at timestamptz,created_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.processing_jobs as exhausted
  set status='failed',locked_at=null,locked_by=null,completed_at=now(),
    last_error=coalesce(exhausted.last_error,'Retry limit reached after an abandoned processing lease.')
  where exhausted.job_type='ai_extraction' and exhausted.entity_type='document'
    and exhausted.status='processing' and exhausted.attempt_count >= 3
    and ((exhausted.locked_at is not null and exhausted.locked_at < now()-interval '10 minutes')
      or (exhausted.locked_at is null and exhausted.updated_at < now()-interval '10 minutes'));

  return query
  with candidates as (
    select processing_jobs.id from public.processing_jobs
    where processing_jobs.job_type='ai_extraction'
      and processing_jobs.entity_type='document'
      and processing_jobs.scheduled_at <= now()
      and processing_jobs.attempt_count < 3
      and (processing_jobs.status='queued' or (
        processing_jobs.status='processing' and (
          (processing_jobs.locked_at is not null and processing_jobs.locked_at < now()-interval '10 minutes')
          or (processing_jobs.locked_at is null and processing_jobs.updated_at < now()-interval '10 minutes')
        )
      ))
    order by processing_jobs.scheduled_at,processing_jobs.created_at
    limit greatest(least(coalesce(batch_size,5),20),1)
    for update skip locked
  )
  update public.processing_jobs set status='processing',
    attempt_count=public.processing_jobs.attempt_count+1,locked_at=now(),
    locked_by=coalesce(nullif(worker_id,''),'khataone-worker'),last_error=null,completed_at=null
  from candidates where public.processing_jobs.id=candidates.id
  returning public.processing_jobs.id,public.processing_jobs.firm_id,
    public.processing_jobs.client_id,public.processing_jobs.entity_type,
    public.processing_jobs.entity_id,public.processing_jobs.attempt_count,
    public.processing_jobs.scheduled_at,public.processing_jobs.created_at;
end; $$;

create or replace function public.claim_ai_extraction_job(
  target_job_id uuid,
  worker_id text default 'khataone-manual-worker'
)
returns table(id uuid,firm_id uuid,client_id uuid,entity_type text,entity_id uuid,
  attempt_count integer,scheduled_at timestamptz,created_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return query
  update public.processing_jobs set status='processing',
    attempt_count=public.processing_jobs.attempt_count+1,locked_at=now(),
    locked_by=coalesce(nullif(worker_id,''),'khataone-manual-worker'),last_error=null,completed_at=null
  where public.processing_jobs.id=target_job_id
    and public.processing_jobs.job_type='ai_extraction'
    and public.processing_jobs.entity_type='document'
    and public.processing_jobs.scheduled_at <= now()
    and public.processing_jobs.attempt_count < 3
    and (public.processing_jobs.status in ('queued','failed') or (
      public.processing_jobs.status='processing' and (
        (public.processing_jobs.locked_at is not null and public.processing_jobs.locked_at < now()-interval '10 minutes')
        or (public.processing_jobs.locked_at is null and public.processing_jobs.updated_at < now()-interval '10 minutes')
      )
    ))
  returning public.processing_jobs.id,public.processing_jobs.firm_id,
    public.processing_jobs.client_id,public.processing_jobs.entity_type,
    public.processing_jobs.entity_id,public.processing_jobs.attempt_count,
    public.processing_jobs.scheduled_at,public.processing_jobs.created_at;
end; $$;

revoke all on function public.claim_ai_extraction_jobs(integer,text) from public,anon,authenticated;
grant execute on function public.claim_ai_extraction_jobs(integer,text) to service_role;
revoke all on function public.claim_ai_extraction_job(uuid,text) from public,anon,authenticated;
grant execute on function public.claim_ai_extraction_job(uuid,text) to service_role;

comment on function public.claim_ai_extraction_jobs(integer,text) is
'Claims queued AI extraction work and reclaims leases abandoned for ten minutes, with a maximum of three attempts. Failed jobs remain manual until classified as retryable.';
