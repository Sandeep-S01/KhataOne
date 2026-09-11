# Production Hardening Phase 2 Performance And Capacity Results

Date: 2026-09-11

## Local Capacity-Relevant Changes

- Export generation moved out of the authenticated request path. User requests now enqueue a durable job and return after the export row/job are created.
- Export worker batches are bounded in application code with default batch size `3` and maximum batch size `10`.
- Export job claiming uses database row locks with `FOR UPDATE SKIP LOCKED`, a stale lease boundary, attempt counts, and service-role-only execution.
- OpenAI media preparation uses byte caps before sending image/PDF/audio content to providers.

## Measured Locally

No load test was run in this Phase 2 pass. The local verification was build/static only:

- Production build completed successfully.
- Static hardening checks confirmed the queued export architecture and bounded media preparation.

## Not Yet Proven

- Export worker throughput, p95/p99 generation time, storage upload latency, and large-file memory profile.
- OpenAI image/PDF/audio extraction latency and cost by media type.
- Queue backlog recovery after 2x/3x bursts.
- Multi-instance worker contention in a deployed environment.
- 10,000 or 20,000 DAU capacity under the audit workload model.

## Minimum Next Measurement

Use an explicitly labeled staging project and run:

1. Apply pending migrations.
2. Seed representative approved transactions and GST periods.
3. Queue concurrent transaction CSV, GST CSV, and GST PDF exports.
4. Run `/api/jobs/exports/run-queued?batch_size=10` with `JOB_RUNNER_SECRET`.
5. Record claimed/completed/failed jobs, export artifact sizes, storage upload time, memory use, and dashboard responsiveness during generation.
