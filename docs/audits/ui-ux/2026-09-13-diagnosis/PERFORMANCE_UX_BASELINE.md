# Performance UX baseline

No load test, infrastructure change, cache-policy change or new application instrumentation occurred. This audit distinguishes UI feedback from useful records and from completed actions. The browser runner is standalone and records no financial payloads or network bodies.

## Current measurements

Local56 public samples are development-mode observations including possible compilation/font warm-up. Do not compare them to production targets. Hosted samples below are one sequential hard navigation per route/viewport, plus explicitly recorded revisits/details. Values are goto-start → nonloading visible h1 → font-ready observation, not true “all controls usable”, click latency, LCP, INP, SQL duration or p95. Dataset size, function cold state and exact deployed commit are unverified. Browser/network conditions: Windows Chromium153, no throttling, same local network, no concurrent load generator.

| Hosted route | Samples | Min observation ms | Max observation ms |
| --- | ---: | ---: | ---: |
| /dashboard | 8 | 855 | 1279 |
| /dashboard/clients | 7 | 728 | 991 |
| /dashboard/inbox | 7 | 765 | 1187 |
| /dashboard/review-queue | 7 | 865 | 1307 |
| /dashboard/ledger | 7 | 895 | 1105 |
| /dashboard/gst-summary | 7 | 835 | 1185 |
| /dashboard/reports | 7 | 881 | 1116 |
| /dashboard/exports | 7 | 728 | 2944 |
| /dashboard/audit-logs | 7 | 823 | 1337 |
| /dashboard/operations | 7 | 775 | 1380 |
| /dashboard/settings | 7 | 723 | 1379 |
| /dashboard/platform | 7 | 776 | 938 |
| /dashboard/clients/[recordId] | 3 | 890 | 1149 |
| /dashboard/review-queue/[recordId] | 3 | 931 | 1229 |
| /dashboard/ledger/[recordId] | 3 | 780 | 919 |
| /dashboard/gst-summary/[recordId] | 3 | 912 | 1096 |

All retained hosted main samples loaded actual non-skeleton content. Earlier h1-only observations were discarded because Preparing workspace satisfied the selector. Do not count fast placeholders, errors or empty setup screens as completed accounting work. Sampling across viewports is not a controlled same-condition distribution; min/max are descriptive, and no percentile/capacity claim is made.

## Separate milestone coverage

| Milestone | Current evidence | Status |
| --- | --- | --- |
| Click → first visible feedback | Loading boundary/source inspected; no dedicated click timestamp/paint probe | UNVERIFIED |
| Final response waiting | Not collected by this UI harness | Historical only; no new server attribution |
| Hard navigation → nonloading heading | Numeric samples in authenticated-browser.json | BROWSER_VERIFIED observation, limited readiness definition |
| Table rows and all filter controls usable | Layout bounds sampled after content; no hydration/paint event instrumentation | Partially observed, not timed end-to-end |
| Field validation | Local blank signup prevented network request | BROWSER_VERIFIED behavior; latency not benchmarked |
| Approval/GST/correction completion | Contracts/code inspected; no writes | BLOCKED |
| Export queued → private file ready | Async worker contract/source inspected | BLOCKED; stale mounted history risk KO-UX-008 |
| Original document preview readiness | No original-media preview rendered in current review page | Missing UI contract KO-UX-003 |

## Existing source behavior worth preserving

getFirmContext uses React request memoization; independent hot-list reads overlap with Promise.all. Middleware retains fresh session verification and narrow matching; dashboard pages remain dynamic. The dashboard layout must resolve authorized workspace context before showing protected content. loading.tsx below it cannot remove layout/auth waiting. A route-group error boundary exists above the layout for transient failures. Do not recommend these already-present pieces as missing work.

Shared shell remains mounted during client navigation; temporary filter state lives in URL. Server actions selectively revalidate relevant module paths. Overview values may not update immediately after a workflow when that surface is not invalidated/refreshed. Export workers complete independently; no mounted-page subscription/polling exists. Pending feedback, useful count errors and explicit refresh can improve perceived trust without changing auth or backend policy.

The public font setup loads three families with multiple weights via next/font; local browser fontStatus was loaded. No bundle analyzer, CPU profile or web-vitals run was performed here; font count alone is not evidence of a bottleneck. Do not add new fonts or animation dependencies during refinement without measurement.

## Historical evidence, kept separate

docs/performance/dashboard-latency-results.md records September12 controlled30-trial comparisons. Review Queue click median/p95 fell1905/1949ms to913/1419ms after a Tokyo-region preview; hard-navigation p95 moved2596→1771ms, and final-wait p95 remained941.7ms. Those are the earlier report’s results, not this run. The selective-prefetch experiment reduced request count511→462 but worsened click p95 to2435ms, so fewer requests did not establish better navigation.

The later30-trial Ledger visible-DOM diagnostic measured median/p95702.3/1023.6ms versus runner-observed901/1419ms. It also recorded a separate≈19-second pre-send Clients stall whose short server spans did not explain it. That difference matters: runner observation, browser transport, auth/API work and render timing cannot be collapsed into “slow database.” An independent network/browser check remained outstanding.

Newest entries in that latency report and Tracker supersede earlier “region release blocked/pending” language: region-only release/main integration were completed. Single post-release route samples were smoke evidence, not p95 certification. Current UI deployment provenance was not independently queried in this audit. Historical security-hardening status likewise does not prove all local RPC/policy migrations are active on today’s domain.

The older September10 PERFORMANCE_DIAGNOSIS.md is a lead, not present truth: synchronous exports, page-local Clients search and wholly sequential workers have subsequently changed. Current Review/Inbox post-page predicates remain a correctness problem and should be addressed without removing bounds. Hosted index/query-plan status was not queried.

## Non-regression targets and next discriminating evidence

Contextual proposed targets from the supplied brief:800ms final document waiting,1500ms hard-navigation queue usable,1000ms click-to-content at p95. This audit does not certify any of them. Before performance-related implementation, collect repeat first/revisit/click cases with fixed representative data, explicit rows/empty/error readiness, cache/cold uncertainty and independent-network comparison. Capture no credentials, source content or signed URLs.

Preserve firm/role-scoped reads, private/no-store responses, server-authoritative approval/audit and bounded queries. A source count query or large table is only a performance hypothesis until timed; no region, middleware runtime, global cache or prefetch change is justified by this UI audit alone. Completion latency and provider/worker capacity need separate authorized disposable fixtures.
