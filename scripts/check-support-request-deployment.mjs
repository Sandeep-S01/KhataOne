import { createClient } from "@supabase/supabase-js";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase URL, anonymous key, or service-role key.");
  process.exit(2);
}

const options = { auth: { autoRefreshToken: false, persistSession: false } };
const roleOf = (key) => {
  try {
    return JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8")).role;
  } catch {
    return "unknown";
  }
};
if (roleOf(anonKey) !== "anon" || roleOf(serviceKey) !== "service_role") {
  console.error("Supabase key roles do not match the expected anonymous and service roles.");
  process.exit(2);
}
const service = createClient(url, serviceKey, options);
const anonymous = createClient(url, anonKey, options);

const serviceRead = await service.from("support_requests").select("id", { head: true });
const anonymousRead = await anonymous.from("support_requests").select("id", { head: true });

if (serviceRead.error || (serviceRead.status !== 200 && serviceRead.status !== 206)) {
  console.error(`FAIL support_requests table is unavailable (HTTP ${serviceRead.status}).`);
  process.exit(1);
}
// HEAD responses do not carry an error body; use the HTTP status for this check.
if (anonymousRead.status !== 401 && anonymousRead.status !== 403) {
  console.error(`FAIL anonymous read boundary is unexpected (HTTP ${anonymousRead.status}).`);
  process.exit(1);
}

const email = process.env.SMOKE_CA_EMAIL;
const password = process.env.SMOKE_CA_PASSWORD;
if (process.env.KHATAONE_SUPPORT_CHECK_AUTH === "1") {
  if (!email || !password) {
    console.error("Missing SMOKE_CA_EMAIL or SMOKE_CA_PASSWORD for authenticated check.");
    process.exit(2);
  }
  const signedIn = createClient(url, anonKey, options);
  const { error: signInError } = await signedIn.auth.signInWithPassword({ email, password });
  if (signInError) {
    console.error(`FAIL test-user sign-in (${signInError.code ?? "unknown"}).`);
    process.exit(1);
  }
  const userRead = await signedIn.from("support_requests").select("id", { head: true });
  if (userRead.error || (userRead.status !== 200 && userRead.status !== 206)) {
    console.error(`FAIL authenticated support request read (HTTP ${userRead.status}).`);
    process.exit(1);
  }
  await signedIn.auth.signOut();
  console.log("OK authenticated requester can read support_requests (read-only check)");
} else {
  console.log("Authenticated live check skipped; set KHATAONE_SUPPORT_CHECK_AUTH=1 with valid smoke credentials.");
}

console.log("OK hosted support_requests exists and anonymous read is denied");
