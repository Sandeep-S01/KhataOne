create extension if not exists pg_trgm with schema extensions;

create index if not exists clients_firm_status_created_id_idx
on public.clients (firm_id, status, created_at desc, id desc);

create index if not exists clients_firm_created_id_idx
on public.clients (firm_id, created_at desc, id desc);

create index if not exists whatsapp_messages_firm_status_received_id_idx
on public.whatsapp_messages (firm_id, processing_status, received_at desc, id desc);

create index if not exists whatsapp_messages_firm_received_id_idx
on public.whatsapp_messages (firm_id, received_at desc, id desc);

create index if not exists transactions_firm_status_created_id_idx
on public.transactions (firm_id, status, created_at desc, id desc);

create index if not exists transactions_firm_client_status_created_id_idx
on public.transactions (firm_id, client_id, status, created_at desc, id desc);

create index if not exists ledger_entries_firm_entry_created_id_idx
on public.ledger_entries (firm_id, entry_date desc, created_at desc, id desc);

create index if not exists clients_search_trgm_idx
on public.clients
using gin ((
  coalesce(business_name, '') || ' ' ||
  coalesce(contact_name, '') || ' ' ||
  coalesce(phone, '') || ' ' ||
  coalesce(whatsapp_phone, '') || ' ' ||
  coalesce(gstin, '') || ' ' ||
  coalesce(state_code, '')
) extensions.gin_trgm_ops);

create index if not exists whatsapp_messages_search_trgm_idx
on public.whatsapp_messages
using gin ((
  coalesce(sender_phone, '') || ' ' ||
  coalesce(message_type, '')
) extensions.gin_trgm_ops);

create index if not exists documents_search_trgm_idx
on public.documents
using gin ((
  coalesce(file_name, '') || ' ' ||
  coalesce(document_type, '')
) extensions.gin_trgm_ops);

create index if not exists transactions_review_search_trgm_idx
on public.transactions
using gin ((
  coalesce(party_name, '') || ' ' ||
  coalesce(invoice_number, '') || ' ' ||
  coalesce(transaction_type, '')
) extensions.gin_trgm_ops);

create index if not exists ai_extractions_risk_flags_gin_idx
on public.ai_extractions using gin (risk_flags);
