import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("src/lib/personal-preferences.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledModule = { exports: {} };
new Function("module", "exports", compiled)(compiledModule, compiledModule.exports);

const { parseStartPage, startPageCookieName, startPagePath } = compiledModule.exports;

assert.equal(startPagePath("review"), "/dashboard/review-queue");
assert.equal(startPagePath("inbox"), "/dashboard/inbox");
assert.equal(startPagePath("overview"), "/dashboard");
for (const untrusted of [undefined, "", "/dashboard/settings", "//evil.example", "https://evil.example", "admin"]) {
  assert.equal(parseStartPage(untrusted), "overview");
  assert.equal(startPagePath(untrusted), "/dashboard");
}
assert.notEqual(startPageCookieName("member-a"), startPageCookieName("member-b"));

console.log("OK personal start-page preferences stay on allowlisted dashboard routes");
