import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const mod = { exports: {} };
const js = ts.transpileModule(
  readFileSync("src/lib/jobs/keyed-worker-pool.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
new Function("module", "exports", js)(mod, mod.exports);
const { runKeyedWorkerPool } = mod.exports;

const items = [
  { id: "a1", key: "a", delay: 25 },
  { id: "b1", key: "b", delay: 20 },
  { id: "a2", key: "a", delay: 1 },
  { id: "c1", key: "c", delay: 15 },
  { id: "b2", key: "b", delay: 1 },
  { id: "d1", key: "d", delay: 1 },
];
const activeKeys = new Set();
const starts = [];
let active = 0;
let maximumActive = 0;

const results = await runKeyedWorkerPool({
  items,
  concurrency: 3,
  keyFor: (item) => item.key,
  worker: async (item) => {
    assert.equal(activeKeys.has(item.key), false, `overlap for key ${item.key}`);
    activeKeys.add(item.key);
    starts.push(item.id);
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, item.delay));
    active -= 1;
    activeKeys.delete(item.key);
    return `done:${item.id}`;
  },
});

assert.equal(maximumActive, 3);
assert.ok(starts.indexOf("a1") < starts.indexOf("a2"));
assert.ok(starts.indexOf("b1") < starts.indexOf("b2"));
assert.deepEqual(results, items.map((item) => `done:${item.id}`));
assert.deepEqual(await runKeyedWorkerPool({
  items: [],
  concurrency: 3,
  keyFor: () => "unused",
  worker: async () => "unused",
}), []);

for (const [path, expected] of [
  ["src/lib/whatsapp/ingestion-worker.ts", /INGESTION_CONCURRENCY = 3/],
  ["src/lib/ai/extraction-worker.ts", /AI_EXTRACTION_CONCURRENCY = 2/],
  ["src/app/api/webhooks/whatsapp/route.ts", /concurrency: 2/],
]) {
  assert.match(readFileSync(path, "utf8"), expected);
}

console.log("OK keyed concurrency cap, same-key ordering, cross-key progress and deterministic result order");
