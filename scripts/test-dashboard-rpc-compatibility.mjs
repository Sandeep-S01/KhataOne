import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const reviewPage = readFileSync("src/app/(dashboard)/dashboard/review-queue/page.tsx", "utf8");
const inboxPage = readFileSync("src/app/(dashboard)/dashboard/inbox/page.tsx", "utf8");

for (const [name, source, rpcName, fallbackName, safeMessage] of [
  [
    "Review Queue",
    reviewPage,
    "search_review_queue",
    "fallbackReviewQueueQuery",
    "Review queue records could not be loaded. Please retry.",
  ],
  [
    "Inbox",
    inboxPage,
    "search_whatsapp_inbox",
    "fallbackInboxQuery",
    "Inbound messages could not be loaded. Please retry.",
  ],
]) {
  assert(source.includes(`supabase.rpc("${rpcName}"`), `${name} must keep the preferred RPC path.`);
  assert(source.includes("PGRST202"), `${name} must detect missing RPC schema-cache errors.`);
  assert(source.includes("schema cache"), `${name} must detect schema-cache copy from PostgREST.`);
  assert(source.includes(fallbackName), `${name} must provide a read-only compatibility fallback.`);
  assert(source.includes("compatibility_fallback: true"), `${name} timing must mark fallback usage.`);
  assert(source.includes(safeMessage), `${name} must render a safe generic load error.`);
  assert(!source.includes("<QueryError message={error.message}"), `${name} must not expose raw database errors in the UI.`);
}

assert(
  reviewPage.includes('.from("transactions")') && reviewPage.includes('.eq("firm_id", firmId)'),
  "Review Queue fallback must stay firm-scoped on transactions.",
);
assert(
  reviewPage.includes('.in("status", ["draft", "needs_review", "duplicate"])'),
  "Review Queue fallback must preserve reviewable status scope.",
);
assert(
  inboxPage.includes('.from("whatsapp_messages")') && inboxPage.includes('.eq("firm_id", firmId)'),
  "Inbox fallback must stay firm-scoped on WhatsApp messages.",
);

console.log("Dashboard RPC compatibility fallback checks passed.");
