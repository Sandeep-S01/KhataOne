# Overview page visual refinement proposal

Date: 2026-09-13. Status: PNG concept prepared for user approval; not implemented.

Scope: the supplied Overview screenshot, including its visible navigation context. No application, shared component, backend, schema, query, or other page changes.

Deliverable: [Overview PNG concept](overview-proposal.png).

## Assessment

The screenshot has the correct CA workflow, useful real counts, recognizable navigation, explicit review states, and right-aligned financial values. Keep these strengths. The opportunity is to improve scanning and density with deliberate spacing, less explanatory copy, and predictable table geometry.

## High-priority findings and fixes

1. **Review work appears too far down the page.** Tall summary tiles, a large introduction, and multi-line worklist descriptions consume the first screen. Use a compact title, shorter tiles, and single-line worklist rows so records appear sooner.
2. **Table wrapping disrupts scanning.** Invoice numbers, missing-value labels, vendors, and long client names create inconsistent line breaks. Reserve explicit invoice/amount widths, keep identifiers and `Not provided` on one line, and use deliberate two-line treatment for long client names. Retain full values; do not rename clients or replace missing amounts with zero.
3. **Too much repeated explanation.** The firm is repeated in the sidebar, topbar, and introductory sentence. Worklist descriptions repeat queue definitions. Keep workspace identity in the shell and one short CA-approval reminder; remove operational feature explanations.
4. **Action placement feels uneven.** Different-length worklist titles and badges lack common anchors. Align task names, count badges, and destination actions to three stable columns. Keep one primary header button and a quieter Clients action.
5. **Attention and inactivity need different emphasis.** Preserve amber for outstanding work and neutral treatment for zero readiness/export counts. Zero completed exports is not a success claim. Confidence remains a neutral numeric value; this proposal introduces no accounting risk thresholds.

## Medium-priority refinements

- Use a compact heading scale and consistent body text, with monospace/tabular financial values and invoice numbers. Keep missing-value labels in the normal UI font.
- Use white working surfaces on the existing warm background, fine separators, restrained elevation, and consistent 8px corners.
- Keep status chips compact, legible, consistently capitalized, and identifiable by text as well as color.
- Match the right alignment of numeric headers to their cells; normalize row-action spacing.
- Extend the sidebar surface through the full composition and align its group labels, icons, and active-state treatment.
- Use a single consistent outline icon family during eventual implementation. The generated PNG contains illustrative icon approximations.
- Label the snapshot as eight latest records and add a clear link to the existing review queue destination.

## Proposal decisions

The PNG preserves the four summary counts (14, 1, 0, 0), worklist counts (14, 1, 1, 0), and all eight screenshot records. It preserves missing data and needs-review states. It shortens the page title to Overview with CA operations console as supporting context. It proposes no new data, filters, integrations, filing capabilities, or automatic approvals.

The existing design documents and directly inspected Overview source informed this proposal. The UI/UX skill's search utility could not run because Python was unavailable; recommendations rely on the repository design system, skill guidance, and screenshot inspection.

## Approval and verification boundaries

This is an AI-generated static desktop concept. Font shapes, logo rendering, and icons are visual approximations rather than production assets. The screenshot supplies the displayed data; live data was not queried. The visible desktop composition was inspected for hierarchy, complete rows, wrapping, and numeric alignment. Responsive behavior, exact contrast ratios, keyboard interaction, tooltips, hover/focus states, and pixel-accurate rendering require verification if implementation is subsequently requested. No runtime code changed, so application tests/builds were not rerun for this image-and-document deliverable.

Suggested implementation order after approval: page density and copy, table geometry, worklist alignment, then typography/surface details and responsive/accessibility verification. Shared navigation changes would need to be kept within the approved scope rather than automatically propagated to other pages.
