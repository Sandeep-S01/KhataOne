import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const exportsPage = readFileSync("src/app/(dashboard)/dashboard/exports/page.tsx", "utf8");
const exportForm = readFileSync("src/components/export-form.tsx", "utf8");
const gstSummaryPage = readFileSync("src/app/(dashboard)/dashboard/gst-summary/page.tsx", "utf8");
const gstSummaryForm = readFileSync("src/components/gst-summary-form.tsx", "utf8");
const reportsPage = readFileSync("src/app/(dashboard)/dashboard/reports/page.tsx", "utf8");
const auditLogsPage = readFileSync("src/app/(dashboard)/dashboard/audit-logs/page.tsx", "utf8");
const operationsPage = readFileSync("src/app/(dashboard)/dashboard/operations/page.tsx", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

function assertPagedHistory(source, label, basePath, recordLabel) {
  assert.match(source, /const pageSize = 50/, `${label} uses a bounded page size`);
  assert.match(source, /normalizePage\(/, `${label} normalizes page input`);
  assert.match(source, /\.range\(rangeFrom, rangeTo\)/, `${label} requests one bounded lookahead page`);
  assert.match(source, /const hasNextPage = \(.+\?\.length \?\? 0\) > pageSize/, `${label} derives next-page state from lookahead`);
  assert.match(source, new RegExp(`<PaginationControls[\\s\\S]*basePath="${basePath.replaceAll("/", "\\/")}"[\\s\\S]*label="${recordLabel}"`), `${label} exposes pagination controls`);
}

assertPagedHistory(exportsPage, "exports history", "/dashboard/exports", "export jobs");
assert.match(exportsPage, /searchParams: Promise<\{ page\?: string \}>/, "exports history reads page from search params");
assert.match(exportsPage, /Refresh history/, "exports page has an explicit refresh action");
assert.match(exportsPage, /const pageExports = \(exports \?\? \[\]\)\.slice\(0, pageSize\)/, "exports history renders only one page after lookahead");
assert.match(exportsPage, /Newest export jobs are shown first/, "exports history explains ordering");
assert.match(exportsPage, /Refresh history to check whether the private file is ready/, "queued and processing exports tell users how to check readiness");
assert.match(exportsPage, /Queued for generation/, "queued exports have a truthful file-state label");
assert.match(exportsPage, /Generating file/, "processing exports have a truthful file-state label");
assert.match(exportsPage, /Generation failed/, "failed exports have a truthful file-state label");
assert.match(exportsPage, /href=\{`\/api\/exports\/\$\{exportRecord\.id\}\/download`\}/, "completed export downloads still use the private download route");
assert.doesNotMatch(exportsPage, /setInterval|setTimeout|router\.refresh|useEffect/, "R09A does not add unbounded client polling");

assertPagedHistory(gstSummaryPage, "GST period history", "/dashboard/gst-summary", "GST periods");
assert.match(gstSummaryPage, /searchParams: Promise<\{ page\?: string \}>/, "GST period history reads page from search params");
assert.match(gstSummaryPage, /Refresh periods/, "GST period history has an explicit refresh action");
assert.match(gstSummaryPage, /const pagePeriods = \(periods \?\? \[\]\)\.slice\(0, pageSize\)/, "GST period history renders only one page after lookahead");
assert.match(gstSummaryPage, /Newest generated periods are shown first/, "GST period history explains ordering");

assertPagedHistory(reportsPage, "reports GST readiness history", "/dashboard/reports", "report periods");
assert.match(reportsPage, /const pagePeriods = \(periods \?\? \[\]\)\.slice\(0, pageSize\)/, "reports GST readiness history renders only one page after lookahead");
assert.match(reportsPage, /Newest matching periods are shown first/, "reports GST readiness history explains ordering");

assertPagedHistory(auditLogsPage, "audit history", "/dashboard/audit-logs", "audit events");
assert.match(auditLogsPage, /const pageLogs = \(logs \?\? \[\]\)\.slice\(0, pageSize\)/, "audit history renders only one page after lookahead");
assert.match(auditLogsPage, /Newest matching events are shown first/, "audit history explains filtered ordering");
assert.match(auditLogsPage, /action,\s*entity_type: entityType,\s*actor,\s*from,\s*to,/s, "audit pagination preserves active filters");

assertPagedHistory(operationsPage, "operations job history", "/dashboard/operations", "processing jobs");
assert.match(operationsPage, /const pageJobs = \(jobs \?\? \[\]\)\.slice\(0, pageSize\)/, "operations job history renders only one page after lookahead");
assert.match(operationsPage, /Newest matching jobs are shown first/, "operations job history explains filtered ordering");
assert.match(operationsPage, /currentOperationsHref/, "operations refresh preserves the active filter page");
assert.match(operationsPage, /status,\s*job_type: jobType,/s, "operations pagination preserves active filters");

function assertFieldErrors(source, label, prefix, fields) {
  assert.match(source, /const errorId = \(name: string\)/, `${label} creates stable field error ids`);
  assert.match(source, new RegExp(`${prefix}-\\$\\{name\\.replaceAll\\("_", "-"\\)\\}-error`), `${label} scopes error ids`);
  for (const field of fields) {
    assert.match(source, new RegExp(`aria-invalid=\\{Boolean\\(state\\.fieldErrors\\?\\.${field}\\)\\}`), `${label} ${field} marks invalid state`);
    assert.match(source, new RegExp(`aria-describedby=\\{errorId\\("${field}"\\)\\}`), `${label} ${field} is described by its inline error`);
    assert.match(source, new RegExp(`<FieldError id=\\{errorId\\("${field}"\\)\\} message=\\{state\\.fieldErrors\\?\\.${field}\\}`), `${label} ${field} passes matching id to FieldError`);
  }
}

assertFieldErrors(exportForm, "export form", "export", ["export_type", "client_id", "period_start", "period_end", "gst_period_id"]);
assertFieldErrors(gstSummaryForm, "GST summary form", "gst", ["client_id", "period_start", "period_end", "filing_type"]);

assert.equal(packageJson.scripts["test:export-history-visibility"], "node scripts/test-export-history-visibility.mjs", "package exposes the R09 export history test script");

console.log("Export, GST, audit and operations history visibility source checks passed.");