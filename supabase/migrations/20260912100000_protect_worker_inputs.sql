-- Browser writes must not forge artifacts or repoint privileged worker inputs.
-- Restrictive policies also constrain any existing permissive policies.
create policy "Export requests require owned inputs"
on public.exports as restrictive for insert to authenticated
with check (
  public.has_firm_role(firm_id, array['owner', 'admin', 'staff'])
  and requested_by = auth.uid()
  and created_at = now()
  and status = 'queued' and storage_path is null and completed_at is null
  and export_type in ('csv_transactions', 'gst_summary', 'pdf_summary')
  and (client_id is null or exists (
    select 1 from public.clients c
    where c.id = exports.client_id and c.firm_id = exports.firm_id
  ))
  and (
    (export_type = 'csv_transactions' and client_id is not null and gst_period_id is null)
    or (export_type in ('gst_summary', 'pdf_summary') and exists (
      select 1 from public.gst_periods p
      where p.id = exports.gst_period_id and p.firm_id = exports.firm_id
        and (exports.client_id is null or p.client_id = exports.client_id)
    ))
  )
);

create or replace function public.guard_export_browser_update()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('authenticated', 'anon') then
    -- Preserve createExportAction's enqueue-failure compensation, nothing else.
    if old.status <> 'queued' or new.status <> 'failed'
      or (to_jsonb(new) - array['status', 'metadata', 'updated_at'])
         is distinct from (to_jsonb(old) - array['status', 'metadata', 'updated_at']) then
      raise exception 'Export artifacts and request inputs are worker-managed.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger exports_guard_browser_update
before update on public.exports
for each row execute function public.guard_export_browser_update();

create policy "Export artifacts cannot be deleted by browsers"
on public.exports as restrictive for delete to authenticated, anon using (false);

create policy "Document originals are worker-managed on insert"
on public.documents as restrictive for insert to authenticated, anon with check (false);
create policy "Document originals are worker-managed on update"
on public.documents as restrictive for update to authenticated, anon using (false) with check (false);
create policy "Document originals are retained"
on public.documents as restrictive for delete to authenticated, anon using (false);

create policy "Job requests require owned entities"
on public.processing_jobs as restrictive for insert to authenticated
with check (
  public.has_firm_role(firm_id, array['owner', 'admin', 'staff'])
  and status = 'queued' and attempt_count = 0
  and locked_at is null and locked_by is null
  and completed_at is null and last_error is null
  and (
    (job_type = 'ai_extraction' and entity_type = 'document' and exists (
      select 1 from public.documents d
      where d.id = processing_jobs.entity_id and d.firm_id = processing_jobs.firm_id
        and d.client_id is not distinct from processing_jobs.client_id
    ))
    or (job_type = 'export_generation' and entity_type = 'export' and exists (
      select 1 from public.exports e
      where e.id = processing_jobs.entity_id and e.firm_id = processing_jobs.firm_id
        and e.client_id is not distinct from processing_jobs.client_id
        and e.status = 'queued'
    ))
  )
);
create policy "Job state is worker-managed"
on public.processing_jobs as restrictive for update to authenticated, anon using (false) with check (false);
create policy "Job history is retained"
on public.processing_jobs as restrictive for delete to authenticated, anon using (false);
