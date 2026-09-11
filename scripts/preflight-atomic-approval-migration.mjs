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
  process.env.KHATAONE_MIGRATION_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_MIGRATION_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Set KHATAONE_MIGRATION_ALLOW_NON_PROD=true and KHATAONE_MIGRATION_TARGET_LABEL=non-production for an authorized staging database.",
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
  .from("ledger_entries")
  .select("transaction_id")
  .not("transaction_id", "is", null);

if (error) {
  console.error(`FAIL ledger duplicate preflight: ${error.message}`);
  process.exit(1);
}

const counts = new Map();

for (const row of data ?? []) {
  counts.set(row.transaction_id, (counts.get(row.transaction_id) ?? 0) + 1);
}

const duplicates = Array.from(counts.entries()).filter(([, count]) => count > 1);

if (duplicates.length > 0) {
  console.error(
    `FAIL found ${duplicates.length} transaction_id value(s) with duplicate ledger handoffs. Reconcile before applying 20260910160000_atomic_transaction_approval.sql.`,
  );
  for (const [transactionId, count] of duplicates.slice(0, 20)) {
    console.error(`${transactionId}: ${count}`);
  }
  process.exit(1);
}

console.log("OK no duplicate ledger handoffs found for migration preflight");
