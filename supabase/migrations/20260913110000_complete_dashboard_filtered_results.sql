create or replace function public.search_review_queue(
  target_firm_id uuid,
  target_client_id uuid default null,
  target_status text default null,
  target_risk text default null,
  target_document_type text default null,
  target_from date default null,
  target_to date default null,
  target_search text default null,
  page_limit integer default 51,
  page_offset integer default 0
)
returns table (
  id uuid,
  client_id uuid,
  transaction_type text,
  status text,
  transaction_date date,
  party_name text,
  invoice_number text,
  total_amount numeric,
  confidence_score numeric,
  created_at timestamptz,
  client_business_name text,
  document_type text,
  document_file_name text,
  risk_flags text[],
  extraction_model text
)
language sql
stable
as $$
  select
    t.id,
    t.client_id,
    t.transaction_type,
    t.status,
    t.transaction_date,
    t.party_name,
    t.invoice_number,
    t.total_amount,
    t.confidence_score,
    t.created_at,
    c.business_name as client_business_name,
    d.document_type,
    d.file_name as document_file_name,
    coalesce(a.risk_flags, '{}') as risk_flags,
    a.model as extraction_model
  from public.transactions t
  join public.clients c
    on c.id = t.client_id
   and c.firm_id = t.firm_id
  left join public.documents d
    on d.id = t.document_id
   and d.firm_id = t.firm_id
  left join public.ai_extractions a
    on a.id = t.ai_extraction_id
   and a.firm_id = t.firm_id
  where t.firm_id = target_firm_id
    and public.is_firm_member(target_firm_id)
    and t.status in ('draft', 'needs_review', 'duplicate')
    and (target_client_id is null or t.client_id = target_client_id)
    and (target_status is null or t.status = target_status)
    and (target_from is null or t.transaction_date >= target_from)
    and (target_to is null or t.transaction_date <= target_to)
    and (target_document_type is null or d.document_type = target_document_type)
    and (
      target_risk is null
      or (target_risk = 'risk' and cardinality(coalesce(a.risk_flags, '{}')) > 0)
      or (target_risk = 'low_confidence' and t.confidence_score < 0.7)
    )
    and (
      target_search is null
      or position(
        target_search in lower(concat_ws(
          ' ',
          c.business_name,
          d.file_name,
          d.document_type,
          t.party_name,
          t.invoice_number,
          t.transaction_type
        ))
      ) > 0
    )
  order by t.created_at desc, t.id desc
  limit greatest(1, least(page_limit, 101))
  offset greatest(0, page_offset);
$$;

create or replace function public.search_whatsapp_inbox(
  target_firm_id uuid,
  target_status text default null,
  target_search text default null,
  page_limit integer default 51,
  page_offset integer default 0
)
returns table (
  id uuid,
  client_id uuid,
  sender_phone text,
  message_type text,
  processing_status text,
  received_at timestamptz,
  client_business_name text
)
language sql
stable
as $$
  select
    m.id,
    m.client_id,
    m.sender_phone,
    m.message_type,
    m.processing_status,
    m.received_at,
    c.business_name as client_business_name
  from public.whatsapp_messages m
  left join public.clients c
    on c.id = m.client_id
   and c.firm_id = m.firm_id
  where m.firm_id = target_firm_id
    and public.is_firm_member(target_firm_id)
    and (target_status is null or m.processing_status = target_status)
    and (
      target_search is null
      or position(
        target_search in lower(concat_ws(
          ' ',
          c.business_name,
          m.sender_phone,
          m.message_type
        ))
      ) > 0
    )
  order by m.received_at desc, m.id desc
  limit greatest(1, least(page_limit, 101))
  offset greatest(0, page_offset);
$$;

revoke all on function public.search_review_queue(uuid, uuid, text, text, text, date, date, text, integer, integer) from public;
revoke all on function public.search_whatsapp_inbox(uuid, text, text, integer, integer) from public;

grant execute on function public.search_review_queue(uuid, uuid, text, text, text, date, date, text, integer, integer) to authenticated;
grant execute on function public.search_whatsapp_inbox(uuid, text, text, integer, integer) to authenticated;
