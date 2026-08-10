import { createClient } from "@supabase/supabase-js";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running seed:demo.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function getDemoUserId() {
  if (process.env.DEMO_USER_ID) {
    return process.env.DEMO_USER_ID;
  }

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.users[0];

  if (!user) {
    throw new Error(
      "No Supabase Auth user exists. Create a user first or set DEMO_USER_ID.",
    );
  }

  return user.id;
}

const userId = await getDemoUserId();
const firmId = "11111111-1111-4111-8111-111111111111";
const clientId = "22222222-2222-4222-8222-222222222222";
const documentId = "33333333-3333-4333-8333-333333333333";
const transactionId = "44444444-4444-4444-8444-444444444444";
const ledgerEntryId = "55555555-5555-4555-8555-555555555555";
const gstPeriodId = "66666666-6666-4666-8666-666666666666";
const gstSummaryId = "77777777-7777-4777-8777-777777777777";
const jobId = "88888888-8888-4888-8888-888888888888";

const today = new Date().toISOString().slice(0, 10);

async function upsert(table, payload, onConflict = "id") {
  const { error } = await supabase.from(table).upsert(payload, {
    onConflict,
  });

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
}

await upsert("firms", {
  id: firmId,
  name: "KhataOne Demo CA Firm",
  slug: "khataone-demo",
  owner_user_id: userId,
  gstin: "27ABCDE1234F1Z5",
  phone: "+919999999999",
  email: "demo@khataone.local",
  address: "Mumbai, Maharashtra",
  status: "active",
});

await upsert("firm_users", {
  firm_id: firmId,
  user_id: userId,
  role: "owner",
  status: "active",
});

await upsert("clients", {
  id: clientId,
  firm_id: firmId,
  business_name: "Aarav Traders",
  contact_name: "Aarav Mehta",
  phone: "+919888888888",
  whatsapp_phone: "919888888888",
  email: "accounts@aaravtraders.local",
  gstin: "27AARCA1234F1Z2",
  state_code: "27",
  filing_frequency: "monthly",
  assigned_user_id: userId,
  status: "filing_ready",
});

await upsert("documents", {
  id: documentId,
  firm_id: firmId,
  client_id: clientId,
  document_type: "sales_invoice",
  file_name: "demo-invoice.txt",
  file_mime_type: "text/plain",
  source_text:
    "Invoice INV-1001 dated 2026-08-01 from Aarav Traders to City Retail. Taxable 10000, CGST 900, SGST 900, total 11800.",
  status: "extracted",
  received_at: new Date().toISOString(),
});

await upsert("transactions", {
  id: transactionId,
  firm_id: firmId,
  client_id: clientId,
  document_id: documentId,
  transaction_type: "sales",
  status: "approved",
  transaction_date: today,
  party_name: "City Retail",
  party_gstin: "27CITYR1234F1Z1",
  invoice_number: "INV-1001",
  description: "Demo sales invoice",
  category: "Sales",
  place_of_supply: "27",
  taxable_amount: 10000,
  cgst_amount: 900,
  sgst_amount: 900,
  igst_amount: 0,
  cess_amount: 0,
  total_amount: 11800,
  payment_mode: "bank",
  confidence_score: 0.96,
  approved_by: userId,
  approved_at: new Date().toISOString(),
});

await upsert("ledger_entries", {
  id: ledgerEntryId,
  firm_id: firmId,
  client_id: clientId,
  transaction_id: transactionId,
  entry_date: today,
  account_name: "Sales",
  debit_amount: 0,
  credit_amount: 11800,
  narration: "Demo ledger handoff from approved transaction",
});

await upsert("gst_periods", {
  id: gstPeriodId,
  firm_id: firmId,
  client_id: clientId,
  period_start: "2026-08-01",
  period_end: "2026-08-31",
  filing_type: "monthly",
  status: "ready",
});

await upsert("gst_summaries", {
  id: gstSummaryId,
  firm_id: firmId,
  client_id: clientId,
  gst_period_id: gstPeriodId,
  sales_taxable_amount: 10000,
  purchase_taxable_amount: 0,
  output_cgst: 900,
  output_sgst: 900,
  output_igst: 0,
  input_cgst: 0,
  input_sgst: 0,
  input_igst: 0,
  net_tax_payable: 1800,
  mismatch_count: 0,
  missing_document_count: 0,
  generated_at: new Date().toISOString(),
});

await upsert("processing_jobs", {
  id: jobId,
  firm_id: firmId,
  client_id: clientId,
  job_type: "ai_extraction",
  entity_type: "document",
  entity_id: documentId,
  status: "completed",
  attempt_count: 1,
  completed_at: new Date().toISOString(),
});

await supabase.from("audit_logs").insert({
  firm_id: firmId,
  client_id: clientId,
  actor_user_id: userId,
  action: "demo.seeded",
  entity_type: "firm",
  entity_id: firmId,
  metadata: {
    source: "scripts/seed-demo.mjs",
  },
});

console.log("Demo data seeded.");
console.log(`Firm: ${firmId}`);
console.log(`Client: ${clientId}`);
