import {
  ActionLink,
  DataTable,
  EmptyState,
  PageBody,
  PageHeader,
  QueryError,
  RecordCount,
  SectionCard,
  SetupRequired,
  StatTile,
  TextLink,
  tableActionCellClass,
  tableActionHeadCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableMonoTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tablePrimaryTextClass,
  tableRowClass,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import {
  attentionToneForCount,
  countHint,
  countOrUnavailable,
  displayCount,
  formatNullablePercent,
  positiveToneForCount,
} from "@/lib/availability";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { withServerTiming } from "@/lib/request-performance";

export const dynamic = "force-dynamic";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "Not provided";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function statusTone(status: string) {
  switch (status) {
    case "draft":
      return "info";
    case "needs_review":
    case "duplicate":
      return "warning";
    case "approved":
    case "ready":
      return "success";
    case "failed":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export default async function DashboardPage() {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables before opening the protected CA operations workspace." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const pendingReviewPromise = supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .in("status", ["draft", "needs_review", "duplicate"]);
  const gstReadyPromise = supabase
    .from("gst_periods")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .eq("status", "ready");
  const gstBlockedPromise = supabase
    .from("gst_periods")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .in("status", ["missing_documents", "needs_review"]);
  const intakeAttentionPromise = supabase
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .in("processing_status", ["received", "unmatched", "failed", "media_failed"]);
  const exportsAttentionPromise = supabase
    .from("exports")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .in("status", ["queued", "processing", "failed"]);
  const exportsThisMonthPromise = supabase
    .from("exports")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .eq("status", "completed")
    .gte("created_at", monthStart.toISOString());
  const reviewItemsPromise = supabase
    .from("transactions")
    .select(
      "id, transaction_type, status, party_name, invoice_number, total_amount, confidence_score, created_at, clients(business_name)",
    )
    .eq("firm_id", firm.id)
    .in("status", ["draft", "needs_review", "duplicate"])
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(8);

  const [
    pendingReview,
    gstReady,
    gstBlocked,
    intakeAttention,
    exportsAttention,
    exportsThisMonth,
    reviewItemsResult,
  ] = await Promise.all([
    withServerTiming("dashboard.pending_review_count", () => pendingReviewPromise),
    withServerTiming("dashboard.gst_ready_count", () => gstReadyPromise),
    withServerTiming("dashboard.gst_blocked_count", () => gstBlockedPromise),
    withServerTiming("dashboard.intake_count", () => intakeAttentionPromise),
    withServerTiming("dashboard.exports_attention_count", () => exportsAttentionPromise),
    withServerTiming("dashboard.exports_month_count", () => exportsThisMonthPromise),
    withServerTiming("dashboard.review_snapshot", () => reviewItemsPromise),
  ]);
  const { data: reviewItems, error: reviewItemsError } = reviewItemsResult;
  const pendingReviewCount = countOrUnavailable(pendingReview);
  const gstReadyCount = countOrUnavailable(gstReady);
  const gstBlockedCount = countOrUnavailable(gstBlocked);
  const intakeAttentionCount = countOrUnavailable(intakeAttention);
  const exportsAttentionCount = countOrUnavailable(exportsAttention);
  const exportsThisMonthCount = countOrUnavailable(exportsThisMonth);
  const hasUnavailableOverviewCount = [
    pendingReviewCount,
    gstReadyCount,
    gstBlockedCount,
    intakeAttentionCount,
    exportsAttentionCount,
    exportsThisMonthCount,
  ].some((value) => value === null);
  const priorityItems = [
    {
      label: "Review extracted transactions",
      count: pendingReviewCount,
      href: "/dashboard/review-queue",
      tone: attentionToneForCount(pendingReviewCount),
      description: "Draft, needs-review, and duplicate-risk records waiting for CA decision.",
      actionLabel: "Review transactions",
    },
    {
      label: "Triage WhatsApp intake",
      count: intakeAttentionCount,
      href: "/dashboard/inbox",
      tone: attentionToneForCount(intakeAttentionCount),
      description: "Received, unmatched, failed, or media-failed inbound messages.",
      actionLabel: "Open WhatsApp inbox",
    },
    {
      label: "Resolve GST blockers",
      count: gstBlockedCount,
      href: "/dashboard/gst-summary",
      tone: attentionToneForCount(gstBlockedCount),
      description: "Periods blocked by missing documents, mismatches, or pending review.",
      actionLabel: "View GST periods",
    },
    {
      label: "Check export jobs",
      count: exportsAttentionCount,
      href: "/dashboard/exports",
      tone: attentionToneForCount(exportsAttentionCount),
      description: "Queued, processing, or failed private export jobs.",
      actionLabel: "View export jobs",
    },
  ];

  return (
    <div>
      <PageHeader
        title="CA operations console"
        description={`Prioritize intake, review, GST, and export work for ${firm.name ?? "this firm"}.`}
        actions={
          <>
            <ActionLink href="/dashboard/review-queue" variant="primary">
              Review queue
            </ActionLink>
            <ActionLink href="/dashboard/clients">
              Clients
            </ActionLink>
          </>
        }
      />

      <PageBody>
        {hasUnavailableOverviewCount && (
          <QueryError message="One or more overview counts could not be loaded. Refresh to retry." />
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Pending review"
            value={displayCount(pendingReviewCount)}
            tone={attentionToneForCount(pendingReviewCount)}
            hint={countHint(
              pendingReviewCount,
              "Draft, needs-review, and duplicate-risk transactions.",
            )}
          />
          <StatTile
            label="Intake attention"
            value={displayCount(intakeAttentionCount)}
            tone={attentionToneForCount(intakeAttentionCount)}
            hint={countHint(
              intakeAttentionCount,
              "Received, unmatched, failed, or media-failed WhatsApp intake records.",
            )}
          />
          <StatTile
            label="GST ready periods"
            value={displayCount(gstReadyCount)}
            tone={positiveToneForCount(gstReadyCount)}
            hint={countHint(
              gstReadyCount,
              "Generated periods marked ready for review/export.",
            )}
          />
          <StatTile
            label="Exports this month"
            value={displayCount(exportsThisMonthCount)}
            tone={positiveToneForCount(exportsThisMonthCount)}
            hint={countHint(
              exportsThisMonthCount,
              "Completed files created this month from approved records.",
            )}
          />
        </div>

        <SectionCard
          title="Priority worklist"
          description="Start with the queues that can block ledger handoff, GST readiness, or private exports."
          bodyClassName="p-0"
        >
          <div className="divide-y divide-khata-border">
            {priorityItems.map((item) => (
              <div
                key={item.label}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tone={item.tone}>
                      {item.count === null
                        ? "Unavailable"
                        : `${item.count} open`}
                    </StatusChip>
                    <h2 className="text-sm font-semibold text-khata-ink">
                      {item.label}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-khata-muted">
                    {item.description}
                  </p>
                </div>
                <TextLink href={item.href} aria-label={item.actionLabel}>
                  {item.actionLabel}
                </TextLink>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Review queue snapshot"
          description="Newest AI-created records waiting for a CA decision."
          actions={
            <RecordCount value={reviewItems?.length ?? 0} label="latest" />
          }
          bodyClassName="p-0"
        >
          {reviewItemsError && (
            <QueryError message={reviewItemsError.message} />
          )}

          {!reviewItemsError && (!reviewItems || reviewItems.length === 0) && (
            <EmptyState
              title="No review items pending"
              message="New WhatsApp documents and draft extractions will appear here when they need a reviewer decision."
              action={
                <ActionLink href="/dashboard/inbox">
                  Open inbox
                </ActionLink>
              }
            />
          )}

          {!reviewItemsError && reviewItems && reviewItems.length > 0 && (
          <DataTable minWidth={940} ariaLabel="Latest review queue records">
            <thead className={tableHeaderClass}>
              <tr>
                <th className={tableHeadCellClass}>Client</th>
                <th className={tableHeadCellClass}>Party</th>
                <th className={tableHeadCellClass}>Invoice</th>
                <th className={tableHeadCellClass}>Type</th>
                <th className={tableHeadCellClass}>Status</th>
                <th className={tableNumericHeadCellClass}>Confidence</th>
                <th className={tableNumericHeadCellClass}>Amount</th>
                <th className={tableActionHeadCellClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviewItems.map((item) => {
                const client = Array.isArray(item.clients)
                  ? item.clients[0]
                  : item.clients;

                return (
                <tr key={item.id} className={tableRowClass}>
                  <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                    {client?.business_name ?? "Unknown client"}
                  </td>
                  <td className={tableCellClass}>
                    {item.party_name ?? "Not provided"}
                  </td>
                  <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                    {item.invoice_number ?? "Not provided"}
                  </td>
                  <td className={`${tableCellClass} capitalize`}>
                    {item.transaction_type}
                  </td>
                  <td className={tableCellClass}>
                    <StatusChip tone={statusTone(item.status)}>
                      {item.status.replaceAll("_", " ")}
                    </StatusChip>
                  </td>
                  <td className={tableNumericCellClass}>
                    {formatNullablePercent(item.confidence_score)}
                  </td>
                  <td className={tableNumericCellClass}>
                    {formatCurrency(item.total_amount)}
                  </td>
                  <td className={tableActionCellClass}>
                    <TextLink
                      href={`/dashboard/review-queue/${item.id}`}
                      aria-label={`Review ${item.invoice_number ?? item.party_name ?? "transaction"}`}
                    >
                      Review
                    </TextLink>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </DataTable>
          )}
        </SectionCard>
      </PageBody>
    </div>
  );
}
