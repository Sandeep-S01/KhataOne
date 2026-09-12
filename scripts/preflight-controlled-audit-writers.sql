-- Read-only. Resolve incompatible policies and ownership anomalies before staging.
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies
where schemaname='public'
  and tablename in ('clients','exports','processing_jobs','audit_logs');

select routine_name,grantee,privilege_type
from information_schema.routine_privileges
where routine_schema='public' and routine_name in (
  'create_dashboard_client','update_dashboard_client','archive_dashboard_client',
  'queue_dashboard_export','request_manual_job_run'
);

select count(*) as export_jobs_with_inconsistent_ownership
from public.processing_jobs j
join public.exports e on j.entity_type='export' and j.entity_id=e.id
where j.job_type='export_generation'
  and (j.firm_id is distinct from e.firm_id or j.client_id is distinct from e.client_id);

select count(*) as document_jobs_with_inconsistent_ownership
from public.processing_jobs j
join public.documents d on j.entity_type='document' and j.entity_id=d.id
where j.job_type='ai_extraction'
  and (j.firm_id is distinct from d.firm_id or j.client_id is distinct from d.client_id);

select count(*) as queued_exports_without_generation_job
from public.exports e left join public.processing_jobs j
  on j.job_type='export_generation' and j.entity_type='export' and j.entity_id=e.id
where e.status='queued' and j.id is null;

select count(*) as dashboard_audits_with_actor_firm_mismatch
from public.audit_logs a left join public.firm_users fu
  on fu.firm_id=a.firm_id and fu.user_id=a.actor_user_id and fu.status='active'
where a.actor_user_id is not null and fu.user_id is null
  and a.action in ('client.created','client.updated','client.archived','export.queued',
    'processing_job.manual_run_requested');
