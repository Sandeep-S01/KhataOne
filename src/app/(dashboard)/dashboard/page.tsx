import { Suspense } from "react";
import {
  ActionLink,
  DataTable,
  EmptyState,
  PageBody,
  PageHeader,
  PaginationControls,
  QueryError,
  RecordCount,
  SectionCard,
  SetupRequired,
  StatTile,
  TableToolbar,
  TableSkeleton,
  TextLink,
  tableActionCellClass,
  tableActionHeadCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableNumericTextClass,
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
import { dashboardPageSize, normalizePage } from "@/lib/dashboard-query";
import { getFirmContext, type FirmContext } from "@/lib/firms";
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

function openCountLabel(value: number | null) {
  return value === null ? "Unavailable" : `${value} Open`;
}

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<{ review_page?: string }>;
}) {
  const filters = await searchParams;
  const reviewPage = normalizePage(filters.review_page);
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables before opening the protected CA operations workspace." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const counts = getOverviewCounts(context);
  const reviewItems = getReviewSnapshot(context, reviewPage);

  return (
    <div>
      <PageHeader
        title="CA operations console"
        description={`Prioritize intake, review, GST, and export work for ${context.firm.name ?? "this firm"}.`}
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
        <Suspense fallback={<OverviewSummarySkeleton />}>
          <OverviewSummary counts={counts} />
        </Suspense>
        <Suspense fallback={
          <SectionCard title="Review queue snapshot" bodyClassName="p-0">
            <TableSkeleton rows={dashboardPageSize} cols={8} />
          </SectionCard>
        }>
          <ReviewSnapshot result={reviewItems} page={reviewPage} searchParams={filters} />
        </Suspense>
      </PageBody>
    </div>
  );
}

function getOverviewCounts(context: FirmContext) {
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
  return Promise.all([
    withServerTiming("dashboard.pending_review_count", () => pendingReviewPromise),
    withServerTiming("dashboard.gst_ready_count", () => gstReadyPromise),
    withServerTiming("dashboard.gst_blocked_count", () => gstBlockedPromise),
    withServerTiming("dashboard.intake_count", () => intakeAttentionPromise),
    withServerTiming("dashboard.exports_attention_count", () => exportsAttentionPromise),
    withServerTiming("dashboard.exports_month_count", () => exportsThisMonthPromise),
  ].map((query) => query.catch(() => ({
    count: null,
    error: { message: "Count unavailable" },
  }))));
}

function getReviewSnapshot(context: FirmContext, page: number) {
  const { firm, supabase } = context;
  const rangeFrom = (page - 1) * dashboardPageSize;
  const reviewItemsPromise = supabase
    .from("transactions")
    .select(
      "id, transaction_type, status, party_name, invoice_number, total_amount, confidence_score, created_at, clients(business_name)",
    )
    .eq("firm_id", firm.id)
    .in("status", ["draft", "needs_review", "duplicate"])
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(rangeFrom, rangeFrom + dashboardPageSize);

  return withServerTiming("dashboard.review_snapshot", () => reviewItemsPromise);
}

