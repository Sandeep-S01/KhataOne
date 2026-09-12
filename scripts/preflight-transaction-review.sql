-- Read-only. Investigate nonzero counts before applying transaction-review restrictions.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('transactions', 'audit_logs');

select event_object_schema, event_object_table, trigger_name, action_timing,
  event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public' and event_object_table = 'transactions';

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('update_transaction_review', 'decide_transaction_review',
    'request_transaction_clarification', 'record_transaction_clarification_delivery');

select count(*) as inconsistent_transaction_client_ownership
from public.transactions t
left join public.clients c on c.id = t.client_id
where c.id is null or c.firm_id is distinct from t.firm_id;

select count(*) as approved_without_complete_approval_metadata
from public.transactions
where status = 'approved' and (approved_by is null or approved_at is null);

select count(*) as nonapproved_with_approval_metadata
from public.transactions
where status <> 'approved' and (approved_by is not null or approved_at is not null);
