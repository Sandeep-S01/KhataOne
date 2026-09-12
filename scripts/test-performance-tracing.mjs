import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync("src/lib/performance.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { withServerTiming, createPerformanceContext, classifyRequest } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const output = [];
const originalLog = console.info;
console.info = (_, json) => output.push(JSON.parse(json));
try {
  process.env.KHATAONE_PERF_DIAGNOSTICS = "1";
  process.env.KHATAONE_PERF_SAMPLE_RATE = "1";
  assert.equal(classifyRequest(new Headers()), "unclassified_get");
  assert.equal(classifyRequest(new Headers({ accept: "text/html" })), "html_navigation");
  assert.equal(classifyRequest(new Headers({ rsc: "1" })), "client_navigation");
  assert.equal(classifyRequest(new Headers({ "next-router-prefetch": "1" })), "rsc_prefetch");
  assert.equal(classifyRequest(new Headers({ "next-router-prefetch": "1", "next-router-segment-prefetch": "/_tree" })), "rsc_tree_prefetch");
  assert.equal(classifyRequest(new Headers(), "POST"), "mutation");
  const a = createPerformanceContext(new Headers());
  const b = createPerformanceContext(new Headers());
  assert.notEqual(a.requestId, b.requestId);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const slow = withServerTiming("slow", async () => { await gate; return 7; }, {}, a);
  assert.equal(await withServerTiming("fast", async () => 3, {}, a), 3);
  release();
  assert.equal(await slow, 7);
  assert.equal(output[0].call, 2);
  assert.equal(output[1].call, 1);
  assert.equal(output[0].request_id, output[1].request_id);
  await withServerTiming("api_error", async () => ({ error: { message: "PRIVATE" } }), {}, b);
  await assert.rejects(withServerTiming("throw", async () => { throw Error("SECRET"); }, {}, b));
  assert.equal(output[2].status, "error");
  assert.equal(output[3].status, "exception");
  assert.ok(!JSON.stringify(output).match(/PRIVATE|SECRET/));
  a.calls = 64;
  let executed = 0;
  await withServerTiming("bounded", async () => ++executed, {}, a);
  process.env.KHATAONE_PERF_SAMPLE_RATE = "0";
  await withServerTiming("unsampled", async () => ++executed, {}, createPerformanceContext(new Headers()));
  process.env.KHATAONE_PERF_DIAGNOSTICS = "0";
  await withServerTiming("disabled", async () => ++executed);
  assert.equal(executed, 3);
  assert.equal(output.length, 4);
} finally {
  console.info = originalLog;
}
console.log("OK tracing classification, concurrent correlation, errors, privacy, sampling and bounds");
