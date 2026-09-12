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
const expectedSupabaseHost = requireEnv(
  "KHATAONE_PHASE3_RECONCILE_EXPECTED_HOST",
).trim().toLowerCase();
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const firmId = requireEnv("KHATAONE_PHASE3_RECONCILE_FIRM_ID");

let parsedSupabaseUrl;

try {
  parsedSupabaseUrl = new URL(supabaseUrl);
} catch {
  console.error("FAIL NEXT_PUBLIC_SUPABASE_URL must be a valid URL");
  process.exit(2);
}

if (parsedSupabaseUrl.hostname !== expectedSupabaseHost) {
  console.error(
    "FAIL Supabase URL hostname must exactly match KHATAONE_PHASE3_RECONCILE_EXPECTED_HOST",
  );
  process.exit(2);
}

const pageSize = 1000;
const configuredMaximumRows = Number(
  process.env.KHATAONE_PHASE3_RECONCILE_MAX_ROWS ?? 100000,
);
const maximumRows =
  Number.isSafeInteger(configuredMaximumRows) && configuredMaximumRows >= pageSize
    ? Math.min(configuredMaximumRows, 1000000)
    : 100000;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function readRows(table, columns, filters = {}) {
  const rows = [];

  for (let from = 0; from < maximumRows; from += pageSize) {
    let query = supabase
      .from(table)
      .select(columns)
      .eq("firm_id", firmId)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    rows.push(...(data ?? []));

    if ((data ?? []).length < pageSize) {
      return rows;
    }
  }

  throw new Error(
    `${table}: reconciliation exceeded KHATAONE_PHASE3_RECONCILE_MAX_ROWS=${maximumRows}`,
  );
}

async function groupedCounts(table, groupColumn, filters = {}) {
  const data = await readRows(table, groupColumn, filters);

  const counts = {};
  for (const row of data) {
    const key = row[groupColumn] ?? "NULL";
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

async function groupedPairCounts(table, firstColumn, secondColumn) {
  const data = await readRows(table, `${firstColumn},${secondColumn}`);
  const counts = {};

  for (const row of data) {
    const key = `${row[firstColumn] ?? "NULL"}:${row[secondColumn] ?? "NULL"}`;
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
  processing_jobs_by_type_and_status: await groupedPairCounts(
    "processing_jobs",
    "job_type",
    "status",
  ),
  exports_by_status: await groupedCounts("exports", "status"),
  audit_logs_by_action: await groupedCounts("audit_logs", "action"),
};

const ledgerRows = await readRows("ledger_entries", "transaction_id");

const ledgerCounts = new Map();
for (const row of ledgerRows ?? []) {
  if (!row.transaction_id) {
    continue;
  }

  ledgerCounts.set(row.transaction_id, (ledgerCounts.get(row.transaction_id) ?? 0) + 1);
}

result.duplicate_logical_handoffs = Array.from(ledgerCounts.values()).filter(
  (count) => count > 1,
).length;
result.row_counts_complete = true;
result.reconcile_max_rows_per_table = maximumRows;

console.log(JSON.stringify(result, null, 2));

if (result.duplicate_logical_handoffs > 0) {
  console.error("FAIL duplicate logical handoffs observed");
  process.exit(1);
}
