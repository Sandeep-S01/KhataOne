# Dashboard latency results

Date: 2026-09-12. Baseline checkout: `e780570` (clean before this work).

Region confirmation: the user's Supabase Infrastructure screenshot identifies the primary database as North East Asia (Tokyo), `ap-northeast-1`. This resolves the earlier region blocker. The screenshot is point-in-time infrastructure evidence, not proof of database health or capacity under load.

## Status and evidence

### Capacity validation follow-up

The non-production k6 harness has been hardened locally before use. It denies the live
hostname, requires an exact expected staging host, rejects auth redirects, reports
route-specific dashboard thresholds and dropped iterations, and leaves worker/provider
traffic disabled unless separately authorized. Before/after reconciliation requires an
exact staging Supabase hostname, is paginated, and fails closed on an incomplete row scan. Webhook, approval, full extraction/export,
message-loss, and cross-tenant checks remain separate release gates.

No capacity run has been executed. Native `k6` 2.2.0 parses the workload and passes the
synthetic exact-host preflight, but an isolated staging app/database and controlled staging
session are not available. Therefore no concurrency, capacity, or
target-scale p95 claim is made, and production was not load tested.

Vercel environment inspection confirms the current Supabase URL, anonymous key, and
service-role key are each one secret binding shared by Preview and Production. Existing
Preview deployments are not database-isolated capacity targets. Preview must be wired to
a separate staging Supabase project before this test can continue safely.

- IMPLEMENTED LOCALLY: correlated dashboard spans, sampling and bounds, overview query spans, auth redirect cookie preservation, opt-in selective prefetch experiment, corrected populated-data browser benchmark, and hnd1 deployment configuration preserving all cron jobs.
- TESTED LOCALLY: lint, TypeScript, production build, query semantics, phase 1/2 hardening guards, executable tracing tests and mocked session regression tests passed. These are not database integration tests.
- DEPLOYED TO PREVIEW: instrumentation baseline `dpl_AJgzzhxF9bAZGYTmdoAaq4pn6mqQ`; selective-prefetch experiment `dpl_5thwcqD2tfiBVAbCt9dUQFty1Dst`; Tokyo candidate `dpl_FVyfqGMWKz779XAkjEWPgYY928nx`.
- VERIFIED IN PREVIEW: Washington baseline, prefetch experiment and Tokyo comparison completed with the existing real account (30 hard navigations and 30 overview-to-queue clicks each). Tokyo is faster, but all three proposed p95 targets remain unmet. HTML/RSC auth guards and private response headers were checked; the full security/workflow matrix remains pending.
- VERIFIED IN PRODUCTION: no latency improvement measured; read-only deployment inspection completed.

Installed versions (also resolved by the existing lockfile): Next.js 16.3.0, React 19.2.8, @supabase/ssr 0.12.4, @supabase/supabase-js 2.112.2. Local Node: 26.5.1. Playwright was added as a development dependency for repeatable measurements; no runtime package upgrade or database migration was made. Installed Next.js instrumentation and Link documentation was consulted.

`vercel inspect https://khataone.vercel.app` identified production deployment `dpl_9GuQVWLef4f3RfZiFUfL53b5YVFp`, with index functions in `iad1`. Middleware locations were `bom1, fra1, gru1, iad1, lhr1, sfo1, sin1, syd1`. This independently confirms current Washington function placement; it does not identify Supabase's region. Deployed commit, dataset size, browser location, plan limits and warm/cold state were not independently established.

Supabase CLI management access failed with "Access token not provided". Vercel environment names were inspected without retrieving values: `SUPABASE_SERVICE_ROLE_KEY` exists, but `SUPABASE_ACCESS_TOKEN` is absent. A service-role key is not a management token. The user supplied existing-account login variables in .env.local for browser testing. No credential was logged, account created, password reset, or smoke credential used. Preview protection was crossed using existing authorized Vercel CLI access and private local protection cookies, without disabling deployment protection or application authentication.

## Baseline and dependency graph

The supplied `D:/Per_Docs/KhataOne_HAR_Evidence.md` reports one HTML request: total 3556.070 ms, waiting 2726.057 ms, receiving 692.477 ms. The raw HAR was not found in the repository or D:/Per_Docs, so these are attributed report values, not a newly parsed capture. New authenticated preview measurements are recorded below; they are not directly comparable to that single production HAR.

## Authenticated preview measurements

Baseline preview: https://khata-ely6f82jb-sandeep-s01s-projects.vercel.app. `vercel inspect` confirms functions AND middleware in iad1. Production lists multi-region middleware, so this is not an exact reproduction of production placement. The CLI deployed the uncommitted working snapshot; Vercel's inherited Git SHA e780570 identifies its parent checkout, not the complete changed source.

Baseline recorded at 2026-09-11 18:53 UTC / September 12 00:23 IST using Chromium 153.0.8010.12. Thirty warm-browser trials, each with a hard navigation, a return to populated overview, and a click to populated review queue. Two-second pauses separate the operations. Browser geographic location is unverified; response ingress is bom1. Function cold state is unverified. No network emulation or concurrent load test was used.

| Baseline metric | Samples | p50 | p95 | Target result |
| --- | ---: | ---: | ---: | --- |
| Click to visible queue rows | 30 | 1905 ms | 1949 ms | FAIL: exceeds 1000 ms |
| Hard navigation to visible queue rows | 30 | 1765 ms | 2596 ms | FAIL: exceeds 1500 ms |

