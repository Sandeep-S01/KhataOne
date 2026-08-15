create table if not exists public.whatsapp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_message_id text not null,
  provider_event_id text,
  provider_change_id text,
  raw_payload jsonb not null,
  message_payload jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'unmatched', 'ignored')),
  attempt_count integer not null default 0,
  scheduled_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  processed_at timestamptz,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  firm_id uuid references public.firms(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  whatsapp_message_id uuid references public.whatsapp_messages(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  processing_job_id uuid references public.processing_jobs(id) on delete set null,
  ack_status text not null default 'not_sent' check (ack_status in ('not_sent', 'sending', 'sent', 'failed')),
  ack_attempt_count integer not null default 0,
  ack_last_attempt_at timestamptz,
  ack_last_error text,
  ack_sent_at timestamptz,
  ack_provider_message_id text
);

alter table public.whatsapp_webhook_events enable row level security;

create unique index if not exists whatsapp_webhook_events_provider_message_id_idx
on public.whatsapp_webhook_events (provider_message_id);

create index if not exists whatsapp_webhook_events_status_scheduled_idx
on public.whatsapp_webhook_events (status, scheduled_at, created_at);

create index if not exists whatsapp_webhook_events_processing_stale_idx
on public.whatsapp_webhook_events (status, locked_at)
where status = 'processing';

create index if not exists whatsapp_webhook_events_firm_id_idx
on public.whatsapp_webhook_events (firm_id)
where firm_id is not null;

create index if not exists whatsapp_webhook_events_client_id_idx
on public.whatsapp_webhook_events (client_id)
where client_id is not null;

create index if not exists whatsapp_webhook_events_whatsapp_message_id_idx
on public.whatsapp_webhook_events (whatsapp_message_id)
where whatsapp_message_id is not null;

create index if not exists whatsapp_webhook_events_document_id_idx
on public.whatsapp_webhook_events (document_id)
where document_id is not null;

drop policy if exists "Firm members can read matched WhatsApp webhook events" on public.whatsapp_webhook_events;
create policy "Firm members can read matched WhatsApp webhook events"
on public.whatsapp_webhook_events for select
to authenticated
using (firm_id is not null and public.is_firm_member(firm_id));

drop trigger if exists whatsapp_webhook_events_set_updated_at on public.whatsapp_webhook_events;
create trigger whatsapp_webhook_events_set_updated_at
before update on public.whatsapp_webhook_events
for each row execute function public.set_updated_at();

do $$
begin
  if exists (
    select 1
    from public.documents
    where whatsapp_message_id is not null
    group by whatsapp_message_id
    having count(*) > 1
  ) then
    raise exception 'Cannot add documents_whatsapp_message_unique_idx because duplicate whatsapp_message_id values exist.';
  end if;
end;
$$;

create unique index if not exists documents_whatsapp_message_unique_idx
on public.documents (whatsapp_message_id)
where whatsapp_message_id is not null;

do $$
begin
  if exists (
    select 1
    from public.processing_jobs
    where job_type = 'ai_extraction'
      and entity_type = 'document'
    group by job_type, entity_type, entity_id
    having count(*) > 1
  ) then
    raise exception 'Cannot add processing_jobs_ai_document_unique_idx because duplicate AI extraction document jobs exist.';
  end if;
end;
$$;

create unique index if not exists processing_jobs_ai_document_unique_idx
on public.processing_jobs (job_type, entity_type, entity_id)
where job_type = 'ai_extraction' and entity_type = 'document';

create or replace function public.claim_whatsapp_webhook_events(
  batch_size integer default 10,
  worker_id text default 'khataone-whatsapp-worker',
  stale_after interval default interval '10 minutes',
  max_attempts integer default 3
)
returns table (
  id uuid,
  provider_message_id text,
  raw_payload jsonb,
  message_payload jsonb,
  status text,
  attempt_count integer,
  ack_status text,
  ack_attempt_count integer,
  locked_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select whatsapp_webhook_events.id
    from public.whatsapp_webhook_events
    where whatsapp_webhook_events.scheduled_at <= now()
      and whatsapp_webhook_events.attempt_count < greatest(max_attempts, 1)
      and (
        whatsapp_webhook_events.status = 'queued'
        or (
          whatsapp_webhook_events.status = 'failed'
          and whatsapp_webhook_events.attempt_count < greatest(max_attempts, 1)
        )
        or (
          whatsapp_webhook_events.status = 'processing'
          and whatsapp_webhook_events.locked_at is not null
          and whatsapp_webhook_events.locked_at < now() - coalesce(stale_after, interval '10 minutes')
        )
      )
    order by whatsapp_webhook_events.scheduled_at asc, whatsapp_webhook_events.created_at asc
    limit greatest(least(batch_size, 50), 1)
    for update skip locked
  )
  update public.whatsapp_webhook_events
  set
    status = 'processing',
    attempt_count = public.whatsapp_webhook_events.attempt_count + 1,
    locked_at = now(),
    locked_by = coalesce(worker_id, 'khataone-whatsapp-worker'),
    last_error = null,
    processed_at = null
  from candidates
  where public.whatsapp_webhook_events.id = candidates.id
  returning
    public.whatsapp_webhook_events.id,
    public.whatsapp_webhook_events.provider_message_id,
    public.whatsapp_webhook_events.raw_payload,
    public.whatsapp_webhook_events.message_payload,
    public.whatsapp_webhook_events.status,
    public.whatsapp_webhook_events.attempt_count,
    public.whatsapp_webhook_events.ack_status,
    public.whatsapp_webhook_events.ack_attempt_count,
    public.whatsapp_webhook_events.locked_at,
    public.whatsapp_webhook_events.created_at;
end;
$$;

revoke all on function public.claim_whatsapp_webhook_events(integer, text, interval, integer)
from public, anon, authenticated;

grant execute on function public.claim_whatsapp_webhook_events(integer, text, interval, integer)
to service_role;
