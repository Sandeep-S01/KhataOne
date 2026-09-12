import assert from "node:assert/strict";
import { captureRequestTiming, captureResponseEvidence, readResponseEvidence } from "./dashboard-response-evidence.mjs";

const id = "12345678-1234-1234-1234-123456789abc";
const requestedHeaders = [];
const response = {
  status: () => 503,
  headerValue: async (name) => {
    requestedHeaders.push(name);
    return { "x-khataone-perf-id": id, "x-vercel-id": "bom1::hnd1::test-123",
      "cache-control": "private, no-cache, no-store, max-age=0" }[name];
  },
};
assert.deepEqual(await readResponseEvidence(response), {
  status: 503, request_id: id, vercel_id: "bom1::hnd1::test-123", private_no_store: true,
});
assert.deepEqual(requestedHeaders.sort(), ["cache-control", "x-khataone-perf-id", "x-vercel-id"]);
assert.deepEqual(await readResponseEvidence({ status: () => 200, headerValue: async () => "PRIVATE secret payload" }), {
  status: 200, request_id: null, vercel_id: null, private_no_store: false,
});
const pending = new Set();
const record = {};
captureResponseEvidence(response, record, pending);
await Promise.all([...pending]);
assert.equal(record.response.status, 503);
const failed = {};
captureResponseEvidence({ headerValue: async () => { throw Error("SECRET"); } }, failed, pending);
await Promise.all([...pending]);
assert.deepEqual(failed, { response_evidence_unavailable: true });
captureResponseEvidence(response, undefined, pending);
await Promise.resolve();
assert.equal(pending.size, 0);
let release;
const gate = new Promise((resolve) => { release = resolve; });
const slow = {};
const fast = {};
captureResponseEvidence({ ...response, headerValue: async (name) => {
  await gate;
  return response.headerValue(name);
} }, slow, pending);
captureResponseEvidence({ ...response, status: () => 200 }, fast, pending);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(fast.response.status, 200);
assert.equal(slow.response, undefined);
release();
await Promise.all([...pending]);
assert.equal(slow.response.status, 503);
const cancelled = { network_failed: true };
captureRequestTiming({ timing: () => ({ startTime: 1000, requestStart: 2, responseStart: 200, responseEnd: -1,
  domainLookupStart: -1, domainLookupEnd: -1, connectStart: -1, connectEnd: -1, secureConnectionStart: -1,
  secret: "PRIVATE" }) }, cancelled);
assert.deepEqual(cancelled, { network_failed: true, network: {
  start_unix_ms: 1000, request_start_ms: 2, response_start_ms: 200, response_end_ms: -1,
  dns_start_ms: -1, dns_end_ms: -1, connect_start_ms: -1, connect_end_ms: -1, tls_start_ms: -1,
} });
console.log("OK response IDs, status, cache flags, privacy allowlist and cancelled-header handling");
