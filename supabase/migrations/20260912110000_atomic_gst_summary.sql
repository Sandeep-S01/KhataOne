create or replace function public.generate_gst_summary(
  target_firm_id uuid, target_client_id uuid,
  start_date date, end_date date, target_filing_type text
)
returns uuid language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  totals record;
  period_id uuid;
  readiness text;
  before_summary jsonb;
  stored_summary public.gst_summaries%rowtype;
begin
  if auth.uid() is null or not public.has_firm_role(target_firm_id, array['owner','admin','staff']) then
    raise exception 'Not authorized to generate summaries.' using errcode = '42501';
  end if;
  if start_date is null or end_date is null or start_date > end_date
    or not isfinite(start_date) or not isfinite(end_date)
    or target_filing_type is null or target_filing_type not in ('monthly','quarterly','annual') then
    raise exception 'Invalid summary period.' using errcode = '22023';
  end if;
  -- Serialize regeneration for this client before taking the aggregate snapshot.
  perform 1 from public.clients where id = target_client_id and firm_id = target_firm_id for update;
  if not found then
    raise exception 'Client not found for this firm.' using errcode = '42501';
  end if;
  select
    count(*) filter (where status = 'approved') as approved_count,
    count(*) filter (where status in ('draft','needs_review','duplicate')) as unresolved_count,
    count(*) filter (where status = 'approved' and document_id is null) as missing_count,
    count(*) filter (where status = 'approved' and
      (coalesce(party_gstin, '') = '' or coalesce(cgst_amount,0)+coalesce(sgst_amount,0)+coalesce(igst_amount,0) = 0
        or coalesce(total_amount,0) = 0)) as mismatch_count,
    coalesce(sum(taxable_amount) filter (where status = 'approved' and transaction_type in ('sales','receipt')),0) as sales,
    coalesce(sum(taxable_amount) filter (where status = 'approved' and transaction_type in ('purchase','expense','payment')),0) as purchases,
    coalesce(sum(cgst_amount) filter (where status = 'approved' and transaction_type in ('sales','receipt')),0) as out_cgst,
    coalesce(sum(sgst_amount) filter (where status = 'approved' and transaction_type in ('sales','receipt')),0) as out_sgst,
    coalesce(sum(igst_amount) filter (where status = 'approved' and transaction_type in ('sales','receipt')),0) as out_igst,
    coalesce(sum(cgst_amount) filter (where status = 'approved' and transaction_type in ('purchase','expense','payment')),0) as in_cgst,
    coalesce(sum(sgst_amount) filter (where status = 'approved' and transaction_type in ('purchase','expense','payment')),0) as in_sgst,
    coalesce(sum(igst_amount) filter (where status = 'approved' and transaction_type in ('purchase','expense','payment')),0) as in_igst
  into totals from public.transactions
  where firm_id = target_firm_id and client_id = target_client_id
    and transaction_date between start_date and end_date;
  readiness := case when totals.missing_count > 0 then 'missing_documents'
    when totals.unresolved_count > 0 or totals.mismatch_count > 0 or totals.approved_count = 0 then 'needs_review'
    else 'ready' end;
  insert into public.gst_periods(firm_id,client_id,period_start,period_end,filing_type,status)
  values(target_firm_id,target_client_id,start_date,end_date,target_filing_type,readiness)
  on conflict(firm_id,client_id,period_start,period_end,filing_type)
  do update set status = excluded.status returning id into period_id;
  if exists (select 1 from public.gst_summaries s where s.gst_period_id = period_id
    and (s.firm_id <> target_firm_id or s.client_id <> target_client_id)) then
    raise exception 'Existing summary ownership must be reconciled.' using errcode = '42501';
  end if;
  select to_jsonb(s) into before_summary from public.gst_summaries s where gst_period_id = period_id;
  insert into public.gst_summaries(
    firm_id,client_id,gst_period_id,sales_taxable_amount,purchase_taxable_amount,
    output_cgst,output_sgst,output_igst,input_cgst,input_sgst,input_igst,
    net_tax_payable,mismatch_count,missing_document_count,generated_at
  ) values (
    target_firm_id,target_client_id,period_id,totals.sales,totals.purchases,
    totals.out_cgst,totals.out_sgst,totals.out_igst,totals.in_cgst,totals.in_sgst,totals.in_igst,
    totals.out_cgst+totals.out_sgst+totals.out_igst-totals.in_cgst-totals.in_sgst-totals.in_igst,
    totals.mismatch_count,totals.missing_count,now()
  ) on conflict(gst_period_id) do update set
    sales_taxable_amount = excluded.sales_taxable_amount, purchase_taxable_amount = excluded.purchase_taxable_amount,
    output_cgst = excluded.output_cgst, output_sgst = excluded.output_sgst, output_igst = excluded.output_igst,
    input_cgst = excluded.input_cgst, input_sgst = excluded.input_sgst, input_igst = excluded.input_igst,
    net_tax_payable = excluded.net_tax_payable, mismatch_count = excluded.mismatch_count,
    missing_document_count = excluded.missing_document_count, generated_at = excluded.generated_at
  returning * into stored_summary;
  insert into public.audit_logs(firm_id,client_id,actor_user_id,action,entity_type,entity_id,before_data,after_data,metadata)
  values(target_firm_id,target_client_id,auth.uid(),'gst_summary.generated','gst_period',period_id,
    before_summary, to_jsonb(stored_summary) || jsonb_build_object('approved_count',totals.approved_count,'unresolved_count',totals.unresolved_count),
    jsonb_build_object('direct_filing',false,'source','approved_transactions','boundary','generate_gst_summary'));
  return period_id;
end;
$$;
revoke all on function public.generate_gst_summary(uuid,uuid,date,date,text) from public, anon;
grant execute on function public.generate_gst_summary(uuid,uuid,date,date,text) to authenticated;

-- Read policies stay intact; only the authorized definer operation writes summaries.
create policy "GST periods require atomic generation insert" on public.gst_periods
as restrictive for insert to authenticated, anon with check (false);
create policy "GST periods require atomic generation update" on public.gst_periods
as restrictive for update to authenticated, anon using (false) with check (false);
create policy "GST periods retain history" on public.gst_periods
as restrictive for delete to authenticated, anon using (false);
create policy "GST summaries require atomic generation insert" on public.gst_summaries
as restrictive for insert to authenticated, anon with check (false);
create policy "GST summaries require atomic generation update" on public.gst_summaries
as restrictive for update to authenticated, anon using (false) with check (false);
create policy "GST summaries retain history" on public.gst_summaries
as restrictive for delete to authenticated, anon using (false);
