import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const out=path.resolve('docs/audits/ui-ux/2026-09-13-diagnosis');
const read=p=>readFileSync(path.join(out,p),'utf8');
const json=p=>JSON.parse(read(p));
const write=(p,s)=>writeFileSync(path.join(out,p),s+'\n');
const inv=json('evidence/source-inventory.json'), pub=json('evidence/public-browser.json'),live=json('evidence/authenticated-browser.json');
const follow=existsSync(path.join(out,'evidence/authenticated-followup.json'))?json('evidence/authenticated-followup.json'):null;
const capture=existsSync(path.join(out,'evidence/authenticated-screenshots.json'))?json('evidence/authenticated-screenshots.json'):null;
const allLive=[...live.results,...(follow?.results||[])];
const findings=json('evidence/findings.json');
const route=x=>x.file.replace('src/app','').replace(/\/\([^/]+\)/g,'').replace('/page.tsx','')||'/';
const pages=inv.filter(x=>x.file.endsWith('/page.tsx'));
const components=inv.filter(x=>x.file.startsWith('src/components/'));
const consumers=c=>inv.filter(x=>x.imports.some(i=>i.module==='@/components/'+path.basename(c.file,'.tsx'))).map(x=>x.file);
const overflow=allLive.filter(r=>r.scrollWidth>r.width+1);
const table=rows=>rows.map(r=>'| '+r.join(' | ')+' |').join('\n');
const durationRows=[...new Set(live.results.map(r=>r.route))].map(route=>{const values=live.results.filter(r=>r.route===route&&r.usableObservationMs).map(r=>r.usableObservationMs).sort((a,b)=>a-b);return [route,values.length,values[0]||'N/A',values.at(-1)||'N/A'];});
write('COMPONENT_DESIGN_SYSTEM_AUDIT.md',`# Component and design-system audit

Evidence: current checkout source, anonymous local browser samples, hosted read-only measurements and redacted Overview screenshots. Reference candidates are proposals; dimensions below are CSS/source values, not pixel measurements from the generated reference.

## Component inventory and actual consumers

| Component file | Boundary/state | Direct importing consumers |
| --- | --- | --- |
${table(components.map(c=>[c.file,c.client?'Client: '+(c.stateHooks.join(', ')||'component/browser behavior'):'Server-compatible presentational',consumers(c).join('; ')||'No direct importer in inventoried routes/components']))}

The table is generated from TypeScript import declarations, not a guessed design-system catalog. Detailed imports and direct data reads are in evidence/source-inventory.json. Transitive consumers include every route inside the protected layout. A client component does not imply that accounting data is client-authoritative.

## Primitives and reuse

Button and ActionLink share variant/size constants; TextLink supports extra link props for contextual names, while ActionLink exposes a narrower interface. Input/Select/Textarea share control styles; operational forms use these, but AuthForm and password forms duplicate compact input/toggle classes. FieldError accepts IDs without requiring consumer association; Field/Label abstractions are not sufficient evidence that every rendered input is associated. FormMessage uses a polite live region; caller must select success/danger deliberately.

PageHeader, PageBody, SectionCard, StatTile, FilterBar, DataTable, PaginationControls, RecordCount, EmptyState, QueryError, SetupRequired, DetailList, InlineAlert and table class exports provide the operational foundation. Reuse these before inventing a card/table/form system. StatusChip is its own shared file; status-to-tone functions are repeated at route level because lifecycle meanings vary. Centralize stable vocabulary without incorrectly treating ready, approved, configured and completed as synonyms.

DataTable creates a named, keyboard-focusable horizontal scroll region. Its explicit minWidth preserves accounting columns. That contract fails when a containing grid item expands the page (KO-UX-025); the fix belongs in containment, not column deletion. Sticky table headers are source-defined, but full scroll behavior is not certified by the bounding-box check. Pagination captions accurately say Page N and loaded records rather than pretending to know the total; preserve that correction.

## Tokens and dimensions

| Category | Current implementation | Reference/requirement comparison |
| --- | --- | --- |
| Surface | #F7F5EF background; #FFF surface; #F1EEE6 muted; cards white→#FBFAF6 | Matches CRD starting palette; restrained gradient already exists |
| Text | #1F2A24 primary; #5F6B63 muted; #27323A secondary ink token | Distinguish ink and foreground aliases when adjusting tokens |
| Brand | #146B43; dark #0D4B31; saffron #D98A1F | Preserve brand identity; not arbitrary per-module rainbow styling |
| Semantic | success #168A4A; warning #8A5B11; danger #B42318; info #2563A8 | Warning intentionally differs from CRD #B7791F; do not undo contrast improvement |
| Border/ring | #D8D2C4 border; brand ring2px, offset2px | Border against white is subtle; full control-state contrast remains unverified |
| Font | Manrope400–700 body; Sora500–700 headings; JetBrains Mono400–600 numeric | next/font variables in root layout; local browser fonts reported loaded |
| Page heading | 20px mobile,24px md; description14px/24px | Candidate28px/36px is not current or mandatory |
| Panel heading/meta | title14px; description12px; nav group10px; tile label11px | Reference is visually larger; density decision required before global enlargement |
| Numeric | tile26px; mono/tabular values and right-aligned financial cells | Preserve amounts, GSTINs, invoices, identifiers; do not round away financial detail |
| Radius | token6px controls; card8px; utilities12/16/20/24px available | Candidate8px controls/12px panels conflicts with currently documented8px cards |
| Spacing | PageBody16px mobile/24px md; section gap16px; card body16px; header16×12px | Candidate major gap24/panel20 should be reviewed in dense tasks |
| Desktop control | sm32px,md36px,lg40px; Input/Select36px | Candidate40px everywhere would reduce density; justify per context |
| Touch control | shared44px; auth fields36px/toggle28px; sign-out32×44px | Confirmed exceptions: KO-UX-013 and026 |
| Shell | header56px; sidebar256px expanded/68px collapsed; desktop appears at1024px | Candidate64px/240–72px is a proposal, not a defect by itself |
| Navigation | 36px desktop/44px mobile;16px icons; grouped labels10px | Reference rows/icons are larger; local hierarchy is more compact |
| Shadows/motion | 1px/2px low-opacity shadow; hover translateY(-1px),180ms; sidebar200ms | Reduced-motion CSS exists; static tiles should not imply clickability |
| Breakpoints | Tailwind640/768/1024/1280/1536; review rail at1280 | Container width matters when sidebar consumes256px |

Contrast arithmetic on 10% semantic tint over white: success3.88:1 (below4.5 for small text), warning5.10, danger5.57, info5.31, brand5.64. This checks those pairs only, not all backgrounds, placeholders, focus rings or disabled states.

## Independent shell and Overview assessment

| Section | Current observation | Candidate refinement / preserve |
| --- | --- | --- |
| Logo | 32px mark and compact14px wordmark; no screenshot tagline | Preserve actual asset and accessible home link; don't enlarge brand at expense of workspace |
| Sidebar | Grouped navigation, explicit Planned group, persisted collapse; firm context duplicated in topbar | Keep module inventory/active state; resolve false firm-chevron affordance and tooltip dismissal |
| Global header | Firm name, approval reminder, mobile menu, sign-out; no search/profile/notifications | Preserve calm identity/approval reminder; size touch controls; no dummy reference controls |
| Page heading | Task title, short description and available actions | One clear title/action hierarchy; avoid stacking redundant eyebrows |
| Metrics | Four live count tiles, restrained accents, neutral zero signals | Clarify scopes, errors and direct action; don't add synthetic trends |
| Priority worklist | Four real queue categories including export jobs; responsive stacked rows | Keep all four; align count/title/action and avoid fixed metadata columns without data |
| Review snapshot | Latest8 records; real detail links; mono/right aligned financial values | Keep snapshot/queue distinction and source access; don't hardcode reference totals |
| Mobile Overview | Stacks metrics before worklist; screenshot shows significant scrolling to tasks | Consider compact summary layout after token decision; retain counts and reachability |

## Reference-image feature truth matrix

The inline user image was visually accessible at 1835×857, but the attachment binary/original filename is unavailable to filesystem tools. Therefore precise file identity and pixel-diff comparison are BLOCKED. The separate root khataone_overview_refined.png is 1376×768 and is a different collapsed-sidebar concept, not an interchangeable copy. Existing docs/design-reviews/overview proposals (1419×1108 and1513×1040) are unapproved user work and were preserved.

| Reference element | Current component/data/authorization | Classification | Recommendation |
| --- | --- | --- | --- |
| Brand/navigation | BrandLogo, DashboardNav, existing routes | EXISTING_SUPPORTED | Preserve IA including Platform and exports queue omitted by image |
| Firm name / role | DashboardSidebar/layout; verified active membership | EXISTING_NEEDS_REFINEMENT | Clear static identity; no simulated switcher |
| Firm dropdown | No selected-firm state or switch action | REFERENCE_ONLY | Product/tenant-selection decision |
| Global search + CtrlK | No search service or command palette | REFERENCE_ONLY | Scope/permission/data-source decision; no inert input |
| Help entry points | Public contact exists; no dashboard help center | REFERENCE_ONLY | Choose real destination/support contract before UI |
| Notification badge | No notification model/panel | REFERENCE_ONLY | Do not copy3 or add fake alert count |
| Profile/avatar menu | Sign-out exists; no profile menu | REFERENCE_ONLY | Keep actual sign-out; account management separately scoped |
| Date/greeting/weather icon | No corresponding operational component | REFERENCE_ONLY | Optional preference; not a task defect |
| Review/Clients actions | Actual guarded module links | EXISTING_SUPPORTED | Retain clear primary/secondary actions |
| Pending13 / intake1 | Exact firm counts exist; screenshot values are examples | EXISTING_NEEDS_REFINEMENT | Never hardcode13/1; reconcile error/count definitions |
| GST ready0 | Real ready-period count | EXISTING_SUPPORTED | Preserve neutral zero and actual period scope |
| Exports0/month | Completed status with created_at month cutoff | EXISTING_NEEDS_REFINEMENT | Decide completion-month semantics |
| +5 / −2 trends | No prior-period comparison query | REFERENCE_ONLY | Define interval/baseline before considering |
| Work queues | Review, intake, GST blockers, export jobs | EXISTING_NEEDS_REFINEMENT | Preserve fourth category; scope destinations |
| Assigned staff avatars | No work-queue assignment read/UI; client assigned_user_id documented | REFERENCE_ONLY | Define assignment semantics/visibility; no invented initials |
| Updated2/4/6hours | No per-queue update aggregation | REFERENCE_ONLY | Define event semantics before exposing timestamps |
| Priority sort / all queues | No worklist sorter or separate all-queues route | REFERENCE_ONLY | Existing order is static; no nonfunctional select |
| Colored card/icon treatment | Shared semantic tokens exist; screenshot accents are decorative | EXISTING_NEEDS_REFINEMENT | Improve hierarchy/accessibility without duplicating arbitrary colors |

What is already corrected: modal dashboard mobile navigation, keyboard skip link, active aria-current, India date display, page-scoped Ledger totals, client page counts, relevant export fields, neutral planned integrations, and request-cached firm context. Old audit recommendations for these are not new missing features.
`);
write('UI_UX_FLOW_AUDIT.md',`# UI and UX flow audit

KhataOne remains a WhatsApp-first intake system with an authorized CA decision layer. A readable page is not proof that its write workflow succeeds. This audit used live reads only; business mutations and side effects were not exercised.

## UI map: visible interaction surfaces

Public header → landing sections/FAQ → contact/lead form or auth. Auth form → onboarding for accounts without an active firm. Protected shell → Overview/Clients/Inbox/Review/Ledger/GST/Reports/Exports/Audit/Operations/Settings/Platform. Record links open dedicated detail routes; create/edit are pages. The only operational modal in the inspected shell is mobile navigation. Review detail is a responsive editor plus evidence/decision rail, not an in-place list/detail workspace. Select controls are native; there is no command palette, notifications drawer, client document browser or workspace picker.

## UX map: tasks, outcomes and recovery

| Journey | Real path / state ownership | Main friction and evidence | Recovery/decision boundary |
| --- | --- | --- | --- |
| Understand product → request demo | landing/contact → LeadCaptureForm → validated server lead capture | Static review examples; field-level confidence claim exceeds UI (020) | Blank signup validation tested locally; lead submission not sent |
| Sign in | login → Supabase Auth → active firm → dashboard | Hosted legacy configured domain404; current documented domain works | Actual sign-in passed; no credentials stored in package |
| New account → workspace | signup metadata → onboarding → firm/membership creation | Firm name collected at signup is not prefilled by onboarding form; failed membership read/setup needs careful recovery | Onboarding UI source inspected; existing account cannot demonstrate first-firm setup without mutation |
| Create/manage client | Clients → new/detail/edit → controlled client RPC/audit | Viewer affordances, error associations, misleading filtered empty, archive feedback (006/007/011/015) | Form GET inspection authorized; creates/edits/archive not submitted |
| WhatsApp intake triage | webhook/worker → Inbox status table → client/review/Operations context | Search is page-local (001); Inbox is a monitor, no dedicated detail/reassignment action | Shared phones/multiple GSTINs must not be auto-resolved by a new UI assumption |
| Review draft → decision | queue filters → transaction detail → source/fields → Save → Approve/reject/duplicate/clarify | Post-page search (001), independent Save/Approve (002), absent original preview (003), unlabeled clarification (011) | Preserve high-risk review boundary, posted immutability, atomic audit/handoff; no decisions/messages sent |
| Inspect/correct Ledger | ledger filters → entry → edit handoff → atomic correction | Return context and error association gaps; current-page totals correctly labeled | Correction changes handoff only; no source rewrite; audit note requirement is a product decision |
| Prepare GST | client/custom period → generation RPC → saved summary/detail | Date-only defaults (004), null-as-zero (014), mobile overflow (025), snapshot/live-source mismatch (027) | Prepared summaries/exports only; no direct filing; no tax formula changes proposed |
| Export approved work | type-specific form → queued export/job → worker → completed private file | Good relevant selectors/queued copy; open history may stay stale (008),80-row access limit (009) | No exports generated or downloaded; job/private storage boundaries retained |
| Investigate failure/change | Operations filters + role-gated Run now; Audit list/detail recents | Truncated errors (023), outcomes hidden (007), history/provenance gaps (009/019) | No job runs/retries; safe structured details before more recovery controls |
| Verify setup / future scope | Settings presence/selection; Platform planned integrations | Most setup indicators describe presence correctly; no proof of provider health from configured count | Do not turn future provider rows into live integration claims |

## States and coverage by route family

| Surface | Populated/normal read | Empty/filter behavior | Loading/error | Mutation/role variation |
| --- | --- | --- | --- | --- |
| Public8 routes | BROWSER_VERIFIED at7 widths | Signup blank validation and password toggle tested; static form layout | Browser errors absent; provider/server rejection not induced | lead/signup/recovery submissions BLOCKED |
|12 dashboard navigation routes | BROWSER_VERIFIED at7 widths | Source inspected; no complete multi-page/synthetic empty dataset | Actual content waited for outside aria-busy; fault injection not performed | One configured role only; other roles BLOCKED |
| Client/review/ledger/GST details | BROWSER_VERIFIED at320/1280/1440 using discoverable records | Missing-record/empty histories source only | Query failures source only; false404/zero risks identified | Decisions/corrections BLOCKED |
| Client new/edit; ledger edit | Follow-up GET-only evidence in authenticated-followup.json | No form edits or submission | Validation/pending failures source only | Read visibility only, not mutation authorization proof |
| Onboarding | CODE_INSPECTED | No-firm account state not available | Source setup/membership/error flow | Creation BLOCKED; no extra account created |

## Forms and action clarity

AuthForm already has controlled values, shared validation rules, error IDs, invalid state and password visibility; public blank signup produced no network write. Operational useActionState forms retain server error state but association/pending behavior varies. Plain decision/archive/job forms lack the same outcome model. Approving an edited but unsaved transaction is the highest-impact interaction ambiguity; a later implementation must explicitly choose the persisted-values contract before changing button composition.

No dirty-state navigation guard was found for review/client/ledger editing. Return links discard list parameters. Export type switching conditionally unmounts irrelevant fields, which correctly removes irrelevant submission inputs but can discard unsaved selections when switching back. This is a secondary convenience consideration, not justification to submit inactive fields.

## Status/data dictionary and semantic conflicts

| Meaning | Current source contract | UI implication |
| --- | --- | --- |
| draft / needs_review / duplicate | Review workload; AI output remains reviewable | Confidence and risk are not accounting approval |
| approved / exported | Posted review records are read-only in current checkout | Corrections use Ledger handoff flow; no undeclared reversal model |
| received / unmatched / failed / media_failed | Overview intake attention includes these states | Copy must not imply only unmatched/failed |
| queued / processing / failed / completed export | Worker lifecycle; only completed with storage path downloads | “Queued” is acknowledgment, not completed export |
| GST ready / needs_review / missing_documents | Saved period status and issue counts | Ready means preparation status, not government filing acceptance |
| configured / selected / verified | Presence, chosen provider and actual successful health are different | Settings booleans cannot certify provider availability |
| current-page total / exact count / sampled health | Different read scopes | Preserve labels; Operations1000 sampled health cannot silently stand for complete history |
| null versus0 | Missing evidence versus known zero | Use unavailable text; never invent confidence/tax values |

Accounting decisions for a later phase: meaning of negative “Net payable”, cess/tax buckets, whether unresolved sources and generated-snapshot members are displayed separately, readiness rules for invalid GSTIN/undated records, and whether a correction note is mandatory. These require product/CA validation; this audit neither changes the calculations nor gives legal/GST advice.

## Documentation reconciliation

CRD means Creative Requirements Document. The earlier dashboard plan mentions details-based mobile navigation, missing skip links and text-first extraction; current source has a native modal menu, skip/focus support and media-aware backend extraction. Original media still is not rendered in the review UI. The old performance diagnosis says exports run synchronously and Clients search runs after pagination; those statements are superseded by queued exports and SQL-side client search. Historical worker sequentiality and scheduler-deployment status are also superseded by newer Tracker entries. Keep old evidence as dated observations, not current bug declarations.

The current Tracker includes recent applied migrations/deployment work alongside older “unapplied” entries. This audit did not query hosted migration history or certify all database contracts. Its hosted UI checks do not establish that the deployment exactly matches local59b903f. Existing September13 Overview concepts are still awaiting visual approval. No app direction, Tracker entry or implementation plan was changed.
`);
write('RESPONSIVE_ACCESSIBILITY_AUDIT.md',`# Responsive and accessibility evidence

Benchmark: WCAG2.2 AA plus project touch/density targets. This is a scoped audit, not a compliance claim. Automation checks document width, control-name heuristics and bounds; it does not replace a screen reader or expert examination of every state.

## Environments and samples

| Environment | Coverage | Browser/device conditions |
| --- | --- | --- |
| Local isolated dev |8 public/auth pages ×7 widths =56 samples;3 CSS-zoom stress samples | Chromium153.0.8010.12, Windows, DPR1, en-IN, Asia/Kolkata,100%; localhost3105; integration config blank; external/write requests blocked |
| Hosted read-only |${live.results.length} samples:12 module routes×7 widths + Overview keyboard revisit +4 details×3 widths | khataone.vercel.app; same Chromium/Windows; existing account;100%; no throttling; actual deployed SHA unverified |
| Hosted form follow-up |${follow?.results.length||0} recorded samples; see authenticated-followup.json | GET-only create/edit forms; same role/session policy; no record changes |

Public widths/heights:320×568,390×844,768×1024,1024×768,1280×800,1440×900,1920×1080. Hosted module widths320/390 use844px height;768/1024/1280/1440/1920 use900px. Detail probes use320/1280/1440×900. Expanded sidebar is256px at desktop and hidden below1024; collapse tested separately. Height differences mean these are not equivalent pixel-comparison runs.

Readiness method: wait for an actually visible dashboard h1 outside an aria-busy ancestor, then document fonts. A preliminary h1-only probe incorrectly observed Preparing workspace and was discarded. Even the corrected landmark method measures rendered content observation, not all filters hydrated or every row painted. No stored sessions/HAR/raw HTML/private document payloads were saved.

## Measured defects

| Route/state | Observation | Finding |
| --- | --- | --- |
${table(overflow.map(r=>[r.route+' '+r.viewport.width+'×'+r.viewport.height,'Document '+r.scrollWidth+'px versus viewport '+r.width+'px',r.route.includes('gst-summary')?'KO-UX-025':'KO-UX-018']))}
| Review filter toolbar1280 | search width51px;1440 width71px;1920 width551px | KO-UX-018 |
| Review detail320/1280/1440 | clarification textarea lacks label/accessible name | KO-UX-011 |
| Collapsed Clients link | tooltip remains visible after Escape | KO-UX-012 |
| Hosted shell320/390 | sign-out32×44px; width below44px project target | KO-UX-026 |
| Public auth320/390 | fields36px; password toggle28×28px | KO-UX-013 |
| Small success text on10% tint/white | contrast3.88:1 versus4.5 target | KO-UX-010 |

All56 normal public samples returned200 with no document overflow or unnamed controls under the heuristic. Hosted module/detail samples other than the listed overflow cases fit the document width; this does not prove there is no clipped content inside a card. Tables intentionally scroll horizontally and should retain that behavior. No pageerror events were recorded in the main public/hosted runs.

## Keyboard and accessibility matrix

| Criterion/interaction | Method/result | Limit |
| --- | --- | --- |
|2.4.1 bypass blocks | Hosted first Tab reaches skip link; Enter focuses #dashboard-content: passed | Public login first focus is brand/home, not dashboard skip behavior |
|2.1.1 keyboard /2.4.3 focus order | Mobile dialog Escape closes and returns trigger focus: passed | Full tab cycling and outside-click were source-inspected, not completed in the final hosted probe |
|1.4.13 hover/focus content | Collapsed tooltip visible on focus; Escape fails to dismiss | Hoverability and overlap combinations need manual follow-up |
|4.1.2 name/role/value;3.3.2 labels | Heuristic detected review clarification missing name | Heuristic ignores some link naming subtleties; no accessibility-tree/screen-reader certification |
|3.3.1 error identification;3.3.3 suggestions | Public blank signup shows associated errors; operational associations source gaps | No operational form was submitted |
|1.4.3 text contrast | Deterministic semantic foreground/background calculation | Remaining surface combinations/placeholder/focus/disabled colors unmeasured |
|1.4.10 reflow | Document-width checks find review1280/GST320 overflow | Financial table exception does not justify page-level overflow |
|1.4.4 resize text | Public CSS zoom2 stress on home/login/signup | CSS zoom is not browser zoom; actual200% browser zoom/text-only enlargement BLOCKED/not performed |
|2.5.8 target size | Bounds recorded;44px project misses reported | AA minimum24px and spacing exceptions differ;28/32px is not automatically an AA failure |
|2.4.7 /2.4.11 focus visible/not obscured | Focus outlines source-defined; skip/menu actual focus tested | All sticky-header/table/scroll positions unverified |
|1.3.1 info/relationships | Headings, labels, table headers, named scroll regions inspected | Table scope associations and every long-cell layout need screen-reader review |
|4.1.3 status messages | FormMessage polite; loading aria-busy/live; action feedback gaps identified | Live provider/action results not induced |
|Motion/preferences | Reduced-motion CSS present | OS/browser preference combinations and native devices untested |

Landing mobile navigation is a nonmodal native disclosure: Escape leaves it open; following an anchor closes it. This is recorded as behavior, not automatically a dialog Escape defect. Dashboard mobile navigation is a native modal and passed its Escape/focus-return test.

## Images and privacy

Public screenshots cover each public layout at320 and1440 plus invalid signup and CSS stress. A separate hosted screenshot pass covers all19 dashboard layouts at320 and1440 (38 distinct screenshots; ${capture?.results.length||0} observations including an Overview revisit). Its numeric observations are not pooled with the main performance baseline. Hosted screenshots are masked before capture: firm identity, record headings, text blocks, field values, financial tiles, source evidence and table rows are obscured. Mask rectangles preserve layout geometry; they are not empty/skeleton application states. No unredacted live record-detail screenshot was saved. See evidence/authenticated-screenshots.json for the filename-to-route mapping. Reports describe defects independently of screenshots.

## Remaining verification

True browser zoom, text-only200%, NVDA/VoiceOver, keyboard-only full journeys, virtual keyboards, Safari/Firefox, native iOS/Android, print, reduced-motion runtime, long synthetic firm/party/invoice strings, multi-page data, empty/error/permission variants and sticky-header scrolling remain unverified. Test those with sanitized fixtures after candidate fixes. No claim of application-wide responsive/accessibility pass is made.
`);
write('PERFORMANCE_UX_BASELINE.md',`# Performance UX baseline

No load test, infrastructure change, cache-policy change or new application instrumentation occurred. This audit distinguishes UI feedback from useful records and from completed actions. The browser runner is standalone and records no financial payloads or network bodies.

## Current measurements

Local56 public samples are development-mode observations including possible compilation/font warm-up. Do not compare them to production targets. Hosted samples below are one sequential hard navigation per route/viewport, plus explicitly recorded revisits/details. Values are goto-start → nonloading visible h1 → font-ready observation, not true “all controls usable”, click latency, LCP, INP, SQL duration or p95. Dataset size, function cold state and exact deployed commit are unverified. Browser/network conditions: Windows Chromium153, no throttling, same local network, no concurrent load generator.

| Hosted route | Samples | Min observation ms | Max observation ms |
| --- | ---: | ---: | ---: |
${table(durationRows)}

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
`);
write('IMPLEMENTATION_INPUTS.md',`# Decision-ready implementation inputs

This is not the implementation plan and applies no fixes. The diagnosis identifies27 canonical findings in FINDINGS.md/FINDINGS.csv. Keep their IDs when a separate planning phase assigns work.

## Priority inputs

| Scope | Findings | Implicated files / reuse | Decision and acceptance boundary |
| --- | --- | --- | --- |
| Core review correctness |001,002,003 | review-queue pages, TransactionReviewForm, review actions; existing controlled RPCs | Multi-page fixture search, unsaved edit interlock, private evidence before decision; preserve posted immutability/atomic handoff |
| Date and source meaning |004,005,014,027 | GstSummaryForm, ExportForm, format.ts, GST detail, query consumers | Agree date-only/IST boundaries, unknown-vs-zero and snapshot-source definition; no tax formula rewrite |
| Proven mobile failures |018,025,026 | review filter grid, GST PageBody/grid wrappers, dashboard sign-out | Fix containing width/minimum size; retain financial columns; verify measured1280/320 failures |
| Shared accessibility |010,011,012,013 | StatusChip, FieldError/Input, domain forms, DashboardNav, auth forms | Darker success text, label/error contract, tooltip dismissal,44px touch targets; screen-reader/zoom checks |
| Action transparency |006,007,008,016,021 | role capability presentation, plain action forms, ExportForm/history, return links, UpdatePasswordForm | Preserve server guards; accurate pending/error/success, refresh, safe return context; mock password success |
| Operational investigation |009,019,023 | PaginationControls, Audit, Operations, Exports/GST selectors | Bounded complete access, allowlisted metadata/error details; no raw payload display |
| Clarity/polish |015,017,020,022,024 | Clients empty/filter UI, shell identity, landing copy, Overview, shared tokens | Agree literal count definitions and density; no fake menus/trends/staff |

## UI-only versus dependent work

Bounded UI candidates: control hit areas, accessible clarification label, error ID wiring, tooltip Escape, responsive grid containment, success foreground token, truthful static identity/marketing copy and password event reference handling. These still need focused verification; they are not permission to change source in this audit.

Read/query/workflow-dependent candidates: full-result search/pagination, count/error semantics, permission-aware forms, dirty review decisions, private source preview, asynchronous export refresh, audit metadata navigation, snapshot provenance and date filters. Existing backend safeguards must be reviewed with the later changes. Any new RPC, schema field, selected firm state, source access route or worker behavior needs a documented technical/product decision.

## Open product choices

- Keep compact56px shell/256–68px sidebar/8px cards, or accept selected reference candidate values? Validate operational density before a global change.
- Is full mobile review/edit an intended v1 workflow, or primarily triage? Current routes expose full forms; do not silently remove actions.
- Preserve separate Save and Approve with a dirty-state interlock, or deliberately define a combined transaction? Default candidate preserves separate explicit save.
- Should post-approval navigation continue to Ledger, return to the filtered queue, or offer both? Preserve current handoff until decided.
- Does “exports this month” mean creation or completion month, and in which zone?
- Which date/source population explains a saved GST snapshot? How should current unresolved or subsequently approved records appear?
- Is a correction note mandatory? Are negative net amounts described as payable/credit? These are accounting/product decisions, not CSS choices.
- What sanitized metadata can audit/error drilldown expose, and to which existing roles?
- Does v1 need staff assignment, staff invites, real firm switching or a source document library? Their absence is not solved by copying reference decoration.

## Reference-only backlog, not UI defects

Global search/CtrlK, notifications, help center, profile menu, real firm picker, greeting/date ornament, metric trends, queue staff avatars, update timestamps, priority sorter and all-queues destination. Each requires a real data/action/access contract before UI. Never carry over sample13/1/0,+5/−2, notification3 or initials. Keep actual modules even where the screenshot omits them.

## Proposed acceptance fixture set

Use isolated non-production fixtures with two firms and owner/admin/staff/viewer/revoked users; no actual client records. Include51+ review/inbox rows with matches only beyond first page, long names/GSTINs/invoices, missing/zero values, low-confidence/risky drafts, posted records and corrected handoffs. Include image/PDF/audio/text originals and unavailable/private-denied media. Include generated GST snapshots plus later approvals, boundary dates and historical periods beyond picker limits; queued/completed/failed exports and jobs; structured safe audit metadata and intentionally failing read/mutation responses.

Acceptance should prove: displayed values match the selected source/status/date scope; zero is not unavailable; unsaved edits cannot be accidentally approved; posted records stay immutable; action/audit behavior remains atomic/idempotent where currently designed; private downloads remain protected; errors preserve useful input and offer recovery; true browser zoom and keyboard/screen-reader flow work; page width stays bounded at all seven widths while tables remain scrollable. Do not auto-approve, replay jobs, relax RLS or introduce direct filing.

## Retain as-is contracts

Approved stack, module IA, WhatsApp-first intake, draft AI output, original/raw evidence retention, reviewer-controlled approval, ledger handoff correction semantics, atomic controlled RPCs, firm_id/RLS, private storage/downloads, truthful GST preparation boundary, planned integrations, shared primitives, scoped pagination, request-cached firm context and independent read concurrency. Existing uncommitted Overview design work belongs to the user and was not overwritten.

## Verification gates for later work

Run appropriate existing source/action/format tests plus meaningful new fixture checks for the changed behavior; lint/typecheck/build. Repeat the exact measured overflow/keyboard failures, then broader affected consumer coverage. Do not substitute source-regex tests for browser or tenant tests. Do not promote this audit’s one-account read observations into mutation/security/capacity approval.
`);
const top=findings.filter(f=>f.severity==='High');
write('README.md',`# KhataOne UI/UX diagnosis — 2026-09-13

The console has a usable shared foundation and many earlier polish fixes already exist. Its most consequential gaps concern trustworthy review decisions, source evidence, complete filtering, date/data meaning, and two reproduced responsive failures. Copying the reference screenshot would not resolve these workflow problems.

This is an audit-only package:27 findings,8 Markdown reports and matching CSV, plus sanitized evidence/scripts. No application fixes, database changes, exports, approvals, job retries, WhatsApp messages, deployment or commits were performed. User supplied credentials authorized a later read-only hosted pass, superseding the earlier public-only instruction; credentials are not included.

## Run and evidence boundaries

- Local branch main; commit59b903fa696622dc81e5cfb4df9d37042c46fc7d. Initial dirty files: docs/Tracker.md; untracked docs/design-reviews/ and khataone_overview_refined.png. Baseline341 existing files hashed in evidence/baseline.json.
- Public browser: isolated local Next dev at127.0.0.1:3105, integration configuration blank in child environment, external/write requests blocked;56 route/viewport samples.
- Hosted browser: current documented https://khataone.vercel.app, read-only configured account, ${live.results.length} main samples plus ${follow?.results.length||0} follow-up samples and a separate ${capture?.results.length||0}-observation screenshot pass. All19 dashboard screen layouts were opened;38 masked screenshots cover narrow/desktop layouts. The legacy configured khata-one-azure domain returned404. Actual hosted commit/database migration state remains unverified. Follow-up role: ${follow?.environment?.role||'not independently captured'}.
- Anonymous public8 routes and all19 dashboard screen routes were source-inspected; onboarding source was inspected, but its create-workspace state was not entered with a new account. Exact screen inventory in SYSTEM_UI_MAP.md.
- Evidence labels: CODE_INSPECTED (checkout), BROWSER_VERIFIED (named environment), DOCUMENTED_REQUIREMENT, REFERENCE_OBSERVED, HYPOTHESIS (cause/inference), BLOCKED (missing safe state/input), NOT_APPLICABLE. One label never substitutes for another.

## Highest-impact findings

${top.map(f=>'- **'+f.id+' — '+f.title+'**: '+f.observed).join('\n')}

Hosted repro highlights: Review Queue1280px viewport produced1328px document width and51px search field; GST detail320px produced998px document width. Clarification textarea was unnamed. Collapsed tooltip stayed open after Escape. Dashboard skip navigation and mobile-menu Escape/focus return passed. Source date expressions reproduced previous-day September boundaries in India; this did not generate a GST summary.

## Artifact index

| File | Contents |
| --- | --- |
| [SYSTEM_UI_MAP.md](SYSTEM_UI_MAP.md) |28 screen routes, shell/state/data/action contracts, route handlers, current stack |
| [COMPONENT_DESIGN_SYSTEM_AUDIT.md](COMPONENT_DESIGN_SYSTEM_AUDIT.md) |18 component files, direct consumers, tokens, shell assessments, reference feature truth |
| [UI_UX_FLOW_AUDIT.md](UI_UX_FLOW_AUDIT.md) |Separate visual and task flows, state coverage, recovery and status meaning |
| [RESPONSIVE_ACCESSIBILITY_AUDIT.md](RESPONSIVE_ACCESSIBILITY_AUDIT.md) |Viewport matrix, measured failures, keyboard/contrast evidence and limits |
| [PERFORMANCE_UX_BASELINE.md](PERFORMANCE_UX_BASELINE.md) |Current observations versus historical latency; readiness definition and uncertainty |
| [FINDINGS.md](FINDINGS.md) |Canonical detailed findings and candidate acceptance tests |
| [FINDINGS.csv](FINDINGS.csv) |Matching machine-readable rows and IDs |
| [IMPLEMENTATION_INPUTS.md](IMPLEMENTATION_INPUTS.md) |Impacted files, decisions, reuse and regression inputs; not an implementation plan |
| evidence/ |Version/Git baselines, checks/build, source inventory, browser JSON, public and redacted Overview images, standalone diagnostics |

## Inputs and document coverage

Reviewed operating/product requirements: AGENTS.md, docs/rules.md, BRD.md, CRD.md (Creative Requirements Document), PRD.md, TRD.md, Backend-Schema.md, App-Flow.md, Implementation-Plan.md, Design.md, UI-UX-Design-Brief.md, Tracker.md and Environment-Mapping.md. Reviewed audit/release context: Dashboard-UI-UX-Audit-Implementation-Plan.md, Live-Website-UI-UX-Audit-Implementation-Plan.md, security-hardening-plan.md, Production-Runbook.md, RLS-Verification-Plan.md, Performance-Architecture-Brief.md, performance/PERFORMANCE_DIAGNOSIS.md, performance/PERFORMANCE_DEPLOYMENT_RUNBOOK.md and performance/dashboard-latency-results.md. Current-focus entries take precedence over old chronological status notes; read-only UI inspection is not migration/deployment verification. Large historical logs were read in chunks; attached raw timing/SQL/production-hardening artifacts were not all independently re-audited.

Reviewed existing user Overview concepts in docs/design-reviews/overview. Supplied diagnosis document at D:/Per_Docs/KhataOne_UI_UX_Diagnosis_Codex_Prompt.md was treated as task instructions only after the user's proceed clarification. Inline screenshot visually accessible at1835×857; original binary filename/file identity unavailable, so exact pixel comparison is BLOCKED. The root PNG is a different reference and existing user work. No generated reference element was assumed to be live data or approved scope.

Used product-design and ui-ux-pro-max skill guidance. Project-specific khataone skills named by AGENTS were not located in the available skill paths; no claim is made that they were applied. Installed Next docs were consulted for current layout/page boundaries; no framework API implementation was changed.

## Verification and limitations

Lint and TypeScript passed;7 inspected dashboard regression scripts passed. Isolated production build passed (integration values disabled). Evidence/checks.json and build.json record outcomes. Most existing dashboard checks assert source patterns; they do not prove authenticated mutations. Public invalid signup/password toggle/menu behavior and hosted normal navigation/keyboard checks were exercised. The first form-follow-up sign-in timed out without an invalid-credentials message; a later fresh-browser attempt completed normally. This is not proof that intermittent sign-in/navigation stalls are resolved. Final source-scope proof is in evidence/final-verification.json: all341 baseline file hashes unchanged, no unexpected addition outside the audit directory, application-source change count0.

Not tested: business writes, real password changes, lead/email submissions, private files/downloads, paid providers, jobs/webhooks, two-firm/viewer/revoked membership scenarios, production query plans, failure injection, long/multi-page synthetic datasets, native devices, screen readers, true browser zoom, capacity and p95. CSS zoom stress is labeled accordingly. Hosted deployment parity is an unverified assumption and must be confirmed before translating hosted observations into a release claim.

Tracker was read but not edited: the user-authorized diagnosis restricts changes to this audit directory and takes precedence over the general Tracker-update workflow. This package is the audit status record. No application-wide pass or production-readiness claim is made.
`);
write('evidence/coverage.json',JSON.stringify({screenRoutes:pages.map(p=>({route:route(p),source:'CODE_INSPECTED',browser:route(p)==='/onboarding'?'BLOCKED: existing firm account; creation excluded':route(p).startsWith('/dashboard')?'See authenticated-browser/followup exact route samples':'public-browser.json'})),componentFiles:components.length,publicSamples:pub.results.length,hostedMainSamples:live.results.length,hostedFollowupSamples:follow?.results.length||0,findings:findings.length},null,2));
// Add an actionable order to canonical findings without pretending implementation was authorized.
write('FINDINGS.md',read('FINDINGS.md')+`\n\n## Impact/effort review order\n\n1. Reproduce and address core meaning/workflow blockers001–005,021,025,027 with the indicated fixtures and contracts.\n2. Contained fixes:010–013,015,017–018,020,025–026; shared consumers and measured failures first. Small effort does not reduce accessibility severity.\n3. Coordinate structural work006–009,014,016,019,022–023 with query/state/provenance decisions.\n4. Decide density/token proposal024 only after operational behavior and measurable reflow are stable.\n\nRetain existing request-scoped firm context, role/RLS guards, private storage, raw/source evidence, posted immutability, atomic handoff/audit, approved-source GST preparation, bounded queries, real module inventory, mobile dialog/skip focus and accurate page-scoped captions. No reference-only search, badges, trends, avatars or filing claims enter this checklist.\n`);
console.log(JSON.stringify({reports:8,findings:findings.length,screenRoutes:pages.length,components:components.length,hostedSamples:allLive.length}));
