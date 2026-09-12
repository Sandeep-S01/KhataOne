-- Supabase Cron owns the recovery cadence; pg_net dispatches asynchronous
-- requests to the existing protected worker routes after transaction commit.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
