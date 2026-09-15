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
const reviewQueue = read("src/app/(dashboard)/dashboard/review-queue/page.tsx");
const clientDetail = read("src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx");
const ledger = read("src/app/(dashboard)/dashboard/ledger/page.tsx");
const operations = read("src/app/(dashboard)/dashboard/operations/page.tsx");
const exportForm = read("src/components/export-form.tsx");
const documentEvidencePanel = read("src/components/document-evidence-panel.tsx");
const statusChip = read("src/components/status-chip.tsx");
const reviewWorkspace = read("src/components/transaction-review-workspace.tsx");
const landingPage = read("src/app/page.tsx");

assert.match(designSystem, /singularLabel = label === "records" \? "record"/);
assert.match(designSystem, /value === 1 && singularLabel/);
assert.match(designSystem, /Page \{page\} - \{label\}/);
assert.match(designSystem, /h-11 w-full[\s\S]*placeholder:text-khata-muted[\s\S]*md:h-9 md:text-sm/);
assert.match(designSystem, /sm: "h-11 px-3 text-xs md:h-8"/);
assert.match(designSystem, /inline-flex h-11 items-center[\s\S]*opacity-60 md:h-8/);
assert.match(designSystem, /icon: "h-11 w-11 p-0 md:h-9 md:w-9"/);
assert.match(designSystem, /px-6 py-10 text-center md:py-12/);
assert.match(designSystem, /export const functionalIconClassName = "size-4 shrink-0"/);
assert.match(designSystem, /export const functionalIconStrokeWidth = 2/);
assert.match(designSystem, /export const RetryIcon = RefreshCw/);
assert.match(designSystem, /export function InputWithIcon/);
assert.match(designSystem, /export function FilterField/);
assert.match(designSystem, /export function FilterGrid/);
assert.match(designSystem, /export function FilterActions/);
assert.match(designSystem, /export function TableToolbar/);
assert.match(designSystem, /export const externalActionLinkClassName = cn\(/);
assert.match(designSystem, /export const panelTitleClassName =/);
assert.match(designSystem, /export const mutedPanelClassName =/);
assert.match(designSystem, /export type StatusBadgeTone = keyof typeof statusBadgeToneClasses/);
assert.match(designSystem, /brand: "border-khata-green\/30 bg-khata-green\/10 text-khata-green"/);
assert.match(designSystem, /<span className="num text-xs text-khata-muted">/);
assert.match(designSystem, /Omit<ComponentPropsWithoutRef<typeof Link>/);
assert.match(statusChip, /StatusBadge/);
assert.doesNotMatch(statusChip, /toneClasses/);
assert.match(ledger, /<StatusBadge[\s\S]*tone="neutral"[\s\S]*\{filter\}/);
assert.doesNotMatch(ledger, /rounded-md border border-khata-border bg-khata-paperMuted px-2 py-1 text-xs font-medium text-khata-muted/);
assert.match(reviewWorkspace, /<FormMessage[\s\S]*message=\{unsavedDecisionMessage\}[\s\S]*tone="warning"[\s\S]*role="status"/);
assert.doesNotMatch(reviewWorkspace, /border-warning\/30 bg-warning\/10 px-3 py-2/);
assert.match(exportForm, /functionalIconClassName/);
assert.match(exportForm, /functionalIconStrokeWidth/);
assert.doesNotMatch(exportForm, /size-3\.5/);
assert.match(landingPage, /Book a demo[\s\S]*functionalIconClassName/);
assert.doesNotMatch(landingPage, /ArrowRight className="size-4"/);
assert.match(documentEvidencePanel, /externalActionLinkClassName/);
assert.match(documentEvidencePanel, /mutedPanelClassName/);
assert.doesNotMatch(documentEvidencePanel, /rounded-md border border-khata-border bg-khata-paperMuted px-3 py-3 text-sm leading-6 text-khata-muted/);
assert.match(operations, /<RetryIcon[\s\S]*functionalIconClassName[\s\S]*functionalIconStrokeWidth/);
assert.doesNotMatch(operations, /RefreshCw className="size-4"/);
assert.doesNotMatch(designSystem, /MonoClassName/);
assert.match(globalStyles, /\.k-card \{[\s\S]*border-radius: 0\.75rem;/);
assert.match(globalStyles, /--background: #f8fafc/);
assert.match(globalStyles, /--primary: #0a5c36/);
assert.match(overview, /tags=\{\[/);
assert.match(overview, /actionLabel="View review queue"/);
assert.match(overview, /sm:grid-cols-\[auto_minmax\(0,1fr\)_auto\]/);
assert.match(reviewQueue, /<FilterGrid className="xl:grid-cols-\[minmax\(260px,1fr\)_180px_160px_160px_160px_160px\]">/);
assert.match(reviewQueue, /<FilterField label="Search" htmlFor="review-search">/);
assert.match(reviewQueue, /<InputWithIcon/);
assert.match(reviewQueue, /<FilterActions className="lg:justify-end">/);
assert.match(reviewQueue, /<Button type="submit" size="md" className="min-w-24">/);
assert.match(reviewQueue, /<ActionLink href="\/dashboard\/review-queue" size="md" className="min-w-20">/);
assert.match(reviewQueue, /<TableToolbar/);
assert.match(reviewQueue, /Open exports/);
assert.doesNotMatch(reviewQueue, /Bulk Approve/);
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
