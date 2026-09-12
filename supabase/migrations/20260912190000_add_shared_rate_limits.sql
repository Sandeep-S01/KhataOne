create table if not exists public.rate_limit_buckets (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint rate_limit_buckets_key_hash_check
    check (key_hash ~ '^[0-9a-f]{64}$')
);

alter table public.rate_limit_buckets enable row level security;

create index if not exists rate_limit_buckets_expires_at_idx
  on public.rate_limit_buckets (expires_at);

revoke all on table public.rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on table public.rate_limit_buckets to service_role;

create or replace function public.consume_rate_limit(
  target_key_hash text,
  target_limit integer,
  target_window_seconds integer
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  request_timestamp timestamptz := clock_timestamp();
  current_window timestamptz;
begin
  if target_key_hash is null or target_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate-limit key.' using errcode = '22023';
  end if;

  if target_limit is null or target_limit < 1 or target_limit > 10000 then
    raise exception 'Invalid rate-limit threshold.' using errcode = '22023';
  end if;

  if target_window_seconds is null
    or target_window_seconds < 1
    or target_window_seconds > 86400 then
    raise exception 'Invalid rate-limit window.' using errcode = '22023';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from request_timestamp) / target_window_seconds)
      * target_window_seconds
  );

  with expired as (
    select bucket.key_hash
    from public.rate_limit_buckets as bucket
    where bucket.expires_at < request_timestamp - interval '1 day'
    order by bucket.expires_at
    limit 25
    for update skip locked
  )
  delete from public.rate_limit_buckets as bucket
  using expired
  where bucket.key_hash = expired.key_hash;

  return query
  with consumed as (
    insert into public.rate_limit_buckets as bucket (
      key_hash,
      window_started_at,
      request_count,
      expires_at,
      updated_at
    ) values (
      target_key_hash,
      current_window,
      1,
      current_window + make_interval(secs => target_window_seconds),
      request_timestamp
    )
    on conflict (key_hash) do update
    set
      window_started_at = case
        when bucket.window_started_at = excluded.window_started_at
        then bucket.window_started_at
        else excluded.window_started_at
      end,
      request_count = case
        when bucket.window_started_at = excluded.window_started_at
        then bucket.request_count + 1
        else 1
      end,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at
    returning request_count, expires_at
  )
  select
    consumed.request_count <= target_limit,
    greatest(target_limit - consumed.request_count, 0),
    consumed.expires_at
  from consumed;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;

comment on table public.rate_limit_buckets is
'Infrastructure-owned fixed-window counters. Keys are server-generated HMAC-SHA-256 digests and browser roles have no access.';

comment on function public.consume_rate_limit(text, integer, integer) is
'Atomically consumes one request from a shared fixed-window rate-limit bucket for service-role callers.';
