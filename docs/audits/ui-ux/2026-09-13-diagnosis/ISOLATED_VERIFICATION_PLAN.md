# KhataOne UI/UX Isolated Verification Plan

Date: 2026-09-13
Status: Prepared for isolated authenticated verification; no production mutations authorized.

## Purpose

Use this plan after the local UI/UX remediation slices are applied to an isolated local or staging workspace. The goal is to prove the fixes with realistic authenticated data, roles, browser sizes and workflow outcomes before calling the findings hosted-verified or release-ready.

Do not use the live owner account for destructive verification. Do not change real clients, real documents, real exports, real passwords, WhatsApp delivery state or production financial records. If only live credentials are available, treat authenticated mutation, role and fixture checks as blocked.

## Required isolated workspace

Create or use a disposable workspace with:

- two firms: `Firm A` and `Firm B`
- users: owner, admin, staff, viewer, revoked/removed membership
- no real client data
- private storage bucket entries for supported source documents
- Supabase migrations applied, including `20260913110000_complete_dashboard_filtered_results.sql`
- workers disabled by default unless the specific worker-state test is being run against disposable rows

The workspace must allow rollback by deleting the fixture firms and all related `firm_id` scoped records.

## Fixture data

| Fixture group | Minimum records | Purpose |
| --- | ---: | --- |
| Review queue and inbox pagination | 55 review rows and 55 inbox rows, with sole matches after row 50 | Prove filtering happens before pagination and later matching rows are reachable |
| Review decision safety | draft, needs-review, duplicate, approved and rejected transactions | Prove unsaved edits block decisions, posted records stay read-only and return context is preserved |
| Private evidence | image, PDF, text, audio, unsupported MIME and missing storage path documents | Prove supported previews/fallbacks and short-lived private source access |
| Unavailable versus zero | successful zero counts, failed read responses, missing summary values and real `0` amounts/counts | Prove failed reads do not appear as healthy zero |
| Roles | owner, admin, staff, viewer and revoked users across client/review/ledger/GST/export/operations pages | Prove UI affordances match server permissions |
| Export/job history | queued, processing, completed and failed exports/jobs; more than 50 matching rows | Prove refresh copy, file-state labels, pagination and safe job errors |
| Audit trail | client update, ledger correction, transaction approval, GST summary generation and manual job request | Prove safe before/after detail, safe metadata chips and internal entity links |
| Date boundaries | audit rows around `18:29:59.999Z` and `18:30:00.000Z` for the selected India calendar day | Prove Audit date filters include the intended Asia/Kolkata day only |
| Responsive stress | long client names, GSTINs, invoice numbers, amounts, risk flags and source text | Prove layout containment at narrow and desktop widths |

## Browser and accessibility matrix

Run the authenticated routes at these CSS viewport widths: `320`, `390`, `768`, `1024`, `1280`, `1440`, `1920`.

For dashboard routes, check both sidebar states at desktop widths where the sidebar is visible.

For affected public/auth routes, verify `/`, `/login`, `/signup`, `/forgot-password` and `/reset-password` at `390` and `1440`.

For each run, record:

- route
- viewport
- sidebar state when applicable
- `documentElement.clientWidth`
- `documentElement.scrollWidth`
- console errors
- unnamed interactive controls
- visible controls below the project 44px mobile target
- keyboard focus order through filters, tables, forms and pagination
- Escape behavior for collapsed navigation tooltip and mobile menu
- screen-reader-relevant label/error associations on invalid forms

## Finding verification checklist

