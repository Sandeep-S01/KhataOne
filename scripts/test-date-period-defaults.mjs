import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const loader = String.raw`
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const ts = require("typescript");
const requireFromCwd = createRequire(process.cwd() + "/");
const loadedModule = { exports: {} };
const code = ts.transpileModule(readFileSync("src/lib/format.ts", "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
new Function("require", "module", "exports", code)(
  (name) => requireFromCwd(name),
  loadedModule,
  loadedModule.exports,
);
const { auditDateOnlyToIndiaUtcRange, currentMonthDateRange } = loadedModule.exports;
assert.deepEqual(
  currentMonthDateRange(new Date("2026-09-13T06:00:00Z")),
  { start: "2026-09-01", end: "2026-09-30" },
);
assert.deepEqual(
  currentMonthDateRange(new Date("2024-02-15T12:00:00Z")),
  { start: "2024-02-01", end: "2024-02-29" },
);
assert.deepEqual(
  currentMonthDateRange(new Date("2026-12-31T12:00:00Z")),
  { start: "2026-12-01", end: "2026-12-31" },
);
assert.deepEqual(
  auditDateOnlyToIndiaUtcRange("2026-09-13"),
  { start: "2026-09-12T18:30:00.000Z", end: "2026-09-13T18:29:59.999Z" },
);
assert.deepEqual(
  auditDateOnlyToIndiaUtcRange("2024-02-29"),
  { start: "2024-02-28T18:30:00.000Z", end: "2024-02-29T18:29:59.999Z" },
);
assert.equal(auditDateOnlyToIndiaUtcRange("2026-02-29"), null);
`;

for (const timeZone of ["UTC", "Asia/Calcutta"]) {
  const result = spawnSync(process.execPath, ["-e", loader], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TZ: timeZone,
    },
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    `date-only defaults failed for ${timeZone}\n${result.stderr}`,
  );
}

const auditPage = await import("node:fs").then(({ readFileSync }) =>
  readFileSync("src/app/(dashboard)/dashboard/audit-logs/page.tsx", "utf8"),
);

assert.match(
  auditPage,
  /auditDateOnlyToIndiaUtcRange\(from\)[\s\S]*query = query\.gte\("created_at", fromRange\.start\)/,
  "Audit Logs From filter must use India calendar-day UTC start.",
);
assert.match(
  auditPage,
  /auditDateOnlyToIndiaUtcRange\(to\)[\s\S]*query = query\.lte\("created_at", toRange\.end\)/,
  "Audit Logs To filter must use India calendar-day UTC end.",
);
assert(
  auditPage.includes("Date filters use India calendar days."),
  "Audit Logs page must disclose date-filter semantics.",
);

console.log("OK date-only month defaults and audit India-day timestamp ranges");
