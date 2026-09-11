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

const allow = process.env.KHATAONE_RLS_ALLOW_NON_PROD === "true";
const targetLabel = process.env.KHATAONE_RLS_TARGET_LABEL;

if (!allow || targetLabel !== "non-production") {
  console.error(
    "Refusing to run. Set KHATAONE_RLS_ALLOW_NON_PROD=true and KHATAONE_RLS_TARGET_LABEL=non-production for an authorized test database.",
  );
  process.exit(2);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const firmAClientId = requireEnv("KHATAONE_RLS_FIRM_A_CLIENT_ID");
const firmBClientId = requireEnv("KHATAONE_RLS_FIRM_B_CLIENT_ID");
const firmATransactionId = requireEnv("KHATAONE_RLS_FIRM_A_TRANSACTION_ID");
const firmBTransactionId = requireEnv("KHATAONE_RLS_FIRM_B_TRANSACTION_ID");

const actors = [
  {
    name: "firm-a-owner",
    email: requireEnv("KHATAONE_RLS_FIRM_A_OWNER_EMAIL"),
    password: requireEnv("KHATAONE_RLS_FIRM_A_OWNER_PASSWORD"),
    ownClientId: firmAClientId,
    otherClientId: firmBClientId,
    ownTransactionId: firmATransactionId,
    otherTransactionId: firmBTransactionId,
    canApprove: true,
  },
  {
    name: "firm-a-viewer",
    email: requireEnv("KHATAONE_RLS_FIRM_A_VIEWER_EMAIL"),
    password: requireEnv("KHATAONE_RLS_FIRM_A_VIEWER_PASSWORD"),
    ownClientId: firmAClientId,
    otherClientId: firmBClientId,
    ownTransactionId: firmATransactionId,
    otherTransactionId: firmBTransactionId,
    canApprove: false,
  },
  {
    name: "firm-a-revoked",
    email: requireEnv("KHATAONE_RLS_FIRM_A_REVOKED_EMAIL"),
    password: requireEnv("KHATAONE_RLS_FIRM_A_REVOKED_PASSWORD"),
    ownClientId: firmAClientId,
    otherClientId: firmBClientId,
    ownTransactionId: firmATransactionId,
    otherTransactionId: firmBTransactionId,
    canApprove: false,
    revoked: true,
  },
];

async function clientFor(actor) {
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: actor.email,
    password: actor.password,
  });

  if (error) {
    throw new Error(`${actor.name}: ${error.message}`);
  }

  return supabase;
}

for (const actor of actors) {
  const supabase = await clientFor(actor);

  const { data: ownClient } = await supabase
    .from("clients")
    .select("id")
    .eq("id", actor.ownClientId)
    .maybeSingle();
  const { data: otherClient } = await supabase
    .from("clients")
    .select("id")
    .eq("id", actor.otherClientId)
    .maybeSingle();

  assert(
    actor.revoked ? !ownClient : ownClient?.id === actor.ownClientId,
    `${actor.name} same-firm client visibility must match membership status`,
  );
  assert(!otherClient, `${actor.name} must not read another firm's client`);

  const { data: approvalResult, error: approvalError } = await supabase.rpc(
    "approve_transaction_with_handoff",
    {
      target_transaction_id: actor.otherTransactionId,
    },
  );

  assert(
    !approvalResult && approvalError,
    `${actor.name} must not approve another firm's transaction`,
  );

  if (!actor.canApprove) {
    const { data, error } = await supabase.rpc(
      "approve_transaction_with_handoff",
      {
        target_transaction_id: actor.ownTransactionId,
      },
    );

    assert(!data && error, `${actor.name} must not approve own transaction`);
  }
}

if (!process.exitCode) {
  console.log("OK RLS access matrix checks passed");
}