Artifact: `latency-iad1-browser.json`. This first run's document_waiting/document_ttfb fields use responseStart and must NOT be used for the 800 ms final-page-response target: responseStart can refer to interim HTTP responses. The runner was subsequently updated to preserve first/interim/final header evidence and use finalResponseHeadersStart where available. See [W3C Resource Timing](https://www.w3.org/TR/resource-timing/). No standalone baseline final-response percentile is claimed.

There were 511 observed GET requests to the five instrumented dashboard list/overview paths during the baseline windows, including prefetch and deliberate navigations. This is not the total application request count. No long tasks were captured in the recorded document/client-navigation intervals; this limited observer result does not replace a full Chrome Performance recording or prove that hydration is irrelevant.

Server trace artifact: `latency-iad1-traces.json` contains 250 unique sanitized spans from 50 captured queue requests (the returned log window did not cover every trial). Twenty-five requests correlate to the browser's actual hard-navigation response IDs. Their medians: middleware auth 187 ms, server auth 192 ms, membership 184 ms, queue rows 194 ms, client options 194 ms. Each of these requests has one server auth call and one membership lookup; the two list reads overlap. This proves that roughly similar remote-operation waits accumulate along the authorization/data path, not that SQL execution itself takes those times.

The original server classifier labelled headerless GETs as HTML; framework-normalized flight requests can lose identifying headers. The summarizer marks uncorrelated legacy labels as unverified, and the newer preview uses unclassified_get for ambiguous requests. Browser-observed prefetch kinds remain separate from these labels.

### Selective prefetch comparison

Second preview: https://khata-9k4ygmnng-sandeep-s01s-projects.vercel.app, also confirmed iad1 for middleware and functions. Built with `NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT=1`. It also includes the conservative request-classification correction described above; runtime data and auth logic are the same. This is a sequential diagnostic comparison, not a randomized experiment or a production release claim.

| Metric | Baseline | Prefetch experiment |
| --- | ---: | ---: |
| Samples per navigation mode | 30 | 30 |
| Click-to-rows p50 | 1905 ms | 1913 ms |
| Click-to-rows p95 | 1949 ms | 2435 ms |
| Hard-navigation-to-rows p50 | 1765 ms | 1736 ms |
| Hard-navigation-to-rows p95 | 2596 ms | 2886 ms |
| Tracked GET requests across five paths | 511 | 462 |

Decision: do not enable the prefetch experiment by default. It reduced tracked request volume but did not show a useful-content navigation benefit, and its p95 was worse in this run. Both configurations miss the proposed navigation targets. Other links can still initiate prefetch; no global suppression was introduced.

The experiment's final-response TTFB p95 was 2437.5 ms, also above the proposed 800 ms target. Its first timing record explicitly shows an interim response at 120.8 ms and final response headers at 1201.3 ms. Thus the very low first-response values in the baseline cannot substantiate a fast authenticated HTML response.

Artifacts: `latency-iad1-prefetch-browser.json` and `latency-iad1-prefetch-traces.json`. The latter contains another 250 sanitized spans from 50 returned queue-request logs. Baseline correlated requests have a measured logical critical-path median of 784 ms and p95 of 972 ms (middleware auth + server auth + membership + maximum of the overlapping list calls, computed per request). This excludes runtime handoff gaps, browser/network overhead and rendering. The database execution portion remains unknown.

### Separate CPU diagnostic

`latency-iad1-cpu-diagnostic.json` records one additional baseline trial with Chrome DevTools timeline collection enabled, excluded from the thirty-sample comparison. It contains 995 sanitized duration events, excluding event args, URLs, source stacks and document contents. Maximum captured durations: FunctionCall 10.495 ms, EvaluateScript 15.656 ms, Layout 25.308 ms, UpdateLayoutTree 13.887 ms, Paint 3.693 ms. These nested events must not be summed as wall time. This short capture shows no multi-second captured CPU event; it does not rule out all frontend performance issues or replace profiling on slower devices.

This trial recorded interim response at 81.9 ms versus final headers at 1329 ms. Private/no-store financial response headers were preserved. `DASHBOARD_BROWSER_CPU_TRACE=1` enables this separate diagnostic in the runner; use one sample and keep it separate from timing comparisons.

### Outstanding blockers

- Database region: resolved by the user's Infrastructure screenshot. The Tokyo preview was created with `vercel deploy --regions hnd1`, default prefetch, and the same diagnostic settings. Deployment inspection confirms both middleware and application functions execute in hnd1. No database migration was attempted.
- No production deployment or before/after production speedup is claimed. Production remains the original deployment.
- Removed-membership, viewer, cross-tenant IDs, approval/count refresh and firm-switching integration cases require suitable authorized test states/accounts. They were not simulated by changing real financial records or removing the real user's access. Normal authenticated queue/overview reads and unauthenticated HTML/RSC redirects were exercised; local session tests and existing hardening guards passed.
- Trace-based SQL plans, complete workflow regression coverage, an instrumentation-disabled overhead comparison and residual tail-latency investigation remain outstanding. Region confirmation and the first colocation comparison are now complete.

## Tokyo colocation result

Preview: https://khata-nnpeyuoho-sandeep-s01s-projects.vercel.app (`dpl_FVyfqGMWKz779XAkjEWPgYY928nx`). Deployed with `--regions hnd1`, diagnostics enabled and selective prefetch disabled. The build ran in iad1, but deployment inspection confirms runtime execution in hnd1 for both middleware and functions. All 30 recorded dynamic response headers also identify hnd1; all preserve private cache directives.

