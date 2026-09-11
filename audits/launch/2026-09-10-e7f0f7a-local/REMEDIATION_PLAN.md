# Remediation Plan

## Before Pilot

1. Implement and test real OCR/PDF/audio preparation for media inputs.
   Acceptance: labeled fixtures for text, image, digital PDF, scanned PDF and audio create reviewable drafts with preserved source evidence.

2. Make approval, ledger handoff and audit logging transactional.
   Acceptance: double-submit and two-reviewer tests produce exactly one logical handoff.

3. Run two-firm security/RLS verification with owner/admin/staff/viewer/revoked users.
   Acceptance: cross-tenant table, storage and action attempts fail; allowed same-tenant operations pass.

4. Verify live/staging WhatsApp ingestion using an allowlisted test account.
   Acceptance: signed webhook event persists, worker processes it, document/job/draft/audit lineage is traceable, and outbound failures are visible.

5. Neutralize CSV formula injection.
   Acceptance: exported dangerous cells are safe in spreadsheet software.

## Before Unrestricted Target-Scale Launch

1. Provision production-like staging and run the 10k/20k workload program.
   Acceptance: p95/p99, errors, queue age, business reconciliation and recovery results meet frozen thresholds.

2. Replace or supplement in-process rate limiting with shared/platform controls.
   Acceptance: limits behave consistently across instances and do not reject valid target peak traffic.

3. Queue large exports and enforce memory/concurrency limits.
   Acceptance: large export requests acknowledge quickly and complete asynchronously with visible status.

4. Add queue depth, oldest-job-age, provider failure, unmatched sender and export failure alerts.
   Acceptance: alert owner and runbook action are documented and tested.

## After Launch

- CA-reviewed statutory GST edge-case expansion.
- Tally/GSP/provider integration contracts.
- Larger labeled extraction evaluation set and calibration reporting.
- Advanced analytics and productivity measurement.
