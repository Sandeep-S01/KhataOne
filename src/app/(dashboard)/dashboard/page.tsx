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
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

export const dynamic = "force-dynamic";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "Pending";
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

function attentionTone(count: number): "warning" | "success" {
  return count > 0 ? "warning" : "success";
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
    pendingReviewPromise,
    gstReadyPromise,
    gstBlockedPromise,
    intakeAttentionPromise,
    exportsAttentionPromise,
    exportsThisMonthPromise,
    reviewItemsPromise,
  ]);
  const { data: reviewItems, error: reviewItemsError } = reviewItemsResult;
  const priorityItems = [
    {
      label: "Review extracted transactions",
      count: pendingReview.count ?? 0,
      href: "/dashboard/review-queue",
      tone: attentionTone(pendingReview.count ?? 0),
      description: "Draft, needs-review, and duplicate-risk records waiting for CA decision.",
    },
    {
      label: "Triage WhatsApp intake",
      count: intakeAttention.count ?? 0,
      href: "/dashboard/inbox",
      tone: attentionTone(intakeAttention.count ?? 0),
      description: "Unmatched, received, failed, or media-failed inbound messages.",
    },
    {
      label: "Resolve GST blockers",
      count: gstBlocked.count ?? 0,
      href: "/dashboard/gst-summary",
      tone: attentionTone(gstBlocked.count ?? 0),
      description: "Periods blocked by missing documents, mismatches, or pending review.",
    },
    {
      label: "Check export jobs",
      count: exportsAttention.count ?? 0,
      href: "/dashboard/exports",
      tone: attentionTone(exportsAttention.count ?? 0),
      description: "Queued, processing, or failed private export jobs.",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="CA operations console"
        description={`Track intake, review work, ledger handoff, GST readiness, exports, and audit activity for ${firm.name ?? "this firm"}.`}
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Pending review"
            value={pendingReview.count ?? 0}
            tone={(pendingReview.count ?? 0) > 0 ? "warning" : "success"}
            hint="Draft, needs-review, and duplicate-risk transactions."
          />
          <StatTile
            label="Intake attention"
            value={intakeAttention.count ?? 0}
            tone={attentionTone(intakeAttention.count ?? 0)}
            hint="Unmatched or failed WhatsApp intake records."
          />
          <StatTile
            label="GST ready periods"
            value={gstReady.count ?? 0}
            tone="success"
            hint="Generated periods marked ready for review/export."
          />
          <StatTile
            label="Exports this month"
            value={exportsThisMonth.count ?? 0}
            tone="neutral"
            hint="Completed files created from approved records."
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
                      {item.count} open
                    </StatusChip>
                    <h2 className="text-sm font-semibold text-khata-ink">
                      {item.label}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-khata-muted">
                    {item.description}
                  </p>
                </div>
                <TextLink href={item.href}>Open queue</TextLink>
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
                    {item.party_name ?? "Pending"}
                  </td>
                  <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                    {item.invoice_number ?? "Pending"}
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
                    {Math.round((item.confidence_score ?? 0) * 100)}%
                  </td>
                  <td className={tableNumericCellClass}>
                    {formatCurrency(item.total_amount)}
                  </td>
                  <td className={tableActionCellClass}>
                    <TextLink href={`/dashboard/review-queue/${item.id}`}>
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