| Metric | Washington baseline | Tokyo | Proposed target |
| --- | ---: | ---: | --- |
| Queue click-to-rows p50 | 1905 ms | 913 ms | No p50 target |
| Queue click-to-rows p95 | 1949 ms | 1419 ms | FAIL: <=1000 ms |
| Hard-navigation-to-rows p50 | 1765 ms | 1034 ms | No p50 target |
| Hard-navigation-to-rows p95 | 2596 ms | 1771 ms | FAIL: <=1500 ms |
| Final document waiting p95 | Not recorded reliably | 941.7 ms | FAIL: <=800 ms |
| Final document TTFB p95 | Not recorded reliably | 944.5 ms | Above 800 ms |

Artifacts: `latency-hnd1-browser.json` (30 trials per mode) and `latency-hnd1-traces.json` (250 spans from 50 returned queue-request logs, 25 correlated to recorded HTML responses). Tokyo correlated medians: middleware auth 43 ms, server auth 37 ms, membership 29 ms, queue rows 41 ms, client options 35 ms. The measured logical critical path dropped from median 784 ms / p95 972 ms to median 156 ms / p95 244 ms, using the same per-request calculation that accounts for overlapping list reads.

Conclusion: region distance was a significant contributor. Retain hnd1 in the prepared deployment configuration; leave prefetch suppression off. This improves the measured workflow without a database move, compute upgrade, permission change or query rewrite. It does not resolve all latency or establish capacity. These are sequential tests using the same real account/live dataset, not a frozen synthetic fixture or randomized experiment; neither production performance nor broader user-location percentiles are established.

Cross-route checks: `latency-hnd1-other-routes.json` has three hard navigations and three clicks each for Clients, Ledger and Inbox, all reaching actual rows. Click samples in ms: Clients [877, 1416, 1403], Ledger [885, 902, 5519], Inbox [917, 919, 1436]. Three samples are functional checks, not reliable percentiles. The 5519 ms Ledger outlier remains material: its three captured client-navigation requests each had auth/membership/list spans only around 27-45 ms. `latency-hnd1-ledger-traces.json` records that evidence; no slow SQL explanation is justified from these spans. A follow-up runner records network intervals and dispatched-click timing separately from automation timing.

Tokyo RSC tree-prefetch without an app session returned 307 to /login. No financial mutation was performed during testing. `vercel.json` now sets `regions: ["hnd1"]` while retaining all three existing cron definitions. This file change prepares subsequent deployments; production has not been promoted.

### Intermittent Edge-auth stall

The ten-trial Ledger follow-up (`latency-hnd1-ledger-followup.json`) did not clear the outlier: automation-to-rows included 26945 ms and 4988 ms. One recorded client-navigation request waited 25318 ms for response headers. The larger trial lost its click timestamp during navigation, so its full 26945 ms is not labelled pure user-click latency; the independent request timing still establishes a long wait. Another trial recorded 4930 ms from the dispatched browser click to visible rows.

`latency-hnd1-ledger-followup-traces.json` captures three overlapping Edge `middleware.auth_get_user` spans of 40609, 40290 and 40413 ms in the same time window. Page-side auth medians remained around 39 ms and list queries around 31-35 ms for the captured unclassified navigation group. These logs localize an intermittent slow path to the Edge auth boundary; they do not establish whether the underlying cause is transport, runtime scheduling, SDK waiting or the auth service. Their IDs were not captured on the browser's slow client-navigation response, so the correlation is temporal, not a proven one-to-one request match.

Controlled follow-up tested the deprecated root middleware entry as `src/proxy.ts`, alongside src/app, using the installed Next.js 16.3 default Node runtime. updateSession, getUser, cookie propagation and all four matchers stayed unchanged. No auth bypass, JWT shortcut or timeout-to-allow fallback was introduced. The local build manifest and deployed logs verified actual Node execution.

Node experiment preview: https://khata-c07l0s7sc-sandeep-s01s-projects.vercel.app (`dpl_5JJ4Uvyri7SFMShd3rRtftJsGfHH`). Thirty trials per mode recorded queue click p50 897 ms / p95 2427 ms; hard-navigation p50 1110 ms / p95 1728 ms; final document waiting p95 1081.9 ms. The runtime change did not demonstrate better queue p95 than Tokyo with the original runtime, so it was reverted locally. Keep `middleware.ts` and hnd1 as the selected configuration. This is not proof Node caused the regression or that the Edge stall is resolved; sequential tests retain network/time confounding.

Artifacts: `latency-hnd1-node-browser.json` and `latency-hnd1-node-traces.json`. The build-manifest regression check remains, now asserting the selected auth middleware and all original matchers are registered. The Node preview is retained only as experiment evidence, not the selected release candidate. The intermittent auth stall remains open; no production rollout is recommended solely from the median improvement.

```text
middleware getUser (separate runtime/request boundary)
  -> layout/page getFirmContext (already React cache scoped to render)
     -> server getUser -> active membership + firm name
        -> review queue: rows and client options concurrently
        -> overview: six counts and eight-row snapshot concurrently
```

This establishes two explicit authentication boundaries, not accidental duplicate calls within one render. Call counts above are code-path expectations; actual SDK HTTP calls and timings need runtime evidence. No redundant layout/page firm loader, per-row queue SQL, explicit router.prefetch or router.refresh loop was found in the examined path. Existing loading.tsx and streaming are present. Queue rows are already bounded to 51 fetched/50 shown; client options remain potentially large and relationship search still runs after pagination. Those issues require separate measured work and are not declared fixed here.

