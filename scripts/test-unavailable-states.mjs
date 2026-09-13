import fs from "node:fs";
import assert from "node:assert/strict";

function read(file) {
  return fs.readFileSync(file, "utf8");
}


function expectNotContains(file, text, message = text) {
  assert.ok(!read(file).includes(text), `${file} should not contain ${message}`);
}

const availability = read("src/lib/availability.ts");
assert.match(availability, /export const unavailableLabel = "Unavailable"/);
assert.match(availability, /result\.error \|\| result\.count === null/);
assert.match(availability, /formatNullableCurrency\(value: number \| null \| undefined\)/);
assert.match(availability, /formatNullablePercent\(value: number \| null \| undefined\)/);

const designSystem = read("src/components/design-system.tsx");
assert.match(
  designSystem,
  /"k-card relative w-full overflow-hidden/,
  "StatTile should not apply hover styling to every static tile.",
);
assert.match(
  designSystem,
  /onClick && "k-card-hover cursor-pointer"/,
  "StatTile hover styling should be limited to interactive tiles.",
);

const overview = read("src/app/(dashboard)/dashboard/page.tsx");
assert.match(overview, /const pendingReviewCount = countOrUnavailable\(pendingReview\)/);
assert.match(overview, /hasUnavailableOverviewCount/);
assert.match(overview, /One or more overview counts could not be loaded\. Refresh to retry\./);
assert.match(overview, /value=\{displayCount\(pendingReviewCount\)\}/);
assert.match(overview, /formatNullablePercent\(item\.confidence_score\)/);
expectNotContains(
  "src/app/(dashboard)/dashboard/page.tsx",
  "Math.round((item.confidence_score ?? 0) * 100)%",
  "Overview should not turn missing confidence into 0%.",
);

const reports = read("src/app/(dashboard)/dashboard/reports/page.tsx");
assert.match(reports, /const approvedCount = countOrUnavailable\(approvedCountResult\)/);
assert.match(reports, /One or more report counts could not be loaded\. Refresh to retry\./);
assert.match(reports, /formatNullableCurrency\(summary\?\.net_tax_payable\)/);
assert.match(reports, /summary\?\.mismatch_count \?\? "Unavailable"/);
assert.doesNotMatch(reports, /catch\(\(\) => null\)/);

const operations = read("src/app/(dashboard)/dashboard/operations/page.tsx");
assert.match(operations, /const failedCount = countOrUnavailable\(failedCountResult\)/);
assert.match(operations, /One or more operations summary reads could not be loaded\. Refresh to retry\./);
assert.match(operations, /Queue health by job type could not be loaded\. Refresh to retry\./);
assert.match(operations, /Processing jobs could not be loaded\. Refresh to retry\./);
assert.doesNotMatch(operations, /failedCount \?\? 0/);
assert.doesNotMatch(operations, /queuedCount \?\? 0/);

const clientDetail = read("src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx");
assert.match(clientDetail, /Client details could not be loaded\. Refresh to retry\./);
assert.match(clientDetail, /const reviewCount = countOrUnavailable\(reviewCountResult\)/);
assert.match(clientDetail, /Recent documents could not be loaded\. Refresh to retry\./);
assert.match(clientDetail, /Client audit history could not be loaded\. Refresh to retry\./);
assert.match(clientDetail, /formatNullableCurrency\(summary\?\.net_tax_payable\)/);

const gstList = read("src/app/(dashboard)/dashboard/gst-summary/page.tsx");
assert.match(gstList, /GST readiness periods could not be loaded\. Refresh to retry\./);
assert.match(gstList, /summary\?\.missing_document_count \?\? "Unavailable"/);
assert.match(gstList, /formatNullableCurrency\(summary\?\.net_tax_payable\)/);

const gstDetail = read("src/app/(dashboard)/dashboard/gst-summary/[periodId]/page.tsx");
assert.match(gstDetail, /formatNullableCurrency\(value as number \| null \| undefined\)/);
assert.match(gstDetail, /Summary unavailable/);
assert.match(gstDetail, /Source transactions could not be loaded\. Refresh to retry\./);
assert.match(gstDetail, /Generation audit could not be loaded\. Refresh to retry\./);
assert.match(gstDetail, /formatTaxTotal\(transaction\)/);

console.log("Unavailable-vs-zero display checks passed.");
