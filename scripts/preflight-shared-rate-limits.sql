-- Read-only preflight. Run before enabling RATE_LIMIT_SHARED_ENFORCEMENT=shared-store.
select to_regclass('public.rate_limit_buckets') as rate_limit_table;

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'consume_rate_limit'
order by grantee, privilege_type;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'rate_limit_buckets'
order by grantee, privilege_type;
