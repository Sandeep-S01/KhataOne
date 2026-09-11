# Capacity And Performance

## Executed Checks

- Lint: PASS.
- Typecheck: PASS.
- Dashboard query semantic test: PASS.
- Production build: PASS.
- Local unauthenticated smoke: PASS.

These are correctness/build checks, not capacity tests.

## Workload Interpretation

Using the audit prompt's illustrative planning scenario:

| Metric | 10,000 DAU | 20,000 DAU |
|---|---:|---:|
| Active WhatsApp senders/day | 9,000 | 18,000 |
| Dashboard users/day | 1,000 | 2,000 |
| Document-bearing messages/day | 18,000 | 36,000 |
| Peak document-bearing messages/sec | 5 | 10 |
| Peak dashboard sessions | 300 | 600 |
| Dynamic dashboard requests/sec | 30 | 60 |

CA-heavy sensitivity case:

| Metric | 10,000 dashboard DAU | 20,000 dashboard DAU |
|---|---:|---:|
| Peak active dashboard sessions | 3,000 | 6,000 |
| Dynamic dashboard requests/sec | 300 | 600 |

## Capacity Findings

- No authorized staging target or production-like database plan was available, so no offered/achieved throughput, p95/p99, queue stability, worker slots or provider-quota headroom can be stated.
- The webhook route has an in-process `240/min` limiter, equivalent to 4 requests/sec per key. This is below the illustrative 20k peak document-bearing rate of 10/sec if traffic is concentrated.
- Daily cron in `vercel.json` cannot alone satisfy a near-real-time document-to-draft budget. An external scheduler may exist historically, but was not verified in this pass.
- Dashboard pagination/index semantics have local test coverage and passed.
- Export generation is synchronous and should not be assumed safe for large exports.

## Bottleneck Table

| Rank | Affected outcome | Evidence | Root cause/hypothesis | Proposed change | Confidence |
|---:|---|---|---|---|---|
| 1 | Media documents do not become accurate drafts | KO-LAUNCH-001 | Missing OCR/PDF/audio text preparation | Add bounded text extraction/transcription stage | High |
| 2 | Review approval integrity | KO-LAUNCH-002 | Sequential update/insert/audit without DB transaction | Single transactional RPC and unique handoff constraint | High |
| 3 | Document-to-draft latency | KO-LAUNCH-003 | Daily cron unless external scheduler verified | Verify/deploy frequent worker scheduler and queue metrics | Medium |
| 4 | Webhook burst intake | KO-LAUNCH-007 | In-memory limiter and possible 4 rps cap | Shared/platform limiter sized to Meta traffic | Medium |
| 5 | Large exports | KO-LAUNCH-008 | Synchronous generation and in-memory PDF buffer | Queue large exports and process out of request path | Medium |

## Capacity Verdict

10,000 DAU: `INSUFFICIENT EVIDENCE`.
20,000 DAU: `INSUFFICIENT EVIDENCE`.

No tested configuration sustained those workloads in this audit. Any capacity claim would be a projection, not evidence.
