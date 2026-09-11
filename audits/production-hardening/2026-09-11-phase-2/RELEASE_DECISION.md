# Production Hardening Phase 2 Release Decision

Date: 2026-09-11

## Verdict

`CONDITIONAL GO` for continued staging verification only.

The migration preflights, approval RPC concurrency checks, RLS access matrix, local current-code queued export worker smoke, and health/worker-secret smoke have now been exercised against the authorized non-production target. This is not a pilot or production launch pass because deployed export worker verification is blocked by a deployed `404`, PDF media extraction is blocked by OpenAI account credits, and workload behavior has not been measured.

## Conditions Before Pilot

- Deploy current worker routes to non-production and verify `/api/jobs/exports/run-queued` no longer returns `404`.
- Run queued export smoke checks for GST CSV and GST PDF; transaction CSV passed locally against non-production storage.
- Run restricted-principal authorization tests for export creation, worker execution, and download.
- Add OpenAI credits or switch to an authorized non-production provider account with credits, then verify at least one image, one PDF, one scanned PDF, and one audio-note extraction path using safe fixtures.
- Capture latency/cost/error evidence for those extraction paths.

## Conditions Before Target-Scale Launch

- Run combined ingestion, extraction, review, GST summary, and export load tests using the audit workload definitions.
- Measure export backlog recovery and provider quota limits.
- Validate export formats with a practicing CA.
- Confirm monitoring and alerts for failed export jobs, oldest queued job, provider failures, storage upload failures, and quota/spend spikes.
