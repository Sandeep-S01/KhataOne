create table if not exists public.worker_ordering_leases (
  queue_name text not null check (queue_name in ('whatsapp_ingestion', 'ai_extraction')),
  ordering_key text not null,
  owner_id uuid not null,
  locked_at timestamptz not null default now(),
  primary key (queue_name, ordering_key)
);

alter table public.worker_ordering_leases enable row level security;
revoke all on table public.worker_ordering_leases from public, anon, authenticated;
grant select, insert, update, delete on table public.worker_ordering_leases to service_role;

create index if not exists worker_ordering_leases_locked_at_idx
  on public.worker_ordering_leases (locked_at);

create or replace function public.release_worker_ordering_lease()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'processing' and new.status <> 'processing' then
    delete from public.worker_ordering_leases
    where queue_name = tg_argv[0] and owner_id = old.id;
  end if;
  return new;
end;
$$;

revoke all on function public.release_worker_ordering_lease()
  from public, anon, authenticated;

drop trigger if exists whatsapp_event_release_ordering_lease
  on public.whatsapp_webhook_events;
create trigger whatsapp_event_release_ordering_lease
after update of status on public.whatsapp_webhook_events
for each row execute function public.release_worker_ordering_lease('whatsapp_ingestion');

drop trigger if exists ai_job_release_ordering_lease on public.processing_jobs;
create trigger ai_job_release_ordering_lease
after update of status on public.processing_jobs
for each row execute function public.release_worker_ordering_lease('ai_extraction');

