-- Read-only metadata and aggregate checks. Run before considering migration apply.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('exports', 'documents', 'processing_jobs')
order by tablename, policyname;

select event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('exports', 'documents', 'processing_jobs');

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('exports', 'documents', 'processing_jobs')
  and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC');

select 'export_client_mismatch' as check_name, count(*) as affected
from public.exports e left join public.clients c on c.id = e.client_id
where e.client_id is not null and (c.id is null or c.firm_id <> e.firm_id)
union all
select 'export_period_mismatch', count(*)
from public.exports e left join public.gst_periods p on p.id = e.gst_period_id
where e.gst_period_id is not null and
  (p.id is null or p.firm_id <> e.firm_id or (e.client_id is not null and e.client_id <> p.client_id))
union all
select 'document_client_mismatch', count(*)
from public.documents d left join public.clients c on c.id = d.client_id
where c.id is null or c.firm_id <> d.firm_id
union all
select 'ai_job_owner_mismatch', count(*)
from public.processing_jobs j left join public.documents d on d.id = j.entity_id
where j.job_type = 'ai_extraction' and
  (j.entity_type <> 'document' or d.id is null or d.firm_id <> j.firm_id
    or d.client_id is distinct from j.client_id)
union all
select 'export_job_owner_mismatch', count(*)
from public.processing_jobs j left join public.exports e on e.id = j.entity_id
where j.job_type = 'export_generation' and
  (j.entity_type <> 'export' or e.id is null or e.firm_id <> j.firm_id
    or e.client_id is distinct from j.client_id);

select id, public from storage.buckets
where id in ('exports', 'whatsapp-media-raw', 'client-documents', 'generated-reports');
