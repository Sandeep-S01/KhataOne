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
  process.env.KHATAONE_PHASE3_RECONCILE_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_PHASE3_RECONCILE_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Set KHATAONE_PHASE3_RECONCILE_ALLOW_NON_PROD=true and KHATAONE_PHASE3_RECONCILE_TARGET_LABEL=non-production for an authorized staging database.",
  );
  process.exit(2);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const firmId = requireEnv("KHATAONE_PHASE3_RECONCILE_FIRM_ID");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function groupedCounts(table, groupColumn, filters = {}) {
  let query = supabase.from(table).select(groupColumn).eq("firm_id", firmId);

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }

  const counts = {};
  for (const row of data ?? []) {
    const key = row[groupColumn] ?? "NULL";
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

const result = {
  firm_id: firmId,
  captured_at: new Date().toISOString(),
  documents_by_status: await groupedCounts("documents", "status"),
  ai_extractions_by_status: await groupedCounts("ai_extractions", "status"),
  transactions_by_status: await groupedCounts("transactions", "status"),
  processing_jobs_by_status: await groupedCounts("processing_jobs", "status"),
  exports_by_status: await groupedCounts("exports", "status"),
};

const { data: ledgerRows, error: ledgerError } = await supabase
  .from("ledger_entries")
  .select("transaction_id")
  .eq("firm_id", firmId)
  .not("transaction_id", "is", null);

if (ledgerError) {
  throw new Error(`ledger_entries: ${ledgerError.message}`);
}

const ledgerCounts = new Map();
for (const row of ledgerRows ?? []) {
  ledgerCounts.set(row.transaction_id, (ledgerCounts.get(row.transaction_id) ?? 0) + 1);
}

result.duplicate_logical_handoffs = Array.from(ledgerCounts.values()).filter(
  (count) => count > 1,
).length;

console.log(JSON.stringify(result, null, 2));

if (result.duplicate_logical_handoffs > 0) {
  console.error("FAIL duplicate logical handoffs observed");
  process.exit(1);
}
