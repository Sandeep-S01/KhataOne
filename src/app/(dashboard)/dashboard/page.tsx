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
  const activeClientsPromise = supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .neq("status", "archived");
  const gstReadyPromise = supabase
    .from("gst_periods")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .eq("status", "ready");
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
    activeClients,
    gstReady,
    exportsThisMonth,
    reviewItemsResult,
  ] = await Promise.all([
    pendingReviewPromise,
    activeClientsPromise,
    gstReadyPromise,
    exportsThisMonthPromise,
    reviewItemsPromise,
  ]);
  const { data: reviewItems, error: reviewItemsError } = reviewItemsResult;

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
          label="Client workspaces"
          value={activeClients.count ?? 0}
          tone="brand"
          hint="Active or onboarding clients in this firm."
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
          <DataTable minWidth={860}>
            <thead className={tableHeaderClass}>
              <tr>
                <th className={tableHeadCellClass}>Client</th>
                <th className={tableHeadCellClass}>Party</th>
                <th className={tableHeadCellClass}>Invoice</th>
                <th className={tableHeadCellClass}>Type</th>
                <th className={tableHeadCellClass}>Status</th>
                <th className={tableNumericHeadCellClass}>Confidence</th>
                <th className={tableNumericHeadCellClass}>Amount</th>
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
