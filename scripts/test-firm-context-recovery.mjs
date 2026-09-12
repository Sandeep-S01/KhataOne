import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function load(path, dependencies = {}) {
  const loadedModule = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

let configured = true;
let authError = null;
let membershipError = null;
let user = { id: "verified-user" };
let membership = { firm_id: "firm-a", role: "viewer", firms: { name: "Firm A" } };
let calls = [];
const supabase = {
  auth: { getUser: async () => {
    calls.push(["getUser"]);
    return { data: { user }, error: authError };
  } },
  from: (table) => {
    calls.push(["from", table]);
    const query = {};
    for (const method of ["select", "eq", "limit"]) query[method] = (...args) => {
      calls.push([method, ...args]);
      return query;
    };
    query.maybeSingle = async () => ({ data: membership, error: membershipError });
    return query;
  },
};
const { getFirmContext } = load("src/lib/firms.ts", {
  "next/navigation": { redirect: (path) => { throw new Error(`REDIRECT:${path}`); } },
  // This exercises loader decisions, not React's request-scoped cache implementation.
  react: { cache: (fn) => fn },
  "@/lib/auth-deadline": load("src/lib/auth-deadline.ts"),
  "@/lib/env": { hasSupabaseConfig: () => configured },
  "@/lib/request-performance": { withServerTiming: (_, operation) => operation() },
  "@/lib/supabase/server": { createClient: async () => supabase },
});

const context = await getFirmContext();
assert.deepEqual(context.firm, { id: "firm-a", role: "viewer", name: "Firm A" });
assert.equal(context.userId, user.id);
assert.equal(context.supabase, supabase);
assert.deepEqual(calls, [["getUser"], ["from", "firm_users"], ["select", "firm_id, role, firms(name)"],
  ["eq", "user_id", "verified-user"], ["eq", "status", "active"], ["limit", 1]]);

for (const error of [{ name: "AuthRetryableFetchError", status: 503 }, { status: 429 }, { status: 0 }]) {
  calls = [];
  authError = { ...error, message: "PRIVATE auth payload" };
  await assert.rejects(getFirmContext(), { message: "Workspace authentication is temporarily unavailable." });
  assert.deepEqual(calls, [["getUser"]], "No membership reads after failed authentication");
}
for (const error of [{ name: "AuthSessionMissingError" }, { status: 401 }, { code: "session_expired" }]) {
  calls = [];
  authError = error;
  await assert.rejects(getFirmContext(), { message: "REDIRECT:/login" });
  assert.deepEqual(calls, [["getUser"]]);
}
authError = null;
user = null;
await assert.rejects(getFirmContext(), { message: "REDIRECT:/login" });
user = { id: "verified-user" };
for (const data of [null, membership]) {
  const saved = membership;
  membership = data;
  membershipError = { message: "PRIVATE database payload" };
  await assert.rejects(getFirmContext(), { message: "Workspace membership could not be verified." });
  membership = saved;
}
membershipError = null;
membership = null;
await assert.rejects(getFirmContext(), { message: "REDIRECT:/onboarding" });
membership = { firm_id: "firm-b", role: "staff", firms: [{ name: "Firm B" }] };
assert.deepEqual((await getFirmContext()).firm, { id: "firm-b", role: "staff", name: "Firm B" });
configured = false;
calls = [];
assert.equal(await getFirmContext(), null);
assert.deepEqual(calls, []);
console.log("OK firm-context recovery, invalid sessions, active membership scope, roles and error privacy");
