# UI and UX flow audit

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