The preview comparison now supports function/database distance as a significant latency contributor. SQL execution time itself is still unmeasured; authenticated RLS query plans would be required before adding indexes on that basis. Residual end-to-end latency exceeds the measured auth/data spans and still needs browser/network/runtime investigation.

### Auth deadline and transient-failure validation

Protected preview: https://khata-2dpl9ypqs-sandeep-s01s-projects.vercel.app (`dpl_7aDDYDc5Q37rUW4V8wtukgR4sz2q`). Vercel inspection confirmed middleware and functions in hnd1. Production was not promoted.

Middleware now distinguishes missing/invalid sessions from auth service failures. Transient errors, exceptions and a five-second application deadline return private, no-store 503 with Retry-After instead of redirecting users to login. Verification still fails closed. The underlying auth fetch receives cancellation; late cookie writes are ignored while earlier refresh cookies are preserved. This deadline is best effort if the runtime itself stalls, and does not bound the separate server-render auth/membership operations. It is not a substitute for successful latency targets. New `middleware.auth_http_headers` spans contain numeric HTTP status and header elapsed time only; they do not include response-body time or SQL execution.

`latency-hnd1-deadline-browser.json` contains ten hard navigations and ten overview-to-list clicks each for Review Queue and Ledger, all reaching actual rows using the existing account. No financial mutations or account/password changes were made.

| Measurement | Review Queue | Ledger |
| --- | ---: | ---: |
| Click-to-rows p50 | 896 ms | 892 ms |
| Click-to-rows preliminary p95/max | 2927 ms | 915 ms |
| Hard-navigation-to-rows p50 | 1145 ms | 866 ms |
| Hard-navigation-to-rows preliminary p95/max | 1765 ms | 1018 ms |
| Final document waiting preliminary p95/max | 1001 ms | 890.8 ms |

Ten trials are functional follow-up evidence, not stable tail estimates or a controlled comparison to the earlier thirty-trial runs. Queue dispatched-click latency also reached 2901 ms, so its outlier cannot be dismissed as automation overhead. The queue targets remain unmet; both routes still exceeded the 800 ms document-waiting target. Browser geography and function cold state remain unverified. All captured document responses were private/no-store.

`latency-hnd1-deadline-auth-traces.json` is a partial log window captured during testing: 87 middleware getUser spans, all successful, maximum 48 ms; all 87 captured HTTP-header spans returned 200. This does not prove the previous intermittent stall is resolved or attribute the queue outlier to a particular auth call. No deliberate auth-service failures were injected into the live account/project.

Verification passed: lint, typecheck, production build, query-semantics tests, tracing tests, phase 1/2/3 hardening checks, and built-manifest/session regression tests. Local fault tests cover HTML/RSC transient errors, timeout, thrown errors, invalid sessions, refresh-cookie preservation, late-cookie rejection, real AbortSignal propagation through the transport wrapper, and refusal to start another fetch after cancellation. Preview unauthenticated RSC/prefetch access still returned 307 to login. These mocked failure tests are not full SDK/session-expiry or cross-tenant integration tests. The temporary deployment-protection cookie file was removed after testing.

## Changes

### Follow-up flow inspection and correlation

The next pass traced the existing implementation before changing it:

1. `DashboardNav` uses Next Link and the default prefetch behavior; its optional click callback closes mobile navigation. No custom navigation data loader is involved.
2. Root middleware routes dashboard/onboarding/auth requests through `updateSession`, which performs fresh auth, propagates refresh cookies and sampled trace IDs, and fails closed on auth outages.
3. Dashboard layout and list pages call the same React-cache `getFirmContext` loader within a render. It performs separate fresh server auth followed by active membership selection. This is request-scoped memoization, not shared tenant data caching.
4. Review Queue and Ledger scope their queries to the selected firm. Queue rows and client options run concurrently, and queue rows use bounded pagination with deterministic ordering. The existing loading boundary can render while the destination resolves; readiness requires actual rows, not this fallback.
5. Review actions obtain firm context again, scope record reads by firm, enforce the applicable role guard, and retain the approval RPC/audit and route invalidation paths. No action was invoked in this diagnostic pass.

The smallest justified integration point was the existing browser runner, not a new router cache, auth shortcut or SQL rewrite. It now captures response status, validated diagnostic request IDs, Vercel IDs and a private/no-store boolean for tracked same-origin list requests, including client navigation and prefetch. Trial phase and start/end timestamps distinguish source-page work from the destination click. The trace summarizer uses exact browser-observed IDs to classify matching spans. Missing headers stay explicitly unverified; no response body, cookie, authorization header, search query or business identifier is saved.

`DASHBOARD_BROWSER_SOURCE_ROUTE` optionally selects a supported populated source list, so Clients-to-Ledger can be measured directly. The default remains Overview, and the source must differ from all destinations. Different source workflows must not be pooled into the earlier Overview benchmarks. Background requests are labelled by the phase in which they started; that label alone does not prove they blocked the click.

Inspection also confirmed a separate open recovery issue: `getFirmContext` discards resolved auth/membership errors and can redirect an upstream outage to login/onboarding. Middleware's existing deadline does not cover this separate server-render operation. No change to that shared loader is included in this diagnostic pass; a focused recovery change must preserve all page/action authorization contracts and verify its error presentation.

