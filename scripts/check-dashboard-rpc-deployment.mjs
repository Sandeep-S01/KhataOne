// Read-only PostgREST deployment check. Never print credentials, identifiers,
// response rows, or raw provider errors. Uses an ordinary firm member session.
import { readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";

import { createClient } from "@supabase/supabase-js";

try {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(".env.local", "utf8")))) {
    process.env[key] ??= value;
  }
} catch {
  // CI or a separate runner may inject these values directly.
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "LIVE_DASHBOARD_EMAIL",
  "LIVE_DASHBOARD_PASSWORD",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`RPC deployment check setup is missing: ${missing.join(", ")}`);
  process.exit(1);
}

function outcome(error) {
  if (!error) return { status: "available", code: null };
  const code = /^[A-Z0-9]{1,12}$/.test(error.code ?? "") ? error.code : null;
  return { status: code === "PGRST202" ? "unresolved_schema_cache" : "rpc_error", code };
}

try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  );
  const { data: login, error: loginError } = await supabase.auth.signInWithPassword({
    email: process.env.LIVE_DASHBOARD_EMAIL,
    password: process.env.LIVE_DASHBOARD_PASSWORD,
  });
  if (loginError || !login.user) throw new Error("authentication_failed");

  const { data: member, error: memberError } = await supabase
    .from("firm_users")
    .select("firm_id")
    .eq("user_id", login.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (memberError || !member) throw new Error("membership_unavailable");

  const firmId = member.firm_id;
  const [review, inbox] = await Promise.all([
    supabase.rpc("search_review_queue", {
      target_firm_id: firmId,
      target_client_id: null,
      target_status: null,
      target_risk: null,
      target_document_type: null,
      target_from: null,
      target_to: null,
      target_search: null,
      page_limit: 1,
      page_offset: 0,
    }),
    supabase.rpc("search_whatsapp_inbox", {
      target_firm_id: firmId,
      target_status: null,
      target_search: null,
      page_limit: 1,
      page_offset: 0,
    }),
  ]);

  const report = {
    checked_at_utc: new Date().toISOString(),
    target: "Supabase project configured by NEXT_PUBLIC_SUPABASE_URL",
    auth: "active firm member",
    operations: "read-only RPCs, at most one row requested each; no row data retained",
    review_queue: outcome(review.error),
    inbox: outcome(inbox.error),
  };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (process.env.DASHBOARD_RPC_DEPLOYMENT_OUTPUT) {
    writeFileSync(process.env.DASHBOARD_RPC_DEPLOYMENT_OUTPUT, json);
  }
  console.log(json);
  if (report.review_queue.status !== "available" || report.inbox.status !== "available") {
    process.exitCode = 1;
  }
} catch (error) {
  // Supabase exceptions can include request details. Only emit fixed categories.
  const category = ["authentication_failed", "membership_unavailable"].includes(error?.message)
    ? error.message : "request_failed";
  console.error(`RPC deployment check incomplete: ${category}`);
  process.exitCode = 1;
}
