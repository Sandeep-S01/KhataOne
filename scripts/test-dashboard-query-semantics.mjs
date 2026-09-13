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

function appearsBefore(source, earlier, later) {
  const earlierIndex = source.indexOf(earlier);
  const laterIndex = source.indexOf(later);

  return earlierIndex >= 0 && laterIndex >= 0 && earlierIndex < laterIndex;
}

const clientsPage = read("src/app/(dashboard)/dashboard/clients/page.tsx");
const inboxPage = read("src/app/(dashboard)/dashboard/inbox/page.tsx");
const reviewPage = read("src/app/(dashboard)/dashboard/review-queue/page.tsx");
const ledgerPage = read("src/app/(dashboard)/dashboard/ledger/page.tsx");
const queryUtils = read("src/lib/dashboard-query.ts");
const filterRpcs = read("supabase/migrations/20260913110000_complete_dashboard_filtered_results.sql");

assert(
  queryUtils.includes("toPostgrestContainsPattern") &&
    queryUtils.includes("postgrestReservedCharacters") &&
    queryUtils.includes("wildcardCharacters"),
  "dashboard search helper must sanitize PostgREST OR patterns",
);

assert(
  appearsBefore(clientsPage, "toPostgrestContainsPattern(search)", ".range("),
  "clients search must be applied before pagination",
);

assert(
  !clientsPage.includes("filteredClients"),
  "clients page must not filter the current page in memory",
);

assert(
  clientsPage.includes('.order("created_at", { ascending: false })') &&
    clientsPage.includes('.order("id", { ascending: false })'),
  "clients page must use deterministic pagination ordering",
);

assert(
  inboxPage.includes('supabase.rpc("search_whatsapp_inbox"') &&
    reviewPage.includes('supabase.rpc("search_review_queue"'),
  "review queue and inbox must use database-side filtered pagination",
);

assert(
  inboxPage.includes("filters_applied_before_page: true") &&
    reviewPage.includes("filters_applied_before_page: true"),
  "review queue and inbox timing metadata must identify before-page filtering",
);

assert(
  !inboxPage.includes("filteredMessages") &&
    !reviewPage.includes("filteredTransactions"),
  "review queue and inbox must not filter current page rows in memory",
);

assert(
  clientsPage.includes('"onboarding"'),
  "clients status filter must include onboarding records",
);

assert(
  [clientsPage, ledgerPage].every((source) =>
    source.includes('.order("id", { ascending: false })'),
  ) &&
    filterRpcs.includes("order by m.received_at desc, m.id desc") &&
    filterRpcs.includes("order by t.created_at desc, t.id desc"),
  "dashboard list pages must use a unique tie-breaker for stable pagination",
);

if (!process.exitCode) {
  console.log("OK dashboard query semantics checks passed");
}