Direct Clients-source follow-up used the existing protected deadline preview and real account, with ten trials per mode and destination. `latency-hnd1-client-flow-browser.json` captures 342 tracked requests, including 324 response correlation IDs and 20 client-navigation requests. The queue and ledger trace artifacts each contain all ten matching client-navigation and ten matching measured hard-navigation requests, plus one unmeasured warm navigation. No application code or deployment changed for this comparison.

| Clients-source workflow | Click median / maximum | Hard-load median / maximum | Final waiting maximum |
| --- | ---: | ---: | ---: |
| Ledger | 909 / 6527 ms | 866 / 1579 ms | 1023 ms |
| Review Queue | 899 / 1397 ms | 1052 / 4941 ms | 4475.1 ms |

Ledger trial 5 took 6480 ms from the dispatched click. Its exact response ID, `b1e7a736-40e1-40de-b4d3-e6ca8b559d4b`, matches middleware auth 43 ms, server auth 39 ms, membership 24 ms and concurrent list/client reads 30/43 ms. Queue hard-load trial 4, ID `bb9565fb-7c4c-444c-9a1a-8b36a8e12229`, matches 36 ms middleware auth, 37 ms server auth, 42 ms membership and concurrent reads 46/34 ms. These specific outliers are not explained by the instrumented auth/data calls; they do not rule out the separately observed earlier auth stall. No database-index or auth-bypass change is justified by this evidence.

The remaining gap includes request scheduling, runtime work outside the spans, streaming/delivery and browser/network behavior. Absolute browser/server timestamps have not been independently clock-synchronized and should not be subtracted as precise cross-host timings. Some RSC requests returned 200 headers and were subsequently cancelled; that is recorded separately from row readiness and is not labelled an auth failure or completed network transfer. The runner was further corrected to retain partial timing on cancelled requests and request-observation timestamps. Negative timing fields mean unavailable, not zero latency. A separate two-trial artifact, `latency-hnd1-partial-timing-check.json`, validates that capture path; it is not pooled into the ten-trial results.

Local verification: `npm run verify`, query-semantics, tracing and built session tests passed. `node scripts/test-dashboard-response-evidence.mjs` covers allowlisted headers, malformed IDs, missing headers, out-of-order asynchronous responses, cancelled header reads and partial network timings. Security integration remains pending: the existing RLS harness explicitly requires non-production actors/records and invokes approval RPCs, so it was not run against live financial records or relabelled as a read-only check. Production promotion remains separate and is not recommended as a completed latency fix.

- `src/lib/performance.ts`: request classification, random correlation IDs, start/end timestamps for overlap analysis, per-context ordinal, resolved API error versus thrown exception, runtime/region/deployment fields. No returned payloads or error messages are logged.
- `src/lib/request-performance.ts`: React-cache request context for server render spans; retains the existing operation labels and safe metadata.
- `src/lib/supabase/middleware.ts`: overwrites inbound trace headers and forwards the same ID/sample decision through refreshed-cookie responses; preserves refresh cookies on redirects. Safe `Server-Timing: middleware_auth` covers only middleware authentication, never downstream rendering.
- `src/instrumentation.ts`: supported startup hook logs instance initialization evidence. Startup logs do not prove that any particular request was cold; full instance-to-span attribution remains outstanding.
- `src/lib/firms.ts` and Clients/Inbox/Ledger/Review Queue pages use correlated spans. Overview instruments each of its seven independent operations and adds deterministic snapshot ordering. Review Queue reports client-option fetch failures instead of silently presenting an empty option set.
- `dashboard-nav.tsx` and `dashboard-sidebar.tsx`: `NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT=1` disables current exact-route and overview sidebar prefetch. Default behavior is unchanged. Other links may still prefetch overview; request reduction must be measured. Detail links and action invalidation remain intact.
- Browser runner requires destination-specific table rows and the populated overview before measuring a click, uses an unambiguous workspace link, validates sample counts, waits two seconds between trials and reports preliminary p95. It intentionally fails on empty/error data rather than calling it a populated-data benchmark. Empty-state latency, hydration/long-task recording and hard-navigation TTFB remain separate checks.

Enable `KHATAONE_PERF_DIAGNOSTICS=1` in a controlled preview. Sampling defaults to 10%; `KHATAONE_PERF_SAMPLE_RATE=1` captures all requests during a short diagnostic comparison. Each middleware/render context caps itself at 64 operation logs. Diagnostics default off. Group by request_id and operation name; count completed spans and compare start/end intervals rather than summing concurrent durations. Middleware and server render have separate ordinal sequences. These are logical Auth/Data API spans, not PostgreSQL execution spans. No streaming response is buffered and no private response caching was added.

## Remaining experiment

Post-production next step: after the Tokyo release and GitHub integration, the pending firm-context recovery, middleware session/deadline and visible-row measurement tests were rerun and passed. These are local mocked/synthetic checks, not production outage or cross-tenant integration tests. No further runtime change or deployment was made in this pass. Requested a private-window and independent mobile-hotspot comparison of the live Clients-to-Ledger workflow from the user. Record whether the delay persists on each connection before drawing conclusions about the earlier pre-send stalls. Another run on the same automated runner would not supply independent-network evidence. Auth recovery remains a separate unreleased resilience change, not a proven speed improvement.

### Delivery diagnosis and workspace recovery continuation

The existing Link -> middleware -> cached firm context -> firm-scoped concurrent queries -> rendered rows flow was inspected again. No navigation cache, prefetch default, query or permission change was made to address the unexplained delay.

