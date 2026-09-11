import { randomUUID } from "node:crypto";

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
  process.env.KHATAONE_RLS_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_RLS_TARGET_LABEL !== "non-production" ||
  process.env.KHATAONE_APPROVAL_RPC_ALLOW_NON_PROD !== "true" ||
  process.env.KHATAONE_APPROVAL_RPC_TARGET_LABEL !== "non-production"
) {
  console.error(
    "Refusing to run. Enable KHATAONE_RLS_* and KHATAONE_APPROVAL_RPC_* non-production flags before creating verification fixtures.",
  );
  process.exit(2);
}

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const runId = `security-${Date.now()}-${randomUUID().slice(0, 8)}`;
const password = `KhataOne-${randomUUID()}!aA1`;
const phoneSuffix = String(Date.now()).slice(-8);

async function createUser(label) {
  const email = `${runId}-${label}@example.com`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`${label} user: ${error?.message ?? "missing user"}`);
  }

  return {
    id: data.user.id,
    email,
    password,
  };
}

async function insertOne(table, values) {
  const { data, error } = await supabase.from(table).insert(values).select("id").single();

  if (error || !data) {
    throw new Error(`${table}: ${error?.message ?? "missing inserted row"}`);
  }

  return data.id;
}

const ownerA = await createUser("owner-a");
const viewerA = await createUser("viewer-a");
const revokedA = await createUser("revoked-a");
const ownerB = await createUser("owner-b");

const firmAId = await insertOne("firms", {
  name: `KhataOne Verification Firm A ${runId}`,
  slug: `verification-firm-a-${runId}`,
  owner_user_id: ownerA.id,
  status: "active",
});
const firmBId = await insertOne("firms", {
  name: `KhataOne Verification Firm B ${runId}`,
  slug: `verification-firm-b-${runId}`,
  owner_user_id: ownerB.id,
  status: "active",
});

await supabase.from("firm_users").insert([
  {
    firm_id: firmAId,
    user_id: ownerA.id,
    role: "owner",
    status: "active",
  },
  {
    firm_id: firmAId,
    user_id: viewerA.id,
    role: "viewer",
    status: "active",
  },
  {
    firm_id: firmAId,
    user_id: revokedA.id,
    role: "staff",
    status: "disabled",
  },
  {
    firm_id: firmBId,
    user_id: ownerB.id,
    role: "owner",
    status: "active",
  },
]);

const clientAId = await insertOne("clients", {
  firm_id: firmAId,
  business_name: `Verification Client A ${runId}`,
  phone: `+9188${phoneSuffix}`,
  whatsapp_phone: `+9198${phoneSuffix}`,
  filing_frequency: "monthly",
  status: "active",
});
const clientBId = await insertOne("clients", {
  firm_id: firmBId,
  business_name: `Verification Client B ${runId}`,
  phone: `+9187${phoneSuffix}`,
  whatsapp_phone: `+9197${phoneSuffix}`,
  filing_frequency: "monthly",
  status: "active",
});

async function createTransaction({ firmId, clientId, invoice }) {
  return insertOne("transactions", {
    firm_id: firmId,
    client_id: clientId,
    transaction_type: "sales",
    status: "needs_review",
    transaction_date: "2026-09-10",
    party_name: `Verification Party ${runId}`,
    invoice_number: invoice,
    description: "Synthetic transaction for non-production security verification.",
    category: null,
    taxable_amount: 1000,
    cgst_amount: 90,
    sgst_amount: 90,
    igst_amount: 0,
    cess_amount: 0,
    total_amount: 1180,
    confidence_score: 0.99,
  });
}

const approvalTransactionId = await createTransaction({
  firmId: firmAId,
  clientId: clientAId,
  invoice: `APP-${runId}`,
});
const firmATransactionId = await createTransaction({
  firmId: firmAId,
  clientId: clientAId,
  invoice: `RLS-A-${runId}`,
});
const firmBTransactionId = await createTransaction({
  firmId: firmBId,
  clientId: clientBId,
  invoice: `RLS-B-${runId}`,
});

console.log(
  JSON.stringify(
    {
      runId,
      env: {
        KHATAONE_APPROVAL_RPC_TRANSACTION_ID: approvalTransactionId,
        KHATAONE_APPROVAL_RPC_OWNER_EMAIL: ownerA.email,
        KHATAONE_APPROVAL_RPC_OWNER_PASSWORD: password,
        KHATAONE_APPROVAL_RPC_VIEWER_EMAIL: viewerA.email,
        KHATAONE_APPROVAL_RPC_VIEWER_PASSWORD: password,
        KHATAONE_RLS_FIRM_A_CLIENT_ID: clientAId,
        KHATAONE_RLS_FIRM_B_CLIENT_ID: clientBId,
        KHATAONE_RLS_FIRM_A_TRANSACTION_ID: firmATransactionId,
        KHATAONE_RLS_FIRM_B_TRANSACTION_ID: firmBTransactionId,
        KHATAONE_RLS_FIRM_A_OWNER_EMAIL: ownerA.email,
        KHATAONE_RLS_FIRM_A_OWNER_PASSWORD: password,
        KHATAONE_RLS_FIRM_A_VIEWER_EMAIL: viewerA.email,
        KHATAONE_RLS_FIRM_A_VIEWER_PASSWORD: password,
        KHATAONE_RLS_FIRM_A_REVOKED_EMAIL: revokedA.email,
        KHATAONE_RLS_FIRM_A_REVOKED_PASSWORD: password,
      },
    },
    null,
    2,
  ),
);
