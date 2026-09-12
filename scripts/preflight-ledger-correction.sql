-- Read-only. Investigate mismatches without modifying or deleting financial history.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename in ('ledger_entries','transactions','audit_logs');

select count(*) as inconsistent_ledger_ownership
from public.ledger_entries l
left join public.transactions t on t.id = l.transaction_id
left join public.clients c on c.id = l.client_id
where t.id is null or c.id is null or t.firm_id is distinct from l.firm_id
  or t.client_id is distinct from l.client_id or c.firm_id is distinct from l.firm_id;

select count(*) as handoffs_with_nonapproved_source
from public.ledger_entries l join public.transactions t on t.id = l.transaction_id
where t.status not in ('approved','exported');

select count(*) as approved_transactions_without_handoff
from public.transactions t
left join public.ledger_entries l on l.transaction_id = t.id
where t.status = 'approved' and l.id is null;

select routine_name, grantee, privilege_type from information_schema.routine_privileges
where routine_schema = 'public' and routine_name in ('correct_ledger_entry','approve_transaction_with_handoff');

select event_object_schema, event_object_table, trigger_name, action_timing,
  event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and trigger_name = 'protect_posted_transaction_browser_mutation';
