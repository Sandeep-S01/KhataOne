import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function load(path, dependencies = {}) {
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

const retry = load("src/lib/jobs/retry.ts");
assert.equal(retry.retryDelayMs({ attemptCount: 1, random: () => 0 }), 5_000);
assert.equal(retry.retryDelayMs({ attemptCount: 2, random: () => 0 }), 10_000);
assert.equal(
  retry.retryDelayMs({ attemptCount: 1, retryAfterMs: 30_000, random: () => 0 }),
  30_000,
);
assert.equal(
  retry.retryDelayMs({ attemptCount: 10, retryAfterMs: 2_000_000, random: () => 1 }),
  900_000,
);

const provider = load("src/lib/ai/provider-error.ts");
const throttled = provider.classifyOpenAIError({
  status: 429,
  code: "rate_limit_exceeded",
  message: "secret provider response",
  headers: new Headers({ "retry-after": "12" }),
});
assert.equal(throttled.retryable, true);
assert.equal(throttled.retryAfterMs, 12_000);
assert.equal(throttled.message.includes("secret provider response"), false);

const exhausted = provider.classifyOpenAIError({
  status: 429,
  code: "credit_balance_exhausted",
});
assert.equal(exhausted.retryable, false);
assert.equal(exhausted.fallbackAllowed, true);
assert.equal(provider.classifyOpenAIError({ status: 401 }).retryable, false);
assert.equal(
  provider.classifyOpenAIError({ name: "APITimeoutError" }).retryable,
  true,
);

const client = load("src/lib/whatsapp/client.ts", {
  "@/lib/env": {
    getOptionalServerEnv: (name) => ({
      WHATSAPP_ACCESS_TOKEN: "fixture-token",
      WHATSAPP_PHONE_NUMBER_ID: "12345",
      WHATSAPP_GRAPH_API_VERSION: "v21.0",
      WHATSAPP_GRAPH_TIMEOUT_MS: "1000",
    })[name],
  },
});
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (_url, init) => {
    assert.ok(init.signal instanceof AbortSignal);
    return new Response(JSON.stringify({
      error: { code: 4, message: "sensitive upstream detail" },
    }), {
      status: 500,
      headers: { "content-type": "application/json", "retry-after": "7" },
    });
  };
  const graphFailure = await client.sendWhatsAppText({ to: "15550000000", body: "hello" });
  assert.equal(graphFailure.ok, false);
  assert.equal(graphFailure.retryable, true);
  assert.equal(graphFailure.retryAfterMs, 7_000);
  assert.equal(graphFailure.error.includes("sensitive upstream detail"), false);

  globalThis.fetch = async () => new Response(
    JSON.stringify({ messages: [{ id: "wamid.fixture" }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
  assert.deepEqual(
    await client.sendWhatsAppText({ to: "15550000000", body: "hello" }),
    { ok: true, providerMessageId: "wamid.fixture" },
  );
} finally {
  globalThis.fetch = originalFetch;
}

const ingestionSource = readFileSync("src/lib/whatsapp/ingestion.ts", "utf8");
assert.match(ingestionSource, /ack_provider_message_id/);
assert.match(ingestionSource, /!mediaResult\.retryable/);
const processorSource = readFileSync("src/lib/ai/extraction-processor.ts", "utf8");
assert.match(processorSource, /status: "retrying"/);
assert.match(processorSource, /status: "queued"/);
assert.match(processorSource, /scheduled_at: scheduledAt/);

console.log("OK provider deadlines, sanitized errors, classified retries, Retry-After backoff and durable retry scheduling");