| Finding | Isolated assertion |
| --- | --- |
| KO-UX-001 | Review Queue and Inbox find a sole matching record after row 50; pagination remains bounded and stable |
| KO-UX-002 | Editing a transaction without saving prevents approve/reject/duplicate/clarification; after successful save, decision uses persisted displayed values |
| KO-UX-003 | Authorized image/PDF/text/audio evidence is usable; unsupported/missing evidence shows precise fallback; foreign-firm evidence is denied |
| KO-UX-004 | GST/export date defaults stay correct; Audit date filters include a full India calendar day and exclude adjacent UTC-only rows |
| KO-UX-005 | Injected read failure shows unavailable/error copy, while valid zero remains numeric |
| KO-UX-006 | Viewer sees read-only notices instead of mutation controls; owner/admin/staff see allowed controls |
| KO-UX-007 | Approve/reject/duplicate/archive/manual-job actions show pending and final outcome; failures do not look successful |
| KO-UX-008 | Export history shows queued/processing/failed/completed states truthfully and refreshes on demand |
| KO-UX-009 | Older GST/report/export/audit/operation records beyond 50 are reachable by pagination |
| KO-UX-010 | Success/warning/info/destructive chips remain readable on their actual surfaces |
| KO-UX-011 | Invalid controls reference nearby field errors and clarification has a persistent accessible label |
| KO-UX-012 | Collapsed navigation tooltip dismisses with Escape without moving focus unexpectedly |
| KO-UX-013 | Auth inputs and password toggles meet the 44px mobile project target without overlap |
| KO-UX-014 | Missing confidence/summary values show unavailable/not provided; real zero remains zero |
| KO-UX-015 | Clients filtered-empty copy appears only for active filters and supported statuses include onboarding |
| KO-UX-016 | Return links preserve allowlisted context and do not accept unsafe external destinations |
| KO-UX-017 | Sidebar firm identity reads as static active workspace context, not a switcher |
| KO-UX-018 | Review filters fit at 1280 with sidebar; search field remains usable |
| KO-UX-019 | Audit logs show safe before/after details and internal entity links for synthetic corrections |
| KO-UX-020 | Landing copy matches record-level evidence/confidence and labels examples as illustrative |
| KO-UX-021 | Password reset success stays success in a real recovery session; no false setup error appears |
| KO-UX-022 | Overview counts distinguish unavailable from zero and metric destinations remain meaningful |
| KO-UX-023 | Long sanitized job errors wrap and remain readable; raw provider payloads/secret URLs are not exposed |
| KO-UX-024 | Shared hierarchy remains deliberate across public, auth and dashboard surfaces; no unapproved screenshot-only chrome appears |
| KO-UX-025 | Populated GST period detail stays within viewport and wide tables scroll inside contained regions |
| KO-UX-026 | Dashboard shell mobile actions meet the 44px project target where exposed |
| KO-UX-027 | Saved GST summary totals, current period transactions and current blockers are clearly distinguished |

## Release gate

Do not mark the UI/UX remediation released until all of the following are true:

- local source tests, lint, typecheck and build pass on the candidate commit
- the isolated database has the required migration set
- every finding above has an evidence row with pass/fail/block status
- blocked checks name the missing fixture or environment precisely
- no raw private source, signed URL, token, webhook payload or foreign-firm record is exposed
- no direct GST filing claim or action appears unless a verified integration exists
- no production financial mutation was used as test evidence

## Evidence output

Store run evidence under:

`docs/audits/ui-ux/2026-09-13-diagnosis/evidence/isolated-verification/`

Initialize blank sanitized evidence templates with:

```bash
npm.cmd run prepare:ui-ux-evidence
```

Capture an ignored Playwright storage-state file only from a disposable local/staging account:

```bash
$env:KHATAONE_UI_UX_ISOLATED_AUTH="1"
$env:KHATAONE_UI_UX_BASE_URL="http://localhost:3000"
$env:KHATAONE_UI_UX_AUTH_EMAIL="<disposable-test-user>"
$env:KHATAONE_UI_UX_AUTH_PASSWORD="<disposable-test-password>"
$env:KHATAONE_UI_UX_STORAGE_STATE_OUTPUT=".codex-tmp/ui-ux-isolated-auth/storage-state.json"
npm.cmd run create:ui-ux-auth-state
```

Run the safe local browser matrix against public routes and, when available, that isolated authenticated storage state:

```bash
$env:KHATAONE_UI_UX_BASE_URL="http://localhost:3000"
$env:KHATAONE_UI_UX_STORAGE_STATE=".codex-tmp/ui-ux-isolated-auth/storage-state.json"
$env:KHATAONE_UI_UX_TRANSACTION_ID="<isolated-transaction-id>"
$env:KHATAONE_UI_UX_CLIENT_ID="<isolated-client-id>"
$env:KHATAONE_UI_UX_LEDGER_ENTRY_ID="<isolated-ledger-entry-id>"
$env:KHATAONE_UI_UX_GST_PERIOD_ID="<isolated-gst-period-id>"
npm.cmd run verify:ui-ux-browser-matrix
```

Authenticated routes stay blocked unless `KHATAONE_UI_UX_STORAGE_STATE` points to a Playwright storage-state file from a disposable workspace. Detail pages also require isolated fixture IDs through `KHATAONE_UI_UX_TRANSACTION_ID`, `KHATAONE_UI_UX_CLIENT_ID`, `KHATAONE_UI_UX_LEDGER_ENTRY_ID` and `KHATAONE_UI_UX_GST_PERIOD_ID`. Do not pass live credentials to this runner.

The initializer creates pending placeholders only. The browser matrix fills sanitized route metrics, blocked reasons and redacted console entries; do not paste secrets, access tokens, signed URLs, phone numbers or private document contents into evidence files.

Recommended files:

- `run-summary.json`
- `finding-results.csv`
- `browser-matrix.json`
- `screenshots/`
- `console-errors.json`
- `fixture-manifest.json`

Keep secrets, access tokens, signed URLs, phone numbers and private document contents out of evidence files.
