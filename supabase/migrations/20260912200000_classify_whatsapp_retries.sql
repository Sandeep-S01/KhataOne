-- Retryable failures are returned to queued with a future scheduled_at by the worker.
-- Failed events are terminal until an operator deliberately requeues them.
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
set search_path = public, pg_temp
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
          whatsapp_webhook_events.status = 'processing'
          and whatsapp_webhook_events.locked_at is not null
          and whatsapp_webhook_events.locked_at
            < now() - coalesce(stale_after, interval '10 minutes')
        )
      )
    order by whatsapp_webhook_events.scheduled_at, whatsapp_webhook_events.created_at
    limit greatest(least(batch_size, 50), 1)
    for update skip locked
  )
  update public.whatsapp_webhook_events
  set status = 'processing',
    attempt_count = public.whatsapp_webhook_events.attempt_count + 1,
    locked_at = now(),
    locked_by = coalesce(worker_id, 'khataone-whatsapp-worker'),
    last_error = null,
    processed_at = null
  from candidates
  where public.whatsapp_webhook_events.id = candidates.id
  returning public.whatsapp_webhook_events.id,
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

revoke all on function public.claim_whatsapp_webhook_events(integer,text,interval,integer)
  from public, anon, authenticated;
grant execute on function public.claim_whatsapp_webhook_events(integer,text,interval,integer)
  to service_role;

comment on function public.claim_whatsapp_webhook_events(integer,text,interval,integer) is
'Claims queued or stale WhatsApp events. Retryable failures must be explicitly rescheduled as queued; terminal failed events are not replayed automatically.';