create or replace function public.claim_whatsapp_webhook_events(
  batch_size integer default 10,
  worker_id text default 'khataone-whatsapp-worker',
  stale_after interval default interval '10 minutes',
  max_attempts integer default 3
)
returns table (
  id uuid, provider_message_id text, raw_payload jsonb, message_payload jsonb,
  status text, attempt_count integer, ack_status text, ack_attempt_count integer,
  locked_at timestamptz, created_at timestamptz
)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return query
  with eligible as (
    select e.id, e.scheduled_at, e.created_at,
      coalesce(
        nullif(regexp_replace(coalesce(e.message_payload #>> '{message,from}', ''),
          '[^0-9]', '', 'g'), ''),
        e.provider_message_id
      ) as ordering_key
    from public.whatsapp_webhook_events e
    where e.scheduled_at <= now()
      and e.attempt_count < greatest(max_attempts, 1)
      and (
        e.status = 'queued'
        or (e.status = 'processing' and e.locked_at is not null
          and e.locked_at < now() - coalesce(stale_after, interval '10 minutes'))
      )
  ), ranked as (
    select eligible.*,
      row_number() over (
        partition by eligible.ordering_key
        order by eligible.scheduled_at, eligible.created_at
      ) as ordering_position
    from eligible
    where not exists (
      select 1
      from public.whatsapp_webhook_events active
      where active.id <> eligible.id and active.status = 'processing'
        and active.locked_at is not null
        and active.locked_at >= now() - coalesce(stale_after, interval '10 minutes')
        and coalesce(
          nullif(regexp_replace(coalesce(active.message_payload #>> '{message,from}', ''),
            '[^0-9]', '', 'g'), ''),
          active.provider_message_id
        ) = eligible.ordering_key
    )
  ), candidates as (
    select ranked.id, ranked.ordering_key
    from ranked
    join public.whatsapp_webhook_events claim_event on claim_event.id = ranked.id
    where ranked.ordering_position = 1
    order by ranked.scheduled_at, ranked.created_at
    limit greatest(least(coalesce(batch_size, 10), 50), 1)
    for update of claim_event skip locked
  ), leased as (
    insert into public.worker_ordering_leases as lease (
      queue_name, ordering_key, owner_id, locked_at
    )
    select 'whatsapp_ingestion', candidates.ordering_key, candidates.id, now()
    from candidates
    on conflict (queue_name, ordering_key) do update
      set owner_id = excluded.owner_id, locked_at = excluded.locked_at
      where lease.locked_at < now() - coalesce(stale_after, interval '10 minutes')
    returning owner_id
  )
  update public.whatsapp_webhook_events e
  set status = 'processing', attempt_count = e.attempt_count + 1,
    locked_at = now(), locked_by = coalesce(nullif(worker_id, ''), 'khataone-whatsapp-worker'),
    last_error = null, processed_at = null
  from leased
  where e.id = leased.owner_id
  returning e.id, e.provider_message_id, e.raw_payload, e.message_payload,
    e.status, e.attempt_count, e.ack_status, e.ack_attempt_count,
    e.locked_at, e.created_at;
end;
$$;

create or replace function public.claim_ai_extraction_jobs(
  batch_size integer default 5,
  worker_id text default 'khataone-worker'
)
returns table(id uuid,firm_id uuid,client_id uuid,entity_type text,entity_id uuid,
  attempt_count integer,scheduled_at timestamptz,created_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.processing_jobs exhausted
  set status = 'failed', locked_at = null, locked_by = null, completed_at = now(),
    last_error = coalesce(exhausted.last_error,
      'Retry limit reached after an abandoned processing lease.')
  where exhausted.job_type = 'ai_extraction' and exhausted.entity_type = 'document'
    and exhausted.status = 'processing' and exhausted.attempt_count >= 3
    and ((exhausted.locked_at is not null
      and exhausted.locked_at < now() - interval '10 minutes')
      or (exhausted.locked_at is null
        and exhausted.updated_at < now() - interval '10 minutes'));

  return query
  with eligible as (
    select j.id, j.scheduled_at, j.created_at,
      j.firm_id::text || ':' || coalesce(j.client_id::text, j.entity_id::text) as ordering_key
    from public.processing_jobs j
    where j.job_type = 'ai_extraction' and j.entity_type = 'document'
      and j.scheduled_at <= now() and j.attempt_count < 3
      and (j.status = 'queued' or (j.status = 'processing' and (
        (j.locked_at is not null and j.locked_at < now() - interval '10 minutes')
        or (j.locked_at is null and j.updated_at < now() - interval '10 minutes')
      )))
  ), ranked as (
    select eligible.*,
      row_number() over (
        partition by eligible.ordering_key
        order by eligible.scheduled_at, eligible.created_at
      ) as ordering_position
    from eligible
    where not exists (
      select 1 from public.processing_jobs active
      where active.id <> eligible.id and active.job_type = 'ai_extraction'
        and active.entity_type = 'document' and active.status = 'processing'
        and ((active.locked_at is not null
          and active.locked_at >= now() - interval '10 minutes')
          or (active.locked_at is null
            and active.updated_at >= now() - interval '10 minutes'))
        and active.firm_id::text || ':' ||
          coalesce(active.client_id::text, active.entity_id::text) = eligible.ordering_key
    )
  ), candidates as (
    select ranked.id, ranked.ordering_key
    from ranked
    join public.processing_jobs claim_job on claim_job.id = ranked.id
    where ranked.ordering_position = 1
    order by ranked.scheduled_at, ranked.created_at
    limit greatest(least(coalesce(batch_size, 5), 20), 1)
    for update of claim_job skip locked
  ), leased as (
    insert into public.worker_ordering_leases as lease (
      queue_name, ordering_key, owner_id, locked_at
    )
    select 'ai_extraction', candidates.ordering_key, candidates.id, now()
    from candidates
    on conflict (queue_name, ordering_key) do update
      set owner_id = excluded.owner_id, locked_at = excluded.locked_at
      where lease.locked_at < now() - interval '10 minutes'
    returning owner_id
  )
  update public.processing_jobs j
  set status = 'processing', attempt_count = j.attempt_count + 1,
    locked_at = now(), locked_by = coalesce(nullif(worker_id, ''), 'khataone-worker'),
    last_error = null, completed_at = null
  from leased where j.id = leased.owner_id
  returning j.id, j.firm_id, j.client_id, j.entity_type, j.entity_id,
    j.attempt_count, j.scheduled_at, j.created_at;
end;
$$;

create or replace function public.claim_ai_extraction_job(
  target_job_id uuid,
  worker_id text default 'khataone-manual-worker'
)
returns table(id uuid,firm_id uuid,client_id uuid,entity_type text,entity_id uuid,
  attempt_count integer,scheduled_at timestamptz,created_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return query
  with candidate as (
    select j.id,
      j.firm_id::text || ':' || coalesce(j.client_id::text, j.entity_id::text) as ordering_key
    from public.processing_jobs j
    where j.id = target_job_id and j.job_type = 'ai_extraction'
      and j.entity_type = 'document' and j.scheduled_at <= now()
      and j.attempt_count < 3 and (j.status in ('queued', 'failed')
        or (j.status = 'processing' and (
          (j.locked_at is not null and j.locked_at < now() - interval '10 minutes')
          or (j.locked_at is null and j.updated_at < now() - interval '10 minutes')
        )))
      and not exists (
        select 1 from public.processing_jobs active
        where active.id <> j.id and active.job_type = 'ai_extraction'
          and active.entity_type = 'document' and active.status = 'processing'
          and ((active.locked_at is not null
            and active.locked_at >= now() - interval '10 minutes')
            or (active.locked_at is null
              and active.updated_at >= now() - interval '10 minutes'))
          and active.firm_id = j.firm_id
          and coalesce(active.client_id, active.entity_id)
            = coalesce(j.client_id, j.entity_id)
      )
    for update skip locked
  ), leased as (
    insert into public.worker_ordering_leases as lease (
      queue_name, ordering_key, owner_id, locked_at
    )
    select 'ai_extraction', candidate.ordering_key, candidate.id, now()
    from candidate
    on conflict (queue_name, ordering_key) do update
      set owner_id = excluded.owner_id, locked_at = excluded.locked_at
      where lease.locked_at < now() - interval '10 minutes'
    returning owner_id
  )
  update public.processing_jobs j
  set status = 'processing', attempt_count = j.attempt_count + 1,
    locked_at = now(), locked_by = coalesce(nullif(worker_id, ''), 'khataone-manual-worker'),
    last_error = null, completed_at = null
  from leased where j.id = leased.owner_id
  returning j.id, j.firm_id, j.client_id, j.entity_type, j.entity_id,
    j.attempt_count, j.scheduled_at, j.created_at;
end;
$$;

revoke all on function public.claim_whatsapp_webhook_events(integer,text,interval,integer)
  from public, anon, authenticated;
grant execute on function public.claim_whatsapp_webhook_events(integer,text,interval,integer)
  to service_role;
revoke all on function public.claim_ai_extraction_jobs(integer,text)
  from public, anon, authenticated;
grant execute on function public.claim_ai_extraction_jobs(integer,text) to service_role;
revoke all on function public.claim_ai_extraction_job(uuid,text)
  from public, anon, authenticated;
grant execute on function public.claim_ai_extraction_job(uuid,text) to service_role;

comment on table public.worker_ordering_leases is
'Service-owned sender/client leases that prevent concurrent processing for one ordering key while allowing independent work to proceed.';
comment on function public.release_worker_ordering_lease() is
'Releases a worker ordering lease when its owning event or job leaves processing.';
comment on function public.claim_whatsapp_webhook_events(integer,text,interval,integer) is
'Claims due WhatsApp events with skip-locked row ownership and at most one active event per normalized sender.';
comment on function public.claim_ai_extraction_jobs(integer,text) is
'Claims due AI extraction jobs with skip-locked row ownership and at most one active job per firm client.';
comment on function public.claim_ai_extraction_job(uuid,text) is
'Claims one eligible AI extraction job only when its firm-client ordering key is available.';

revoke all on function public.claim_whatsapp_webhook_events(integer,text,interval,integer)
  from public, anon, authenticated;
grant execute on function public.claim_whatsapp_webhook_events(integer,text,interval,integer)
  to service_role;
revoke all on function public.claim_ai_extraction_jobs(integer,text)
  from public, anon, authenticated;
grant execute on function public.claim_ai_extraction_jobs(integer,text) to service_role;
revoke all on function public.claim_ai_extraction_job(uuid,text)
  from public, anon, authenticated;
grant execute on function public.claim_ai_extraction_job(uuid,text) to service_role;

comment on table public.worker_ordering_leases is
'Service-owned worker stream leases. They prevent concurrent processing for one WhatsApp sender or one firm/client AI stream and expire with abandoned worker leases.';
