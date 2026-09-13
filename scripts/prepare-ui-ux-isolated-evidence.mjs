import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const outputRoot =
  process.argv[2] ??
  "docs/audits/ui-ux/2026-09-13-diagnosis/evidence/isolated-verification";

const findingIds = Array.from({ length: 27 }, (_, index) =>
  `KO-UX-${String(index + 1).padStart(3, "0")}`,
);

const viewports = [320, 390, 768, 1024, 1280, 1440, 1920];
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
const authenticatedRoutes = [
  "/dashboard",
  "/dashboard/inbox",
  "/dashboard/review-queue",
  "/dashboard/review-queue/[transactionId]",
  "/dashboard/clients",
  "/dashboard/clients/[clientId]",
  "/dashboard/ledger",
  "/dashboard/ledger/[entryId]",
  "/dashboard/gst-summary",
  "/dashboard/gst-summary/[periodId]",
  "/dashboard/reports",
  "/dashboard/exports",
  "/dashboard/audit-logs",
  "/dashboard/operations",
  "/dashboard/settings",
];

function writeJson(relativePath, data) {
  const path = join(outputRoot, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

mkdirSync(join(outputRoot, "screenshots"), { recursive: true });

writeJson("run-summary.json", {
  status: "pending",
  created_at: new Date().toISOString(),
  environment: {
    type: "isolated-local-or-staging",
    base_url: "REPLACE_WITH_ISOLATED_BASE_URL",
    production_data_used: false,
    live_credentials_used: false,
    workers_enabled_for_specific_tests_only: false,
  },
  candidate: {
    commit: "REPLACE_WITH_CANDIDATE_COMMIT",
    migration_required: "20260913110000_complete_dashboard_filtered_results.sql",
  },
  safety_notes: [
    "Do not store passwords, access tokens, signed URLs, phone numbers or private document contents in evidence files.",
    "Do not use production financial records as test evidence.",
    "Mark unavailable fixtures as blocked instead of substituting live mutations.",
  ],
});

writeJson("fixture-manifest.json", {
  status: "pending",
  firms: ["Firm A", "Firm B"],
  roles: ["owner", "admin", "staff", "viewer", "revoked"],
  fixture_groups: [
    "review-inbox-pagination",
    "review-decision-safety",
    "private-evidence",
    "unavailable-versus-zero",
    "role-affordances",
    "export-job-history",
    "audit-trail",
    "date-boundaries",
    "responsive-stress",
  ].map((name) => ({
    name,
    status: "pending",
    notes: "",
  })),
});

writeJson("browser-matrix.json", {
  status: "pending",
  viewports,
  public_routes: publicRoutes,
  authenticated_routes: authenticatedRoutes,
  results: [],
  required_measurements: [
    "clientWidth",
    "scrollWidth",
    "consoleErrors",
    "unnamedInteractiveControls",
    "controlsBelow44px",
    "keyboardFocusNotes",
    "screenReaderLabelErrorNotes",
  ],
});

writeJson("console-errors.json", {
  status: "pending",
  entries: [],
  redaction_required: true,
});

const findingRows = [
  ["finding_id", "status", "evidence_ref", "notes"],
  ...findingIds.map((id) => [id, "pending", "", ""]),
];

writeFileSync(
  join(outputRoot, "finding-results.csv"),
  `${findingRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`,
);

console.log(`Prepared isolated UI/UX evidence templates in ${outputRoot}`);