The unchanged deadline preview produced new evidence in `latency-hnd1-delivery-diagnostic.json` and `latency-hnd1-delivery-traces.json`. This ten-trial run included sanitized CPU instrumentation and must remain separate from ordinary comparisons. Ledger click trial 6 took 19352 ms; its browser request timing shows 18126.051 ms before requestStart, then about 669 ms to response headers. Exact request ID `2f6d7d96-8628-45ef-9902-0a0c2552df89` matched middleware/server auth 41/56 ms, membership 32 ms and concurrent reads 33/36 ms. This is evidence of substantial pre-send waiting for that request, not evidence of an 18-second database call. It does not identify DNS, connection establishment, socket waiting or another browser/network mechanism. The 6360 allowlisted CPU events had a maximum individual duration of 45.271 ms; none of the captured client-navigation long-task lists contained a long task. This does not exclude all browser/runtime effects.

Trial 7 had a different slow path: 4980 ms click-to-rows, requestStart 2.826 ms, responseStart 2757.373 ms and responseEnd 4439.396 ms. Matching ID `2e0acb74-e1d5-4a63-8ee4-1b7d9466f792` had middleware auth 2261 ms (HTTP headers 2157 ms), server auth 1060 ms, membership 322 ms and concurrent reads 301/300 ms. Therefore auth/API latency remains a contributor to some outliers. There is no single demonstrated cause for every long navigation.

The existing request-timing helper now also retains only numeric DNS, TCP and TLS timing fields, including unavailable -1 values, on completed and cancelled requests. A separate non-CPU ten-trial check, `latency-hnd1-connection-diagnostic.json`, recorded clicks 859-950 ms with no tracked requestStart above 50 ms, so the 18-second pre-send wait did not recur and its finer cause remains unverified. One hard load still took 3308 ms. No browser flags or transport settings were changed; this is not evidence that the earlier issue disappeared.

Independent recovery fix: `src/lib/firms.ts` now checks resolved auth/membership errors before using data or selecting a redirect. It reuses `isInvalidSession`; genuine missing sessions/membership retain login/onboarding behavior. Errors stop callers before they receive context, without returning stale permissions. `src/app/(dashboard)/error.tsx` sits above the dashboard layout (rather than inside the same segment, which cannot catch its layout errors) and presents a generic explicit retry using the installed Next 16.3 API. No upstream payload is displayed, no financial mutation is auto-retried, and no server-render deadline was added. This resolves the earlier documented resolved-error misclassification; it does not resolve navigation p95 or every action/API error-presentation case.

Local recovery tests exercise the actual loader with mocked upstream responses: valid roles/firm relation shapes, invalid sessions, transient auth failures, membership failures even when data is present, no membership lookup after failed auth, no active membership and unconfigured behavior. They do not emulate React's cache or certify live cross-tenant RLS. The UI harness renders the real boundary/shared primitives with system-font fallbacks, checks error suppression and the retry callback, and checks desktop/mobile focus, control size and overflow. It is not a full failed-server-render/retry integration test. No service outage or membership removal was injected into the live account.

Recovery preview: https://khata-b2jy7mopi-sandeep-s01s-projects.vercel.app (`dpl_4FKYdiiHRsrTcMXwN1CA8gx4pSMz`), verified middleware/functions in hnd1. Production is unchanged. Verification commands include `npm run verify`, the existing query/tracing/session and phase 1/2/3 hardening checks, `node scripts/test-firm-context-recovery.mjs`, `node scripts/test-dashboard-response-evidence.mjs`, and `node scripts/test-workspace-error-ui.mjs` after building.

`latency-hnd1-recovery-smoke.json` verifies actual rows with the real account for three hard loads/clicks per route. Ledger clicks were [906, 884, 4960] ms; queue clicks [912, 902, 893] ms. This is functional coverage, not a latency pass. The 4960 ms Ledger trial had requestStart 1.45 ms, responseStart 4341.144 ms and unavailable (-1) DNS/connection/TLS fields. Its exact matching `latency-hnd1-recovery-outlier-traces.json` records middleware auth 45 ms, server auth 59 ms, membership 35 ms and concurrent reads 38/38 ms. This additional response wait remains outside those instrumented calls; unavailable connection timings must not be described as zero network cost. Unauthenticated preview RSC/prefetch still redirects to login (307). Temporary protection-cookie jars were removed after verification.

1. COMPLETE: Supabase primary location confirmed as Tokyo from the user's Infrastructure screenshot.
2. COMPLETE: compared Washington and Tokyo previews, verified actual hnd1 execution, and prepared vercel.json with all cron entries preserved. No preferredRegion override or database migration was introduced. Production promotion remains separate.
3. Real-account login and baseline measurements are complete. For further comparisons, use `LIVE_DASHBOARD_EMAIL` and `LIVE_DASHBOARD_PASSWORD`, with `LIVE_DASHBOARD_BASE_URL` explicitly targeting the preview. Playwright is now in devDependencies; install its browser with `npx playwright install chromium`. Run `npm run perf:browser-dashboard` with `DASHBOARD_BROWSER_SAMPLE_COUNT=30`. `DASHBOARD_BROWSER_ROUTES` defaults to review queue and accepts the other supported list routes; `DASHBOARD_BROWSER_OUTPUT` saves sanitized generated evidence. No credentials or raw financial HTML are saved to these reports.
4. Record baseline, instrumentation overhead, region-only, then selective-prefetch trials separately. Record account role, dataset size, deployment/commit, actual region, browser location/network, and warm state. Capture sanitized HAR and correlated private logs; avoid saving authentication payloads/cookies in shared artifacts.
5. Measure actual content and hard-navigation TTFB independently. Proposed p95 targets remain 800 ms document waiting, 1500 ms queue usable, 1000 ms client navigation. No target is yet demonstrated.
6. Exercise expired sessions, removed memberships, firm switching if supported, two-firm IDs, viewer restrictions, filters/pagination, detail signed-document access, approval/count refresh and absence of prefetch mutations against authorized fixtures. Local mocked HTML/RSC auth and cookie tests passed; these full integration cases remain BLOCKED. Approval uses existing firm/role checks, atomic RPC and invalidation; no permission or financial mutation logic was changed.