async function OverviewSummary({ counts }: { counts: ReturnType<typeof getOverviewCounts> }) {
  const [
    pendingReview, gstReady, gstBlocked, intakeAttention, exportsAttention, exportsThisMonth,
  ] = await counts;
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
    <>
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
          tags={[
            { label: openCountLabel(pendingReviewCount), tone: attentionToneForCount(pendingReviewCount) },
            { label: "CA decision", tone: "neutral" },
          ]}
          href="/dashboard/review-queue"
          actionLabel="View review queue"
        />
        <StatTile
          label="Intake attention"
          value={displayCount(intakeAttentionCount)}
          tone={attentionToneForCount(intakeAttentionCount)}
          hint={countHint(
            intakeAttentionCount,
            "Received, unmatched, failed, or media-failed WhatsApp intake records.",
          )}
          tags={[
            { label: openCountLabel(intakeAttentionCount), tone: attentionToneForCount(intakeAttentionCount) },
            { label: "WhatsApp intake", tone: "brand" },
          ]}
          href="/dashboard/inbox"
          actionLabel="Open intake queue"
        />
        <StatTile
          label="GST ready periods"
          value={displayCount(gstReadyCount)}
          tone={positiveToneForCount(gstReadyCount)}
          hint={countHint(
            gstReadyCount,
            "Generated periods marked ready for review/export.",
          )}
          tags={[
            { label: openCountLabel(gstBlockedCount), tone: attentionToneForCount(gstBlockedCount) },
            { label: "GST prep only", tone: "info" },
          ]}
          href="/dashboard/gst-summary"
          actionLabel="Go to GST summary"
        />
        <StatTile
          label="Exports this month"
          value={displayCount(exportsThisMonthCount)}
          tone={positiveToneForCount(exportsThisMonthCount)}
          hint={countHint(
            exportsThisMonthCount,
            "Completed files created this month from approved records.",
          )}
          tags={[
            { label: openCountLabel(exportsAttentionCount), tone: attentionToneForCount(exportsAttentionCount) },
            { label: "CSV/PDF ready", tone: "neutral" },
          ]}
          href="/dashboard/exports"
          actionLabel="View exports"
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
              className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
            >
              <StatusChip tone={item.tone}>
                {openCountLabel(item.count)}
              </StatusChip>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-khata-ink">
                  {item.label}
                </h2>
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
    </>
  );
}

async function ReviewSnapshot({ result, page, searchParams }: {
  result: ReturnType<typeof getReviewSnapshot>;
  page: number;
  searchParams: { review_page?: string };
}) {
  const { data: reviewItems, error: reviewItemsError } = await result;
  const pageItems = reviewItems?.slice(0, dashboardPageSize);
  return (
    <SectionCard bodyClassName="p-0">
      <TableToolbar
        title="Review queue snapshot"
        description="Newest AI-created records waiting for a CA decision."
        meta={
          <RecordCount value={pageItems?.length ?? 0} label="shown" />
        }
      />
      {reviewItemsError && (
        <QueryError message={reviewItemsError.message} />
      )}

      {!reviewItemsError && (!pageItems || pageItems.length === 0) && (
        <>
        <EmptyState
          title={page > 1 ? "No review items on this page" : "No review items pending"}
          message={page > 1 ? "Go back to an earlier page." : "New WhatsApp documents and draft extractions will appear here when they need a reviewer decision."}
          action={
            <ActionLink href="/dashboard/inbox">
              Open inbox
            </ActionLink>
          }
        />
        {page > 1 && <PaginationControls basePath="/dashboard" pageKey="review_page" page={page} hasNext={false} searchParams={searchParams} label="review records" />}
        </>
      )}

      {!reviewItemsError && pageItems && pageItems.length > 0 && (
      <>
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
          {pageItems.map((item) => {
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
              <td className={`${tableCellClass} ${tableNumericTextClass}`}>
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
      <PaginationControls basePath="/dashboard" pageKey="review_page" page={page} hasNext={(reviewItems?.length ?? 0) > dashboardPageSize} searchParams={searchParams} label="review records" />
      </>
      )}
    </SectionCard>
  );
}

function OverviewSummarySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading overview counts">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending review", href: "/dashboard/review-queue", action: "View review queue" },
          { label: "Intake attention", href: "/dashboard/inbox", action: "Open intake queue" },
          { label: "GST ready periods", href: "/dashboard/gst-summary", action: "Go to GST summary" },
          { label: "Exports this month", href: "/dashboard/exports", action: "View exports" },
        ].map(({ label, href, action }) => (
          <StatTile
            key={label}
            label={label}
            value={<span className="inline-block h-8 w-16 rounded bg-khata-paperMuted" aria-hidden="true" />}
            hint="Fetching latest count."
            tags={[{ label: "Loading…" }]}
            href={href}
            actionLabel={action}
          />
        ))}
      </div>
      <SectionCard
        title="Priority worklist"
        description="Start with the queues that can block ledger handoff, GST readiness, or private exports."
        bodyClassName="p-0"
      >
        <TableSkeleton rows={6} cols={3} />
      </SectionCard>
    </div>
  );
}
