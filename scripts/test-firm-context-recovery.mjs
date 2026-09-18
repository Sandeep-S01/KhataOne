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
let memberships = [
  { firm_id: "firm-a", role: "viewer", firms: { name: "Firm A" } },
  { firm_id: "firm-b", role: "staff", firms: [{ name: "Firm B" }] },
];
let preferredFirmId;
let calls = [];
const cookieStore = {
  get: (name) => {
    calls.push(["cookie.get", name]);
    return preferredFirmId ? { value: preferredFirmId } : undefined;
  },
  set: (name, value, options) => {
    calls.push(["cookie.set", name, value, options]);
    preferredFirmId = value;
  },
};
const supabase = {
  auth: { getUser: async () => {
    calls.push(["getUser"]);
    return { data: { user }, error: authError };
  } },
  from: (table) => {
    calls.push(["from", table]);
    const query = {};
    let requestedFirmId;
    for (const method of ["select", "eq"]) query[method] = (...args) => {
      calls.push([method, ...args]);
      if (method === "eq" && args[0] === "firm_id") requestedFirmId = args[1];
      return query;
    };
    query.order = async (...args) => {
      calls.push(["order", ...args]);
      return { data: memberships, error: membershipError };
    };
    query.maybeSingle = async () => ({
      data: memberships?.find((item) => item.firm_id === requestedFirmId) ?? null,
      error: membershipError,
    });
    return query;
  },
};
const { getFirmContext } = load("src/lib/firms.ts", {
  "next/navigation": { redirect: (path) => { throw new Error(`REDIRECT:${path}`); } },
  "next/headers": { cookies: async () => cookieStore },
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
assert.deepEqual(context.availableFirms, [
  { id: "firm-a", role: "viewer", name: "Firm A" },
  { id: "firm-b", role: "staff", name: "Firm B" },
]);
assert.deepEqual(calls, [["getUser"], ["from", "firm_users"], ["select", "firm_id, role, firms(name)"],
  ["eq", "user_id", "verified-user"], ["eq", "status", "active"],
  ["order", "created_at", { ascending: true }], ["cookie.get", "khataone_active_firm"]]);

preferredFirmId = "firm-b";
assert.deepEqual((await getFirmContext()).firm, { id: "firm-b", role: "staff", name: "Firm B" });
preferredFirmId = "another-firm";
assert.deepEqual((await getFirmContext()).firm, { id: "firm-a", role: "viewer", name: "Firm A" },
  "A stale or forged firm cookie must never select a non-member firm");

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
for (const data of [null, memberships]) {
  const saved = memberships;
  memberships = data;
  membershipError = { message: "PRIVATE database payload" };
  await assert.rejects(getFirmContext(), { message: "Workspace membership could not be verified." });
  memberships = saved;
}
membershipError = null;
memberships = [];
await assert.rejects(getFirmContext(), { message: "REDIRECT:/onboarding" });
memberships = [{ firm_id: "firm-b", role: "staff", firms: [{ name: "Firm B" }] }];
assert.deepEqual((await getFirmContext()).firm, { id: "firm-b", role: "staff", name: "Firm B" });

memberships = [
  { firm_id: "firm-a", role: "viewer", firms: { name: "Firm A" } },
  { firm_id: "firm-b", role: "staff", firms: [{ name: "Firm B" }] },
];
preferredFirmId = "firm-a";
const { switchFirm } = load("src/app/actions/firms.ts", {
  "next/headers": { cookies: async () => cookieStore },
  "next/cache": { revalidatePath: (...args) => calls.push(["revalidatePath", ...args]) },
  "next/navigation": {
    RedirectType: { replace: "replace" },
    redirect: (path, type) => { throw new Error(`REDIRECT:${path}:${type ?? ""}`); },
  },
  "@/lib/auth-deadline": load("src/lib/auth-deadline.ts"),
  "@/lib/firms": { ACTIVE_FIRM_COOKIE: "khataone_active_firm" },
  "@/lib/supabase/server": { createClient: async () => supabase },
});
const validSelection = new FormData();
validSelection.set("firm_id", "firm-b");
calls = [];
await assert.rejects(switchFirm(validSelection), { message: "REDIRECT:/dashboard:replace" });
assert.equal(preferredFirmId, "firm-b");
assert.deepEqual(calls.slice(0, 6), [
  ["getUser"], ["from", "firm_users"], ["select", "firm_id"],
  ["eq", "user_id", "verified-user"], ["eq", "firm_id", "firm-b"],
  ["eq", "status", "active"],
]);
assert.deepEqual((await getFirmContext()).firm, { id: "firm-b", role: "staff", name: "Firm B" });
assert.ok(calls.some(([method, name, value, options]) => method === "cookie.set" &&
  name === "khataone_active_firm" && value === "firm-b" && options.httpOnly &&
  options.sameSite === "lax"));
assert.ok(calls.some(([method, path, type]) => method === "revalidatePath" &&
  path === "/dashboard" && type === "layout"));

const deniedSelection = new FormData();
deniedSelection.set("firm_id", "another-firm");
await assert.rejects(switchFirm(deniedSelection), { message: "Workspace access could not be verified." });
assert.equal(preferredFirmId, "firm-b", "Rejected selection must leave the active firm unchanged");
memberships = [{ firm_id: "firm-a", role: "viewer", firms: { name: "Firm A" } }];
await assert.rejects(switchFirm(validSelection), { message: "Workspace access could not be verified." });
assert.deepEqual((await getFirmContext()).firm, { id: "firm-a", role: "viewer", name: "Firm A" },
  "Revoked membership must not remain selected by a saved cookie");
calls = [];
authError = { status: 503, message: "PRIVATE auth payload" };
await assert.rejects(switchFirm(validSelection), {
  message: "Workspace authentication is temporarily unavailable.",
});
assert.deepEqual(calls, [["getUser"]], "Transient auth errors must not read memberships or change selection");
authError = { status: 401 };
await assert.rejects(switchFirm(validSelection), { message: "REDIRECT:/login:" });
authError = null;
configured = false;
calls = [];
assert.equal(await getFirmContext(), null);
assert.deepEqual(calls, []);
console.log("OK firm-context recovery, membership-checked firm switching, roles and error privacy");
