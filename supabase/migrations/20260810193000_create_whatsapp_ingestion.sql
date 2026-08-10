create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('whatsapp-media-raw', 'whatsapp-media-raw', false)
on conflict (id) do nothing;

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  provider_message_id text not null unique,
  sender_phone text not null,
  message_type text not null,
  raw_payload jsonb not null,
  received_at timestamptz not null default now(),
  processing_status text not null default 'received' check (processing_status in ('received', 'matched', 'unmatched', 'media_downloaded', 'media_failed', 'queued', 'ignored', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  whatsapp_message_id uuid references public.whatsapp_messages(id) on delete set null,
  document_type text not null check (document_type in ('purchase_invoice', 'sales_invoice', 'receipt', 'bank_statement', 'payment_proof', 'audio_note', 'text_note', 'unclear')),
  file_name text,
  file_mime_type text,
  storage_path text,
  source_text text,
  status text not null default 'received' check (status in ('received', 'media_downloaded', 'media_failed', 'queued', 'extracting', 'extracted', 'needs_review', 'failed')),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  job_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  attempt_count integer not null default 0,
  last_error text,
  scheduled_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_messages enable row level security;
alter table public.documents enable row level security;
alter table public.processing_jobs enable row level security;

create index if not exists whatsapp_messages_firm_id_idx on public.whatsapp_messages (firm_id);
create index if not exists whatsapp_messages_client_id_idx on public.whatsapp_messages (client_id);
create index if not exists whatsapp_messages_sender_phone_idx on public.whatsapp_messages (sender_phone);
create index if not exists whatsapp_messages_received_at_idx on public.whatsapp_messages (received_at desc);
create index if not exists whatsapp_messages_processing_status_idx on public.whatsapp_messages (processing_status);

create index if not exists documents_firm_id_idx on public.documents (firm_id);
create index if not exists documents_client_id_idx on public.documents (client_id);
create index if not exists documents_whatsapp_message_id_idx on public.documents (whatsapp_message_id);
create index if not exists documents_status_idx on public.documents (status);
create index if not exists documents_received_at_idx on public.documents (received_at desc);

create index if not exists processing_jobs_firm_id_idx on public.processing_jobs (firm_id);
create index if not exists processing_jobs_client_id_idx on public.processing_jobs (client_id);
create index if not exists processing_jobs_entity_idx on public.processing_jobs (entity_type, entity_id);
create index if not exists processing_jobs_status_idx on public.processing_jobs (status);
create index if not exists processing_jobs_scheduled_at_idx on public.processing_jobs (scheduled_at);

drop policy if exists "Firm members can read WhatsApp messages" on public.whatsapp_messages;
create policy "Firm members can read WhatsApp messages"
on public.whatsapp_messages for select
to authenticated
using (firm_id is not null and public.is_firm_member(firm_id));

drop policy if exists "Firm members can read documents" on public.documents;
create policy "Firm members can read documents"
on public.documents for select
to authenticated
using (public.is_firm_member(firm_id));

drop policy if exists "Firm staff can update documents" on public.documents;
create policy "Firm staff can update documents"
on public.documents for update
to authenticated
using (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']))
with check (public.has_firm_role(firm_id, array['owner', 'admin', 'staff']));

drop policy if exists "Firm members can read processing jobs" on public.processing_jobs;
create policy "Firm members can read processing jobs"
on public.processing_jobs for select
to authenticated
using (public.is_firm_member(firm_id));

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();
