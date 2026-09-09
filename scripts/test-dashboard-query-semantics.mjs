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
  inboxPage.includes("search_applied_after_page: Boolean(search)") &&
    reviewPage.includes("search_applied_after_page: Boolean(search)"),
  "remaining relationship-aware post-page filters must stay explicitly observable",
);

assert(
  [clientsPage, inboxPage, reviewPage, ledgerPage].every((source) =>
    source.includes('.order("id", { ascending: false })'),
  ),
  "dashboard list pages must use a unique tie-breaker for stable pagination",
);

if (!process.exitCode) {
  console.log("OK dashboard query semantics checks passed");
}
