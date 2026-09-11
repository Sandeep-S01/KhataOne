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

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exitCode = 1;
  }
}

if (
  process.env.KHATAONE_APPROVAL_RPC_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_APPROVAL_RPC_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Set KHATAONE_APPROVAL_RPC_ALLOW_NON_PROD=true and KHATAONE_APPROVAL_RPC_TARGET_LABEL=non-production for an authorized staging database.",
  );
  process.exit(2);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const transactionId = requireEnv("KHATAONE_APPROVAL_RPC_TRANSACTION_ID");
const ownerEmail = requireEnv("KHATAONE_APPROVAL_RPC_OWNER_EMAIL");
const ownerPassword = requireEnv("KHATAONE_APPROVAL_RPC_OWNER_PASSWORD");
const viewerEmail = requireEnv("KHATAONE_APPROVAL_RPC_VIEWER_EMAIL");
const viewerPassword = requireEnv("KHATAONE_APPROVAL_RPC_VIEWER_PASSWORD");

async function signIn(email, password) {
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  return supabase;
}

const owner = await signIn(ownerEmail, ownerPassword);
const viewer = await signIn(viewerEmail, viewerPassword);

const viewerAttempt = await viewer.rpc("approve_transaction_with_handoff", {
  target_transaction_id: transactionId,
});
assert(
  viewerAttempt.error && !viewerAttempt.data,
  "viewer must not approve a transaction through the RPC",
);

const attempts = await Promise.allSettled(
  Array.from({ length: 2 }, () =>
    owner.rpc("approve_transaction_with_handoff", {
      target_transaction_id: transactionId,
    }),
  ),
);

const fulfilled = attempts
  .filter((attempt) => attempt.status === "fulfilled")
  .map((attempt) => attempt.value);
const successful = fulfilled.filter((result) => result.data && !result.error);

assert(successful.length >= 1, "at least one owner approval attempt must succeed");

const { data: transaction, error: transactionError } = await owner
  .from("transactions")
  .select("id, status, approved_by, approved_at")
  .eq("id", transactionId)
  .single();

assert(!transactionError, "approved transaction must be readable");
assert(transaction?.status === "approved", "transaction must be approved");
assert(Boolean(transaction?.approved_by), "approved transaction must record actor");
assert(Boolean(transaction?.approved_at), "approved transaction must record timestamp");

const { data: ledgers, error: ledgerError } = await owner
  .from("ledger_entries")
  .select("id")
  .eq("transaction_id", transactionId);

assert(!ledgerError, "ledger handoff rows must be readable");
assert((ledgers ?? []).length === 1, "exactly one ledger handoff must exist");

const { data: audits, error: auditError } = await owner
  .from("audit_logs")
  .select("id, action, metadata")
  .eq("entity_type", "transaction")
  .eq("entity_id", transactionId)
  .eq("action", "transaction.approved");

assert(!auditError, "approval audit rows must be readable");
assert((audits ?? []).length === 1, "exactly one approval audit row must exist");

if (!process.exitCode) {
  console.log("OK approval RPC concurrency checks passed");
}
