-- Read-only checks; do not repair historical financial records automatically.
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname='public' and tablename in ('gst_periods','gst_summaries','audit_logs');

select 'period_client_mismatch' as check_name,count(*) as affected
from public.gst_periods p left join public.clients c on c.id=p.client_id
where c.id is null or c.firm_id<>p.firm_id
union all
select 'summary_period_mismatch',count(*)
from public.gst_summaries s left join public.gst_periods p on p.id=s.gst_period_id
where p.id is null or p.firm_id<>s.firm_id or p.client_id<>s.client_id;

select table_name,column_name,data_type,numeric_precision,numeric_scale
from information_schema.columns where table_schema='public'
and table_name in ('transactions','gst_summaries','audit_logs')
order by table_name,ordinal_position;