No load test, production deployment or database change was performed. Full request completion spans, comprehensive browser profiling, remaining workflow/security regression states and the unmet p95 targets remain outstanding. The region change is tested in preview, not a completed production latency fix.

### Browser observation check

The next pass re-inspected the unchanged navigation, protected layout, firm loader and timing runner. To separate application waiting from Playwright observation delay, `scripts/dashboard-row-probe.mjs` installs a short-lived browser-side MutationObserver at the destination click. It records only the click timestamp and first observed visible target-table row timestamp; source tables, hidden rows and aria-busy loading containers do not qualify. The observer disconnects after success or 30 seconds and is replaced before another trial. `scripts/test-dashboard-row-probe.mjs` exercises these conditions with synthetic DOM only.

The original automation-to-rows and browser-click-to-runner-observation measurements are retained. `trials[].click.visible_dom` is an additional diagnostic, not a paint/INP measurement or proof of filter interactivity. It is null when no observation is available, including a replaced document; null must never be counted as zero latency. The DOM probe can add measurement overhead, so the new run is not pooled with the earlier configurations. No app route, permission check, prefetch setting or deployment is changed by this diagnostic.

Thirty Clients-to-Ledger trials on the existing recovery preview completed in `latency-hnd1-visible-row-30.json`. All thirty clicks produced a DOM observation. Results:

| Measurement | Median | Preliminary p95 | Maximum |
| --- | ---: | ---: | ---: |
| Original automation click-to-rows | 901 ms | 1419 ms | 1897 ms |
| Click-to-visible-DOM diagnostic | 702.3 ms | 1023.6 ms | 1597.5 ms |
| Runner observation after visible DOM | 185.4 ms | 470.5 ms | 473 ms |
| Ledger hard-navigation-to-rows | 957 ms | 1223 ms | 3646 ms |
| Final document waiting | 764.1 ms | 1029.5 ms | 3500.7 ms |

The observation gap is measured within each trial, not calculated by subtracting unrelated percentiles. This demonstrates that some apparent delay came from the test runner noticing rows late. It does not erase the remaining content delay, change acceptance targets, or establish Review Queue performance from a Ledger run. The visible-DOM diagnostic itself still exceeds 1000 ms at preliminary p95. `latency-hnd1-visible-row-30-traces.json` contains a partial returned log window covering 25 matching clicks and 25 hard navigations, not all thirty of each.

The longer run also reproduced a large stall outside the destination-click samples: trial 28's source Clients document request (`4ac606af-6bf0-4e1e-b2d1-d36bf5a39038`) recorded requestStart 19205.448 ms, DNS start/end 19142.811 ms, connection start/end 19142.811/19205.176 ms, TLS start 19171.102 ms and responseStart 19977.955 ms. Thus approximately 19.14 seconds elapsed before the recorded DNS/connection phase, while the recorded connection phase took 62.365 ms. Three simultaneous tree-prefetches also waited about 19.19 seconds before requestStart. These timings locate the delay before the recorded connection phase; they do not establish whether browser scheduling, socket/protocol handling, automatic discovery or another lower-level path caused it. This source-page delay must not be hidden by reporting only destination clicks.

`latency-hnd1-visible-row-source-stall.json` matches that source request to middleware auth 44 ms, server auth 111 ms, membership 127 ms and client query 152 ms. Those operations do not explain the 19-second pre-send interval. The runner had no explicit Windows proxy, auto-configuration URL, or HTTP/HTTPS/ALL_PROXY environment variable configured; this does not rule out automatic discovery, VPNs or other network layers. Browser location, network independence and cold-function state remain unverified.

Next discriminating check: repeat the same workflow from an independent browser/network and compare numeric request/connection phases before considering browser transport or platform changes. Repeating this same runner alone cannot distinguish a local transport problem from a broader one. The separate observed auth/API stalls and outstanding authorized security/workflow integration checks remain open. No additional production code change is justified solely by this pre-send evidence.

Verification: production build, lint/typecheck, query-semantics, tracing, session/cookie, firm-context recovery and new row-probe tests passed. No financial mutations, account changes, new deployment or production promotion occurred in this pass; the temporary protection cookie file was removed.

## Rollback

### Isolated Tokyo release completed (2026-09-12)

This supersedes the blocked attempt below and earlier production-pending statements. The user confirmed their GitHub noreply identity and authorized a new commit. Created `c62e3ef5e40b9d920b6fce550274570e5e004e6b` on local `release/tokyo-region`, based on production commit `e780570477d16d21bf1bc6e09cc5f57492ac6fff`. The complete source diff is only the addition of `regions: ["hnd1"]` to vercel.json. All three cron definitions and original Edge middleware are unchanged. No history, account access or billing was altered; unrelated dirty work was excluded.

