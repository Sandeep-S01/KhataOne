import assert from "node:assert/strict";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { NextResponse } from "next/server.js";
import ts from "typescript";

function load(path, dependencies) {
  const mod = { exports: {} };
  const js = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", js)(
    (id) => {
      assert.ok(id in dependencies, `Unexpected dependency: ${id}`);
      return dependencies[id];
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}

let environment = {};
let rpcResult = {
  data: [{ allowed: true, remaining: 4, reset_at: new Date(Date.now() + 60_000).toISOString() }],
  error: null,
};
const rpcCalls = [];
let hasAdmin = true;
const rateLimit = load("src/lib/rate-limit.ts", {
  "node:crypto": { createHmac },
  "@/lib/env": { getOptionalServerEnv: (key) => environment[key] },
  "@/lib/supabase/server": {
    createAdminClient: () =>
      hasAdmin
        ? {
            rpc: async (name, args) => {
              rpcCalls.push([name, args]);
              return rpcResult;
            },
          }
        : null,
  },
});

const local = await rateLimit.checkRateLimit({
  key: "local:fixture",
  limit: 2,
  windowMs: 60_000,
});
assert.equal(local.ok, true);
assert.equal(local.source, "local");
assert.equal(rpcCalls.length, 0);

environment.RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT = "true";
const requiredButMissing = await rateLimit.checkRateLimit({
  key: "required:missing",
  limit: 5,
  windowMs: 60_000,
});
assert.equal(requiredButMissing.available, false);
environment.RATE_LIMIT_REQUIRE_SHARED_ENFORCEMENT = "false";

environment.RATE_LIMIT_SHARED_ENFORCEMENT = "shared-store";
environment.RATE_LIMIT_KEY_SECRET = "rate-limit-fixture-secret-32-characters";
const rawKey = "lead-request:203.0.113.8";
const shared = await rateLimit.checkRateLimit({
  key: rawKey,
  limit: 5,
  windowMs: 60_000,
});
assert.equal(shared.ok, true);
assert.equal(shared.available, true);
assert.equal(shared.source, "shared-store");
assert.equal(rpcCalls[0][0], "consume_rate_limit");
assert.equal(
  rpcCalls[0][1].target_key_hash,
  createHmac("sha256", environment.RATE_LIMIT_KEY_SECRET).update(rawKey).digest("hex"),
);
assert.ok(!JSON.stringify(rpcCalls[0][1]).includes("203.0.113.8"));

rpcResult = { data: null, error: { message: "missing migration" } };
const unavailable = await rateLimit.checkRateLimit({
  key: "shared:unavailable",
  limit: 5,
  windowMs: 60_000,
});
assert.equal(unavailable.ok, false);
assert.equal(unavailable.available, false);

hasAdmin = false;
const unconfigured = await rateLimit.checkRateLimit({
  key: "shared:no-admin",
  limit: 5,
  windowMs: 60_000,
});
assert.equal(unconfigured.available, false);

const healthAuth = load("src/lib/health-auth.ts", {
  "node:crypto": { createHash, timingSafeEqual },
  "@/lib/env": { getOptionalServerEnv: (key) => environment[key] },
});
environment = { VERCEL_ENV: "production" };
assert.deepEqual(
  healthAuth.authorizeReadinessRequest(new Request("https://example.test")),
  { authorized: false, configured: false, required: true },
);

environment.READINESS_CHECK_SECRET = "readiness-fixture-secret-32-characters";
assert.equal(
  healthAuth.authorizeReadinessRequest(
    new Request("https://example.test", {
      headers: { authorization: "Bearer wrong" },
    }),
  ).authorized,
  false,
);
assert.equal(
  healthAuth.authorizeReadinessRequest(
    new Request("https://example.test", {
      headers: { authorization: "Bearer readiness-fixture-secret-32-characters" },
    }),
  ).authorized,
  true,
);

environment = {};
assert.deepEqual(
  healthAuth.authorizeReadinessRequest(new Request("https://example.test")),
  { authorized: true, configured: false, required: false },
);

for (const path of [
  "src/app/api/health/route.ts",
  "src/app/api/health/ready/route.ts",
]) {
  let authorization = { authorized: false, configured: true };
  let readinessBuilds = 0;
  const route = load(path, {
    "next/server": { NextResponse },
    "@/lib/health": {
      buildReadinessHealth: async () => {
        readinessBuilds += 1;
        return { status: "ok", checks: [] };
      },
      healthStatusCode: () => 200,
    },
    "@/lib/health-auth": {
      authorizeReadinessRequest: () => authorization,
    },
  });
  const request = new Request("https://example.test/api/health/ready");
  const denied = await route.GET(request);
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get("cache-control"), "private, no-store");
  assert.equal(readinessBuilds, 0);

  authorization = { authorized: true, configured: true };
  const allowed = await route.GET(request);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("cache-control"), "private, no-store");
  assert.equal(readinessBuilds, 1);
}

const smokeSource = readFileSync("scripts/smoke-local.mjs", "utf8");
assert.match(smokeSource, /process\.env\.READINESS_CHECK_SECRET/);
assert.match(smokeSource, /Authorization: `Bearer \$\{readinessSecret\}`/);

console.log(
  "OK shared-store adapter, hashed keys, fail-closed protection and readiness authorization",
);
