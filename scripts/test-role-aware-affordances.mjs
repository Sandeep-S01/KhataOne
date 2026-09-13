import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

function read(path) {
  return readFileSync(path, "utf8");
}

const permissions = read("src/lib/permissions.ts");
const actions = {
  clients: read("src/app/actions/clients.ts"),
  review: read("src/app/actions/review.ts"),
  ledger: read("src/app/actions/ledger.ts"),
  gst: read("src/app/actions/gst.ts"),
  exports: read("src/app/actions/exports.ts"),
  operations: read("src/app/actions/operations.ts"),
};
const pages = {
  clientNew: read("src/app/(dashboard)/dashboard/clients/new/page.tsx"),
  clientEdit: read("src/app/(dashboard)/dashboard/clients/[clientId]/edit/page.tsx"),
  clientDetail: read("src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx"),
  reviewDetail: read(
    "src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx",
  ),
  ledgerDetail: read("src/app/(dashboard)/dashboard/ledger/[entryId]/page.tsx"),
  ledgerEdit: read("src/app/(dashboard)/dashboard/ledger/[entryId]/edit/page.tsx"),
  gst: read("src/app/(dashboard)/dashboard/gst-summary/page.tsx"),
  exports: read("src/app/(dashboard)/dashboard/exports/page.tsx"),
  operations: read("src/app/(dashboard)/dashboard/operations/page.tsx"),
};

assert.match(
  permissions,
  /const operationalMutationRoles = \["owner", "admin", "staff"\]/,
  "Shared permission helper should define the operational mutation roles.",
);
assert.match(
  permissions,
  /export const readOnlyRoleMessage =/,
  "Shared permission helper should expose the read-only role message.",
);

for (const [name, source] of Object.entries(actions)) {
  assert.doesNotMatch(
    source,
    /\["owner", "admin", "staff"\]\.includes/,
    `${name} action should use shared permission helpers instead of duplicating role arrays.`,
  );
}

assert.match(pages.clientNew, /canManageClients\(context\.firm\.role\)/);
assert.match(pages.clientNew, /canManageClientRecords \? \(\s*<ClientForm[\s\S]*returnContext=\{returnContext\}/);
assert.match(pages.clientNew, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);

assert.match(pages.clientEdit, /canManageClients\(firm\.role\)/);
assert.match(pages.clientEdit, /canManageClientRecords \? \(\s*<ClientForm[\s\S]*client=\{client\}[\s\S]*returnContext=\{returnContext\}/);
assert.match(pages.clientEdit, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);

assert.match(pages.clientDetail, /canManageClients\(firm\.role\)/);
assert.match(pages.clientDetail, /\{canManageClientRecords && \(\s*<ActionLink[\s\S]*Edit/);
assert.match(pages.clientDetail, /\{canManageClientRecords && client\.status !== "archived" && \(/);
assert.match(pages.clientDetail, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);

assert.match(pages.reviewDetail, /canReviewTransactions\(firm\.role\)/);
assert.match(pages.reviewDetail, /isPosted \|\| !canReviewTransaction \? \(/);
assert.match(pages.reviewDetail, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);
assert.match(pages.reviewDetail, /<TransactionReviewWorkspace[\s\S]*reviewError=\{actionError\}/);

assert.match(pages.ledgerDetail, /canCorrectLedgerEntries\(firm\.role\)/);
assert.match(pages.ledgerDetail, /\{canCorrectEntry && \(\s*<ActionLink[\s\S]*Correct entry/);
assert.match(pages.ledgerDetail, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);

assert.match(pages.ledgerEdit, /canCorrectLedgerEntries\(firm\.role\)/);
assert.match(pages.ledgerEdit, /canCorrectEntry \? \(\s*<LedgerEntryForm/);
assert.match(pages.ledgerEdit, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);

assert.match(pages.gst, /canGenerateGstSummaries\(firm\.role\)/);
assert.match(pages.gst, /canGenerateSummaries \? \(\s*<GstSummaryForm/);
assert.match(pages.gst, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);

assert.match(pages.exports, /canCreateExports\(firm\.role\)/);
assert.match(pages.exports, /canQueueExports \? \(\s*<ExportForm/);
assert.match(pages.exports, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);

assert.match(pages.operations, /canRunOperationsJobs\(firm\.role\)/);
assert.match(pages.operations, /const action = canRunExtractionJobs[\s\S]*\? runJobActionFor\(job\)/);
assert.match(pages.operations, /<PermissionNotice message=\{readOnlyRoleMessage\} \/>/);

console.log("Role-aware affordance checks passed.");
