import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");
let currentUser = null;
let authCalls = 0;
let authError = null;
let authMode = "normal";
let lateCookies;
let authFetch;
const deadlineModule = { exports: {} };
const deadlineCode = ts.transpileModule(readFileSync("src/lib/auth-deadline.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function("module", "exports", deadlineCode)(deadlineModule, deadlineModule.exports);
const loadedModule = { exports: {} };
const code = ts.transpileModule(readFileSync("src/lib/supabase/middleware.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const dependencies = {
  "next/server": { NextResponse },
  "@/lib/auth-deadline": {
    ...deadlineModule.exports,
    withAuthDeadline: (operation) => deadlineModule.exports.withAuthDeadline(operation, 20),
  },
  "@/lib/env": { hasSupabaseConfig: () => true, getPublicEnv: () => ({ supabaseUrl: "https://example.test", supabaseAnonKey: "test" }) },
  "@/lib/performance": {
    createPerformanceContext: () => ({ requestId: "trusted-id", sampled: true }),
    withServerTiming: (_, operation) => operation(),
  },
  "@supabase/ssr": {
    createServerClient: (_, __, options) => ({ auth: { getUser: async () => {
      authCalls++;
      lateCookies = options.cookies;
      authFetch = options.global.fetch;
      if (authMode === "transport") await authFetch("https://example.test/auth/v1/user");
      if (authMode === "stall") await new Promise(() => {});
      if (authMode === "throw") throw new Error("PRIVATE upstream error");
      options.cookies.setAll([{ name: "test-refresh", value: "rotated", options: { httpOnly: true, path: "/" } }]);
      return { data: { user: currentUser }, error: authError };
    } } }),
  },
};
new Function("require", "module", "exports", code)((id) => {
  assert.ok(id in dependencies, `Unexpected dependency ${id}`);
  return dependencies[id];
}, loadedModule, loadedModule.exports);
for (const headers of [{}, { rsc: "1", "next-router-prefetch": "1" }]) {
  const response = await loadedModule.exports.updateSession(new NextRequest("https://example.test/dashboard/review-queue", { headers }));
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location")).pathname, "/login");
  assert.equal(response.cookies.get("test-refresh").value, "rotated");
}
currentUser = { id: "verified-user" };
const loginResponse = await loadedModule.exports.updateSession(new NextRequest("https://example.test/login"));
assert.equal(new URL(loginResponse.headers.get("location")).pathname, "/dashboard");
assert.equal(loginResponse.cookies.get("test-refresh").value, "rotated");
const request = new NextRequest("https://example.test/dashboard", { headers: { "x-khataone-perf-id": "spoofed" } });
const response = await loadedModule.exports.updateSession(request);
assert.equal(response.status, 200);
assert.equal(request.headers.get("x-khataone-perf-id"), "trusted-id");
assert.equal(response.headers.get("x-middleware-request-x-khataone-perf-id"), "trusted-id");
assert.ok(response.headers.get("server-timing").startsWith("middleware_auth;dur="));
assert.equal(authCalls, 4);
for (const error of [{ name: "AuthRetryableFetchError", status: 503 }, { status: 429 }, { status: 0 }]) {
  authError = error;
  for (const headers of [{}, { rsc: "1", "next-router-prefetch": "1" }]) {
    const unavailable = await loadedModule.exports.updateSession(new NextRequest("https://example.test/dashboard", { headers }));
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get("location"), null);
    assert.equal(unavailable.headers.get("x-middleware-next"), null);
    assert.equal(unavailable.headers.get("cache-control"), "private, no-store");
    assert.equal(unavailable.headers.get("retry-after"), "5");
    assert.equal(unavailable.cookies.get("test-refresh").value, "rotated");
  }
}
authError = { name: "AuthSessionMissingError", status: 400 };
assert.equal((await loadedModule.exports.updateSession(new NextRequest("https://example.test/dashboard"))).status, 307);
authError = null;
for (const mode of ["stall", "throw"]) {
  authMode = mode;
  const unavailable = await loadedModule.exports.updateSession(new NextRequest("https://example.test/dashboard"));
  assert.equal(unavailable.status, 503);
  assert.ok(!(await unavailable.text()).includes("PRIVATE"));
  lateCookies.setAll([{ name: "late", value: "must-not-escape" }]);
  assert.equal(unavailable.cookies.get("late"), undefined);
}
let aborted = false;
await assert.rejects(deadlineModule.exports.withAuthDeadline((signal) => new Promise(() => {
  signal.addEventListener("abort", () => { aborted = true; });
}), 10), { name: "AuthDeadlineError" });
assert.equal(aborted, true);
const originalFetch = globalThis.fetch;
let transportAborted = false;
try {
  globalThis.fetch = async (_, init) => new Promise((_, reject) => {
    init.signal.addEventListener("abort", () => {
      transportAborted = true;
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
  authMode = "transport";
  const unavailable = await loadedModule.exports.updateSession(new NextRequest("https://example.test/dashboard"));
  assert.equal(unavailable.status, 503);
  assert.equal(transportAborted, true);
  await assert.rejects(authFetch("https://example.test/auth/v1/user"), { name: "AbortError" });
} finally {
  globalThis.fetch = originalFetch;
}
if (process.argv.includes("--built")) {
  const manifest = JSON.parse(readFileSync(".next/server/middleware-manifest.json", "utf8"));
  const entries = Object.values(manifest.middleware);
  assert.equal(entries.length, 1, "Production build must register the auth middleware");
  assert.deepEqual(entries[0].matchers.map((matcher) => matcher.originalSource), [
    "/dashboard/:path*", "/onboarding/:path*", "/login", "/signup",
  ]);
}
console.log("OK HTML/prefetch auth, cookies, diagnostics, private 503, deadline and transport cancellation");
