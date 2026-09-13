import fs from "node:fs";
import assert from "node:assert/strict";

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function expectContains(file, text, message = text) {
  assert.ok(read(file).includes(text), `${file} should contain ${message}`);
}

function expectNotContains(file, text, message = text) {
  assert.ok(!read(file).includes(text), `${file} should not contain ${message}`);
}

const helper = read("src/lib/return-context.ts");
assert.match(helper, /export const returnContextParam = "return_to"/);
assert.match(helper, /export const clientReturnKeys = \["page", "status", "q"\] as const/);
assert.match(helper, /export const ledgerReturnKeys = \["account", "client", "from", "page", "to"\] as const/);
assert.match(helper, /reviewQueueReturnKeys = \[/);
assert.match(helper, /if \(!allowed\.has\(key\) \|\| key === returnContextParam\)/);
assert.match(helper, /rawContext\.length > 2000/);
assert.match(helper, /normalized\.length > maxValueLength/);
assert.match(helper, /encodeURIComponent\(safeContext\)/);

expectContains(
  "src/app/(dashboard)/dashboard/clients/page.tsx",
  "const returnContext = buildReturnContext(filters, clientReturnKeys);",
  "clients list builds return context",
);
expectContains(
  "src/app/(dashboard)/dashboard/clients/page.tsx",
  "appendReturnContext(\n                          `/dashboard/clients/${client.id}`",
  "clients detail links carry context",
);
expectContains(
  "src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx",
  "const clientsHref = dashboardReturnHref(",
  "client detail uses safe back href",
);
expectContains(
  "src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx",
  "name=\"return_context\" value={returnContext}",
  "client archive carries return context",
);
expectContains(
  "src/components/client-form.tsx",
  "name=\"return_context\" value={returnContext}",
  "client form carries return context",
);
expectContains(
  "src/app/actions/clients.ts",
  "redirect(withQueryParam(clientsHref, \"archive\", result));",
  "archive result appends to safe client list href",
);
expectContains(
  "src/app/actions/clients.ts",
  "redirect(appendReturnContext(`/dashboard/clients/${updatedClientId}`, returnContext));",
  "client update redirect preserves context",
);

expectContains(
  "src/app/(dashboard)/dashboard/review-queue/page.tsx",
  "const returnContext = buildReturnContext(filters, reviewQueueReturnKeys);",
  "review queue builds return context",
);
expectContains(
  "src/app/(dashboard)/dashboard/review-queue/[transactionId]/page.tsx",
  "const reviewQueueHref = dashboardReturnHref(",
  "review detail uses safe back href",
);
expectContains(
  "src/components/transaction-review-workspace.tsx",
  "name=\"return_context\" value={returnContext}",
  "review action forms carry return context",
);
expectContains(
  "src/app/actions/review.ts",
  "function reviewQueueHref(returnContext: string)",
  "review action uses safe review queue href",
);
expectContains(
  "src/app/actions/review.ts",
  "redirect(reviewQueueHref(returnContext));",
  "review decisions can return to filtered queue",
);
expectContains(
  "src/app/actions/review.ts",
  "redirect(\"/dashboard/ledger\");",
  "approval still routes to ledger handoff destination",
);
expectNotContains(
  "src/app/actions/review.ts",
  "redirect(readString(formData, \"return_context\"))",
  "review actions must not redirect to raw form values",
);

expectContains(
  "src/app/(dashboard)/dashboard/ledger/page.tsx",
  "const returnContext = buildReturnContext(filters, ledgerReturnKeys);",
  "ledger list builds return context",
);
expectContains(
  "src/app/(dashboard)/dashboard/ledger/[entryId]/page.tsx",
  "const ledgerHref = dashboardReturnHref(",
  "ledger detail uses safe back href",
);
expectContains(
  "src/components/ledger-entry-form.tsx",
  "name=\"return_context\" value={returnContext}",
  "ledger correction form carries return context",
);
expectContains(
  "src/app/actions/ledger.ts",
  "redirect(appendReturnContext(`/dashboard/ledger/${entryId}`, returnContext));",
  "ledger update redirect preserves context",
);

console.log("Return-context route and action plumbing checks passed.");
