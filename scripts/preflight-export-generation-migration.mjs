import { createClient } from "@supabase/supabase-js";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

function requireEnv(key) {
  const value = process.env[key];

  if (!value) {
    console.error(`FAIL setup: Missing ${key}`);
    process.exit(2);
  }

  return value;
}

if (
  process.env.KHATAONE_EXPORT_MIGRATION_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_EXPORT_MIGRATION_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Set KHATAONE_EXPORT_MIGRATION_ALLOW_NON_PROD=true and KHATAONE_EXPORT_MIGRATION_TARGET_LABEL=non-production for an authorized staging database.",
  );
  process.exit(2);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabase
  .from("processing_jobs")
  .select("entity_id")
  .eq("job_type", "export_generation")
  .eq("entity_type", "export");

if (error) {
  console.error(`FAIL export generation migration preflight: ${error.message}`);
  process.exit(1);
}

const counts = new Map();

for (const row of data ?? []) {
  counts.set(row.entity_id, (counts.get(row.entity_id) ?? 0) + 1);
}

const duplicates = Array.from(counts.entries()).filter(([, count]) => count > 1);

if (duplicates.length > 0) {
  console.error(
    `FAIL found ${duplicates.length} export(s) with duplicate generation jobs. Reconcile before applying 20260910170000_export_generation_jobs.sql.`,
  );
  for (const [exportId, count] of duplicates.slice(0, 20)) {
    console.error(`${exportId}: ${count}`);
  }
  process.exit(1);
}

console.log("OK no duplicate export generation jobs found for migration preflight");
