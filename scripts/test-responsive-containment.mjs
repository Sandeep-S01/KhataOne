import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const reviewQueue = readFileSync("src/app/(dashboard)/dashboard/review-queue/page.tsx", "utf8");
const gstDetail = readFileSync("src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx", "utf8");
const layout = readFileSync("src/app/(dashboard)/dashboard/layout.tsx", "utf8");
const designSystem = readFileSync("src/components/design-system.tsx", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(
  reviewQueue,
  /lg:grid-cols-\[minmax\(0,1fr\)_190px_170px_170px\]/,
  "review filters keep a contained four-column desktop layout below extra-wide screens",
);
assert.match(
  reviewQueue,
  /2xl:grid-cols-\[minmax\(0,1fr\)_190px_160px_160px_150px_150px_auto\]/,
  "review filters use the dense seven-column layout only at extra-wide screens",
);
assert.match(
  reviewQueue,
  /lg:col-span-4 2xl:col-span-1/,
  "review filter actions wrap to their own row before the extra-wide layout",
);
assert.doesNotMatch(
  reviewQueue,
  /(^|\\s)xl:grid-cols-\[minmax\(0,1fr\)_190px_160px_160px_150px_150px_auto\]/,
  "review filters no longer force the dense layout at the 1280px breakpoint",
);

assert.match(
  gstDetail,
  /<PageBody className="grid min-w-0 gap-4 xl:grid-cols-\[minmax\(0,0\.8fr\)_minmax\(0,1\.2fr\)\]">/,
  "GST detail grid allows columns to shrink before table scrolling",
);
assert.match(gstDetail, /<SectionCard title="Period details" className="min-w-0">/, "GST period detail card can shrink inside the grid");
assert.match(gstDetail, /className="min-w-0"\s+title="Saved GST summary"/, "GST saved summary card can shrink inside the grid");
assert.equal((gstDetail.match(/<div className="min-w-0 xl:col-span-2">/g) ?? []).length, 2, "GST table sections are shrinkable full-width grid children");
assert.match(designSystem, /className="max-w-full overflow-x-auto k-scrollbar"/, "DataTable constrains horizontal scrolling to the table region");

assert.match(layout, /className="min-w-11 gap-2 px-2 sm:px-3 md:min-w-9"/, "mobile sign-out control has at least 44px width as well as height");
assert.match(layout, /aria-label="Sign out"/, "sign-out control keeps its accessible name when text is hidden");

assert.equal(packageJson.scripts["test:responsive-containment"], "node scripts/test-responsive-containment.mjs", "package exposes the responsive containment test script");

console.log("Responsive containment source checks passed.");