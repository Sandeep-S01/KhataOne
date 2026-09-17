-- Read-only psql diagnostic, NOT a migration. See docs/Performance-Measurement.md.
-- Supply firm_id and user_id for an authorized workspace member.
-- Plan-only by default; analyze=true executes bounded SELECTs with RLS enabled.
\set ON_ERROR_STOP on
\pset pager off
\if :{?firm_id}
\else
  DO $$ BEGIN RAISE EXCEPTION 'Required psql variable: firm_id'; END $$;
\endif
\if :{?user_id}
\else
  DO $$ BEGIN RAISE EXCEPTION 'Required psql variable: user_id'; END $$;
\endif
\if :{?analyze}
\else
  \set analyze false
\endif
\if :{?search_term}
\else
  \set search_term 'sample'
\endif
\if :{?page_offset}
\else
  \set page_offset 50
\endif

BEGIN READ ONLY;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';
SET LOCAL ROLE authenticated;
SET LOCAL row_security = on;
-- Quote all supplied values as SQL literals; normalize EXPLAIN's boolean option.
SELECT :'analyze'::boolean::text AS analyze \gset
SELECT set_config('request.jwt.claim.sub', :'user_id'::uuid::text, true) AS claim_sub,
       set_config('request.jwt.claims', json_build_object(
         'sub', :'user_id'::uuid::text, 'role', 'authenticated'
       )::text, true) AS claims \gset
SELECT public.is_firm_member(:'firm_id'::uuid) AS authorized \gset
\if :authorized
\else
  DO $$ BEGIN RAISE EXCEPTION 'The supplied user is not an active member of this firm'; END $$;
\endif

-- Stop before timing if the target database has not received the RPC migration.
SELECT to_regprocedure(
  'public.search_review_queue(uuid,uuid,text,text,text,date,date,text,integer,integer)'
) IS NOT NULL AS review_rpc_present,
to_regprocedure(
  'public.search_whatsapp_inbox(uuid,text,text,integer,integer)'
) IS NOT NULL AS inbox_rpc_present \gset
\if :review_rpc_present
\else
  DO $$ BEGIN RAISE EXCEPTION 'Review Queue RPC is absent from this database'; END $$;
\endif
\if :inbox_rpc_present
\else
  DO $$ BEGIN RAISE EXCEPTION 'Inbox RPC is absent from this database'; END $$;
\endif

\echo review_first_page
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT * FROM public.search_review_queue(
  target_firm_id => :'firm_id'::uuid, page_limit => 51, page_offset => 0
);

\echo review_search
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT * FROM public.search_review_queue(
  target_firm_id => :'firm_id'::uuid,
  target_search => lower(btrim(:'search_term')), page_limit => 51, page_offset => 0
);

\echo review_later_page
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT * FROM public.search_review_queue(
  target_firm_id => :'firm_id'::uuid, page_limit => 51,
  page_offset => greatest(0, least(:'page_offset'::integer, 5000))
);

\echo inbox_first_page
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT * FROM public.search_whatsapp_inbox(
  target_firm_id => :'firm_id'::uuid, page_limit => 51, page_offset => 0
);

\echo inbox_search
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT * FROM public.search_whatsapp_inbox(
  target_firm_id => :'firm_id'::uuid,
  target_search => lower(btrim(:'search_term')), page_limit => 51, page_offset => 0
);

-- These four reads deliberately match the existing separate preset counts.
\echo review_count_all
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT count(*) FROM public.transactions
WHERE firm_id = :'firm_id'::uuid AND status IN ('draft', 'needs_review', 'duplicate');

\echo review_count_needs_review
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT count(*) FROM public.transactions
WHERE firm_id = :'firm_id'::uuid AND status IN ('draft', 'needs_review', 'duplicate')
  AND status = 'needs_review';

\echo review_count_duplicate
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT count(*) FROM public.transactions
WHERE firm_id = :'firm_id'::uuid AND status IN ('draft', 'needs_review', 'duplicate')
  AND status = 'duplicate';

\echo review_count_draft
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT count(*) FROM public.transactions
WHERE firm_id = :'firm_id'::uuid AND status IN ('draft', 'needs_review', 'duplicate')
  AND status = 'draft';

\echo review_client_options
EXPLAIN (ANALYZE :analyze, BUFFERS :analyze, TIMING false, FORMAT JSON)
SELECT id, business_name FROM public.clients
WHERE firm_id = :'firm_id'::uuid AND status <> 'archived'
ORDER BY business_name;

ROLLBACK;
\echo completed_read_only_dashboard_plans
