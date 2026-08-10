create extension if not exists "pgcrypto";

create table if not exists public.lead_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  firm_name text not null,
  email text not null,
  phone text not null,
  firm_size text,
  intent text not null check (intent in ('demo', 'waitlist', 'signup')),
  message text,
  source text not null default 'landing_page',
  user_agent text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lead_requests enable row level security;

create index if not exists lead_requests_created_at_idx on public.lead_requests (created_at desc);
create index if not exists lead_requests_status_idx on public.lead_requests (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lead_requests_set_updated_at on public.lead_requests;
create trigger lead_requests_set_updated_at
before update on public.lead_requests
for each row execute function public.set_updated_at();
