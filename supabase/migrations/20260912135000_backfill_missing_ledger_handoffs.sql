-- Repair legacy approved transactions that never received their ledger handoff.
-- Approval actor/time remain unknown; do not invent historical approval metadata.
with inserted_handoffs as (
  insert into public.ledger_entries (
    firm_id,
    client_id,
    transaction_id,
    entry_date,
    account_name,
    debit_amount,
    credit_amount,
    narration
  )
  select
    t.firm_id,
    t.client_id,
    t.id,
    t.transaction_date,
    coalesce(
      nullif(t.category, ''),
      nullif(t.party_name, ''),
      t.transaction_type || ' review account'
    ),
    case
      when t.transaction_type in ('sales', 'receipt') then 0
      else coalesce(t.total_amount, 0)
    end,
    case
      when t.transaction_type in ('sales', 'receipt') then coalesce(t.total_amount, 0)
      else 0
    end,
    coalesce(
      nullif(t.description, ''),
      'Approved ' || t.transaction_type || ' transaction'
    )
  from public.transactions t
  where t.status = 'approved'
    and not exists (
      select 1
      from public.ledger_entries l
      where l.transaction_id = t.id
    )
  on conflict (transaction_id) do nothing
  returning id, firm_id, client_id, transaction_id
)
insert into public.audit_logs (
  firm_id,
  client_id,
  actor_user_id,
  action,
  entity_type,
  entity_id,
  before_data,
  after_data,
  metadata
)
select
  h.firm_id,
  h.client_id,
  null,
  'transaction.ledger_handoff_repaired',
  'transaction',
  h.transaction_id,
  to_jsonb(t),
  to_jsonb(t),
  jsonb_build_object(
    'ledger_entry_id', h.id,
    'approval_boundary', 'legacy_approved_handoff_backfill',
    'repair_actor', 'database_migration',
    'historical_approval_metadata', 'unavailable'
  )
from inserted_handoffs h
join public.transactions t on t.id = h.transaction_id;
