create index if not exists clients_firm_status_created_at_idx
on public.clients (firm_id, status, created_at desc);

create index if not exists clients_firm_created_at_idx
on public.clients (firm_id, created_at desc);

create index if not exists whatsapp_messages_firm_status_received_at_idx
on public.whatsapp_messages (firm_id, processing_status, received_at desc);

create index if not exists whatsapp_messages_firm_received_at_idx
on public.whatsapp_messages (firm_id, received_at desc);

create index if not exists transactions_firm_status_created_at_idx
on public.transactions (firm_id, status, created_at desc);

create index if not exists transactions_firm_client_status_created_at_idx
on public.transactions (firm_id, client_id, status, created_at desc);

create index if not exists ledger_entries_firm_entry_created_at_idx
on public.ledger_entries (firm_id, entry_date desc, created_at desc);

create index if not exists ledger_entries_firm_client_entry_date_idx
on public.ledger_entries (firm_id, client_id, entry_date desc);

create index if not exists gst_periods_firm_status_period_start_idx
on public.gst_periods (firm_id, status, period_start desc);

create index if not exists exports_firm_status_created_at_idx
on public.exports (firm_id, status, created_at desc);

create index if not exists processing_jobs_firm_status_scheduled_at_idx
on public.processing_jobs (firm_id, status, scheduled_at desc);

create index if not exists audit_logs_firm_created_at_idx
on public.audit_logs (firm_id, created_at desc);
