import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

const exportForm = read("src/components/export-form.tsx");
const exportAction = read("src/app/actions/exports.ts");
const exportsPage = read("src/app/(dashboard)/dashboard/exports/page.tsx");
const operationsPage = read("src/app/(dashboard)/dashboard/operations/page.tsx");
const operationsActions = read("src/app/actions/operations.ts");
const gstForm = read("src/components/gst-summary-form.tsx");
const gstPage = read("src/app/(dashboard)/dashboard/gst-summary/page.tsx");

assert.match(exportForm, /useState<ExportType>\("csv_transactions"\)/);
assert.match(exportForm, /isTransactionExport \? \(/);
assert.match(exportForm, /Queue export/);
assert.equal((exportForm.match(/name="gst_period_id"/g) ?? []).length, 1);
assert.match(exportAction, /exportType === "csv_transactions"/);
assert.match(exportAction, /queue_dashboard_export/);

for (const status of ["queued", "processing", "completed", "failed"]) {
  assert.ok(exportsPage.includes(`case "${status}"`) || exportsPage.includes(`=== "${status}"`));
}

assert.match(operationsPage, /href="\/dashboard\/operations\?status=failed"/);
assert.match(operationsPage, /View failed jobs/);
assert.match(operationsActions, /runExtractionJobNowAction/);
assert.match(operationsActions, /runExportGenerationJobNowAction/);

assert.match(gstForm, /Custom period start/);
assert.match(gstForm, /Custom period end/);
assert.ok(!gstForm.includes("<InfoNote>"));
assert.match(gstPage, /custom date range/);
assert.match(gstPage, /it does not submit GST filings/);

console.log("OK dashboard workflow clarity checks passed");
