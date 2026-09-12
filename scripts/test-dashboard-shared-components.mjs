import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function read(path) {
  return readFileSync(path, "utf8");
}

const designSystem = read("src/components/design-system.tsx");
const globalStyles = read("src/app/globals.css");
const formatSource = read("src/lib/format.ts");
const overview = read("src/app/(dashboard)/dashboard/page.tsx");
const clientDetail = read("src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx");
const operations = read("src/app/(dashboard)/dashboard/operations/page.tsx");

assert.match(designSystem, /singularLabel = label === "records" \? "record"/);
assert.match(designSystem, /value === 1 && singularLabel/);
assert.match(designSystem, /Page \{page\} - \{label\}/);
assert.match(designSystem, /h-11 w-full[\s\S]*md:h-9 md:text-sm/);
assert.match(designSystem, /sm: "h-11 px-3 text-xs md:h-8"/);
assert.match(designSystem, /inline-flex h-11 items-center[\s\S]*opacity-60 md:h-8/);
assert.match(designSystem, /icon: "h-11 w-11 p-0 md:h-9 md:w-9"/);
assert.match(designSystem, /px-6 py-10 text-center md:py-12/);
assert.match(designSystem, /Omit<ComponentPropsWithoutRef<typeof Link>/);
assert.match(globalStyles, /\.k-card \{[\s\S]*border-radius: 0\.5rem;/);
assert.match(overview, /aria-label=\{item\.actionLabel\}/);
assert.ok(!clientDetail.includes('|| "Pending"'));
assert.match(operations, /return "No samples"/);
assert.match(operations, />No action<\/span>/);

const transpiled = ts.transpileModule(formatSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const formatModule = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`
);

assert.equal(formatModule.formatDisplayDate("2026-08-11"), "11 Aug 2026");
assert.equal(formatModule.formatDisplayDate("2026-02-30"), "Not provided");
assert.equal(formatModule.formatDisplayDate(null), "Not provided");
assert.equal(
  formatModule.formatDisplayDateTime("2026-09-12T13:11:00.000Z"),
  "12 Sept 2026, 06:41 pm",
);
assert.equal(
  formatModule.formatDisplayDateRange("2026-08-01", "2026-08-31"),
  "01 Aug 2026 to 31 Aug 2026",
);
assert.equal(
  formatModule.formatDisplayDateRange("2026-08-01", "invalid"),
  "Not provided",
);

console.log("OK dashboard shared component checks passed");
