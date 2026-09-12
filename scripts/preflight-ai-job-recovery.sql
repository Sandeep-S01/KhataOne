-- Read-only queue inventory. Investigate counts before enabling stale-lease recovery.
select routine_name,grantee,privilege_type
from information_schema.routine_privileges
where routine_schema='public'
  and routine_name in ('claim_ai_extraction_jobs','claim_ai_extraction_job');

select status,count(*) as jobs,min(created_at) as oldest_created_at
from public.processing_jobs
where job_type='ai_extraction' and entity_type='document'
group by status order by status;

select count(*) as stale_retryable_processing_jobs
from public.processing_jobs
where job_type='ai_extraction' and entity_type='document' and status='processing'
  and attempt_count < 3
  and ((locked_at is not null and locked_at < now()-interval '10 minutes')
    or (locked_at is null and updated_at < now()-interval '10 minutes'));

select count(*) as stale_exhausted_processing_jobs
from public.processing_jobs
where job_type='ai_extraction' and entity_type='document' and status='processing'
  and attempt_count >= 3
  and ((locked_at is not null and locked_at < now()-interval '10 minutes')
    or (locked_at is null and updated_at < now()-interval '10 minutes'));

select count(*) as failed_jobs_available_for_manual_retry
from public.processing_jobs
where job_type='ai_extraction' and entity_type='document' and status='failed'
  and attempt_count < 3 and scheduled_at <= now();
