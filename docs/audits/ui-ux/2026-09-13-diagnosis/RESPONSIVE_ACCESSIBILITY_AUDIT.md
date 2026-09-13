# Responsive and accessibility evidence

Benchmark: WCAG2.2 AA plus project touch/density targets. This is a scoped audit, not a compliance claim. Automation checks document width, control-name heuristics and bounds; it does not replace a screen reader or expert examination of every state.

## Environments and samples

| Environment | Coverage | Browser/device conditions |
| --- | --- | --- |
| Local isolated dev |8 public/auth pages ×7 widths =56 samples;3 CSS-zoom stress samples | Chromium153.0.8010.12, Windows, DPR1, en-IN, Asia/Kolkata,100%; localhost3105; integration config blank; external/write requests blocked |
| Hosted read-only |97 samples:12 module routes×7 widths + Overview keyboard revisit +4 details×3 widths | khataone.vercel.app; same Chromium/Windows; existing account;100%; no throttling; actual deployed SHA unverified |
| Hosted form follow-up |10 recorded samples; see authenticated-followup.json | GET-only create/edit forms; same role/session policy; no record changes |

Public widths/heights:320×568,390×844,768×1024,1024×768,1280×800,1440×900,1920×1080. Hosted module widths320/390 use844px height;768/1024/1280/1440/1920 use900px. Detail probes use320/1280/1440×900. Expanded sidebar is256px at desktop and hidden below1024; collapse tested separately. Height differences mean these are not equivalent pixel-comparison runs.

Readiness method: wait for an actually visible dashboard h1 outside an aria-busy ancestor, then document fonts. A preliminary h1-only probe incorrectly observed Preparing workspace and was discarded. Even the corrected landmark method measures rendered content observation, not all filters hydrated or every row painted. No stored sessions/HAR/raw HTML/private document payloads were saved.

## Measured defects

| Route/state | Observation | Finding |
| --- | --- | --- |
| /dashboard/review-queue 1280×900 | Document 1328px versus viewport 1280px | KO-UX-018 |
| /dashboard/gst-summary/[recordId] 320×900 | Document 998px versus viewport 320px | KO-UX-025 |
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

Public screenshots cover each public layout at320 and1440 plus invalid signup and CSS stress. A separate hosted screenshot pass covers all19 dashboard layouts at320 and1440 (38 distinct screenshots; 39 observations including an Overview revisit). Its numeric observations are not pooled with the main performance baseline. Hosted screenshots are masked before capture: firm identity, record headings, text blocks, field values, financial tiles, source evidence and table rows are obscured. Mask rectangles preserve layout geometry; they are not empty/skeleton application states. No unredacted live record-detail screenshot was saved. See evidence/authenticated-screenshots.json for the filename-to-route mapping. Reports describe defects independently of screenshots.

## Remaining verification

True browser zoom, text-only200%, NVDA/VoiceOver, keyboard-only full journeys, virtual keyboards, Safari/Firefox, native iOS/Android, print, reduced-motion runtime, long synthetic firm/party/invoice strings, multi-page data, empty/error/permission variants and sticky-header scrolling remain unverified. Test those with sanitized fixtures after candidate fixes. No claim of application-wide responsive/accessibility pass is made.
