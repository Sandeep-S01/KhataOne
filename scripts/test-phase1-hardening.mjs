import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  }
}

function read(path) {
  return readFileSync(path, "utf8");
}

const migration = read("supabase/migrations/20260910160000_atomic_transaction_approval.sql");
const reviewAction = read("src/app/actions/review.ts");
const csv = read("src/lib/export/csv.ts");
const exportAction = read("src/app/actions/exports.ts");
const exportGenerator = read("src/lib/exports/generator.ts");

assert(
  migration.includes("ledger_entries_transaction_id_unique_idx") &&
    migration.includes("create unique index"),
  "ledger handoff migration must enforce one handoff per transaction",
);

assert(
  migration.includes("approve_transaction_with_handoff") &&
    migration.includes("for update") &&
    migration.includes("insert into public.audit_logs"),
  "approval migration must provide a locking transactional approval RPC with audit logging",
);

assert(
  reviewAction.includes("approve_transaction_with_handoff") &&
    reviewAction.includes("target_transaction_id: transactionId") &&
    !reviewAction.includes("function createMutationClient") &&
    !reviewAction.includes("function createLedgerHandoff"),
  "review approval action must delegate approval/handoff to the database RPC",
);

assert(
  csv.includes("startsLikeSpreadsheetFormula") &&
    csv.includes("formulaLeadingCharacters") &&
    csv.includes("replaceAll(\"\\\"\", \"\\\"\\\"\")"),
  "CSV serializer must escape quotes and neutralize spreadsheet formula-leading cells",
);

assert(
  exportGenerator.includes('from "@/lib/export/csv"') &&
    exportGenerator.includes("csvRows(") &&
    !exportAction.includes("function csvCell") &&
    !exportAction.includes("function csvRows"),
  "export generation must use the centralized CSV serializer",
);

if (!process.exitCode) {
  console.log("OK phase 1 hardening checks passed");
}
