import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const extensionMigration = readFileSync(
  "supabase/migrations/20260912230000_enable_recovery_scheduler_extensions.sql",
  "utf8",
);
const schedulerMigration = readFileSync(
  "supabase/migrations/20260912240000_schedule_recovery_workers.sql",
  "utf8",
);
const preflight = readFileSync(
  "scripts/preflight-supabase-recovery-scheduler.sql",
  "utf8",
);

assert.match(extensionMigration, /create extension if not exists pg_cron;/i);
assert.match(extensionMigration, /create extension if not exists pg_net with schema extensions;/i);
assert.equal((schedulerMigration.match(/cron\.schedule\(/g) ?? []).length, 2);
assert.match(schedulerMigration, /'\* \* \* \* \*'/);
assert.match(schedulerMigration, /khataone-whatsapp-ingestion-recovery/);
assert.match(schedulerMigration, /khataone-ai-extraction-recovery/);
assert.match(schedulerMigration, /\/api\/jobs\/whatsapp-ingestion\/run-queued\?batch_size=10/);
assert.match(schedulerMigration, /\/api\/jobs\/ai-extraction\/run-queued\?batch_size=10/);
assert.match(schedulerMigration, /from vault\.decrypted_secrets/i);
assert.match(schedulerMigration, /'Authorization', 'Bearer ' \|\| recovery_cron_secret/);
assert.match(schedulerMigration, /timeout_milliseconds := 290000/);
assert.match(schedulerMigration, /revoke all on function public\.dispatch_recovery_worker\(text\)/);
assert.doesNotMatch(schedulerMigration, /grant execute[\s\S]*to (anon|authenticated)/i);
assert.doesNotMatch(schedulerMigration, /insert into public\.(whatsapp_webhook_events|processing_jobs)/i);
assert.doesNotMatch(schedulerMigration, /update public\.(whatsapp_webhook_events|processing_jobs)/i);
assert.match(
  preflight,
  /has_function_privilege\(\s*'anon',\s*'public\.dispatch_recovery_worker\(text\)'/i,
);

console.log("OK Vault-backed minute recovery scheduling and browser execution denial");