Vercel accepted the correctly attributed new commit. Deployment `dpl_CUpLfdbKjMnDntcXEuShjQQdsVtH`, immutable URL `https://khata-1u8gcmhd5-sandeep-s01s-projects.vercel.app`, completed its remote Next.js build and TypeScript checks. Inspection confirmed hnd1 application functions. Existing-real-account candidate smoke passed for populated Clients, Ledger and Review Queue; an unauthenticated RSC/prefetch Ledger request returned 307 to login. Candidate evidence: `region-release-candidate-smoke.json`.

`vercel promote` succeeded. Inspection of `https://khataone.vercel.app` resolves to the new deployment. Fresh authenticated public-domain evidence in `region-release-after-smoke.json` confirms populated rows, `bom1::hnd1` response IDs and private/no-store document responses on all three routes.

| Overview-source route | Before click / hard load | After click / hard load |
| --- | ---: | ---: |
| Clients | 1940 / 1399 ms | 868 / 751 ms |
| Ledger | 1410 / 1651 ms | 882 / 977 ms |
| Review Queue | 1923 / 1814 ms | 899 / 868 ms |

These are one warmed sample per route/mode from the same runner, not percentiles or general latency guarantees. Browser location, network independence and function cold state remain unverified. Existing intermittent transport/auth stalls, broader security/workflow integration and p95 acceptance targets remain open. Only region placement is now live; the local diagnostic/auth recovery changes were not released. No financial records were changed and no database migration was performed.

Rollback target remains `dpl_9GuQVWLef4f3RfZiFUfL53b5YVFp` at `https://khata-nkg23dovm-sandeep-s01s-projects.vercel.app`. Promote that preserved deployment if placement causes regression.

GitHub follow-through (2026-09-12): after explicit user approval, fetched origin, fast-forwarded main to `c62e3ef5e40b9d920b6fce550274570e5e004e6b` and pushed main. `git ls-remote` confirms that exact remote SHA. Only vercel.json changed in the pushed commit; all other working-tree edits were preserved. Git-triggered production deployment `dpl_jkyuKGWc8XiDEyELvAcdefJzsMF9` (`https://khata-gwbuh65zd-sandeep-s01s-projects.vercel.app`) reached READY and is now served by khataone.vercel.app. Deployment API metadata confirms the GitHub commit SHA and hnd1 region. The earlier CLI region-only release remains available. This completes the previously pending main integration; it does not release other local performance work.

Post-push real-account public-domain smoke passed on Clients, Ledger and Review Queue. `region-release-main-smoke.json` records click samples 885/885/863 ms and hard-load samples 961/908/957 ms, with populated rows and hnd1/private-no-store document responses on all three routes. These remain single samples, not percentile certification. No financial mutations were performed.

### Isolated production release attempt (2026-09-12)

User authorized the next recommended isolated Tokyo production release. Production API metadata confirmed source commit `e780570477d16d21bf1bc6e09cc5f57492ac6fff`, deployment `dpl_9GuQVWLef4f3RfZiFUfL53b5YVFp`, URL `https://khata-nkg23dovm-sandeep-s01s-projects.vercel.app`, with functions in iad1. This deployment is the preserved rollback target.

Prepared a detached worktree at `.codex-tmp/region-release` from that exact commit. Its only tracked change is `regions: ["hnd1"]` in vercel.json; all three crons are unchanged. None of the uncommitted diagnostics, dependencies, auth deadlines or recovery changes from the main worktree are included. Local lint/typecheck and phase 1/2/3 hardening tests passed against that isolated source.

Attempted `vercel deploy --prod --skip-domain --yes` from the isolated worktree so validation would precede domain promotion. Candidate `dpl_HrQtbvUc8kHz7bQRLgY2xzWxJ5Dr` was BLOCKED before build, with `seatBlock.blockCode = TEAM_ACCESS_REQUIRED`, `isVerified = false` and `alwaysRefuseToBuild = true`. Vercel's reason states the commit author lacks permission to create deployments for the project. This is an account/commit-attribution gate, not an application build failure. No author metadata, access controls, membership or billing was changed to circumvent it. The waiting CLI process was stopped.

The project owner needs to resolve the Git-provider/commit-author association or project access in Vercel, then a fresh isolated candidate can be built, smoke-tested and promoted. See [Vercel's collaboration troubleshooting](https://vercel.com/docs/deployments/troubleshoot-project-collaboration#team-configuration). Do not promote one of the earlier diagnostic previews as a substitute for this region-only release.

`region-release-before-smoke.json` records one populated production hard load and click each for Clients, Ledger and Review Queue before the attempted switch. Clicks were 1940/1410/1923 ms; hard loads 1399/1651/1814 ms. These are smoke observations, not percentile estimates. Reinspection after the blocked attempt confirmed `khataone.vercel.app` still points to `dpl_9GuQVWLef4f3RfZiFUfL53b5YVFp` in iad1. No domain promotion, successful production build, financial mutation, commit or push occurred. Release status: PREPARED AND TESTED LOCALLY; PRODUCTION BUILD BLOCKED BY VERCEL ACCESS.

Disable `KHATAONE_PERF_DIAGNOSTICS` to stop timing output. Unset `NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT` and rebuild to restore default sidebar prefetch. No schema rollback is needed. If these changes are committed/deployed, revert that focused commit and redeploy the prior version, preserving unrelated hardening commits. To roll back placement, remove only the regions property (restoring the previous project default) or deploy explicitly with `--regions iad1`; preserve all cron entries. The Washington baseline preview remains available for comparison. Do not reset the entire worktree.
