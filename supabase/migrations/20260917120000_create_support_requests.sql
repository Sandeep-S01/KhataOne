create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  category text not null check (category in ('access', 'whatsapp', 'review', 'accounting', 'performance', 'other')),
  subject text not null check (char_length(subject) between 5 and 120),
  description text not null check (char_length(description) between 20 and 4000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_requester_created_idx
  on public.support_requests (firm_id, created_by, created_at desc);

alter table public.support_requests enable row level security;

revoke all on public.support_requests from anon, authenticated;
grant select on public.support_requests to authenticated;
grant insert (firm_id, created_by, category, subject, description)
  on public.support_requests to authenticated;

drop policy if exists "Requesters can read their support requests" on public.support_requests;
create policy "Requesters can read their support requests"
on public.support_requests for select to authenticated
using (created_by = auth.uid() and public.is_firm_member(firm_id));

drop policy if exists "Firm members can submit support requests" on public.support_requests;
create policy "Firm members can submit support requests"
on public.support_requests for insert to authenticated
with check (
  created_by = auth.uid()
  and status = 'open'
  and public.is_firm_member(firm_id)
);

drop trigger if exists support_requests_set_updated_at on public.support_requests;
create trigger support_requests_set_updated_at
before update on public.support_requests
for each row execute function public.set_updated_at();
