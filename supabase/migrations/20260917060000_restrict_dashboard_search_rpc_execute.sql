-- Supabase grants routine execution directly to anon by default. Revoking
-- PUBLIC alone does not remove that explicit grant from the search RPCs.
revoke all on function public.search_review_queue(uuid, uuid, text, text, text, date, date, text, integer, integer) from public, anon;
revoke all on function public.search_whatsapp_inbox(uuid, text, text, integer, integer) from public, anon;

grant execute on function public.search_review_queue(uuid, uuid, text, text, text, date, date, text, integer, integer) to authenticated;
grant execute on function public.search_whatsapp_inbox(uuid, text, text, integer, integer) to authenticated;
