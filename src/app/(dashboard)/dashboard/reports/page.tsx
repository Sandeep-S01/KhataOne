import { ArrowRight, FileText } from "lucide-react";

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
import { formatDisplayDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function statusTone(status: string) {
  switch (status) {
    case "ready":
    case "exported":
      return "success";
    case "missing_documents":
    case "needs_review":
      return "warning";
    default:
      return "neutral";
  }
}

export default async function ReportsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing CA reports." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing CA reports." />
    );
  }

  const { firm, supabase } = context;
  const periodsPromise = (async () =>
    await supabase
      .from("gst_periods")
      .select(
        "id, period_start, period_end, filing_type, status, clients(business_name, gstin), gst_summaries(net_tax_payable, mismatch_count, missing_document_count, generated_at)",
      )
      .eq("firm_id", firm.id)
      .order("period_start", { ascending: false })
      .limit(50))();
  const approvedCountPromise = (async () => {
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .eq("status", "approved");

    return count;
  })().catch(() => null);
  const reviewCountPromise = (async () => {
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .in("status", ["draft", "needs_review"]);

    return count;
  })().catch(() => null);
  const exportCountPromise = (async () => {
    const { count } = await supabase
      .from("exports")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .eq("status", "completed");

    return count;
  })().catch(() => null);

  const [periodsResult, approvedCount, reviewCount, exportCount] =
    await Promise.all([
      periodsPromise,
      approvedCountPromise,
      reviewCountPromise,
      exportCountPromise,
    ]);
  const { data: periods, error } = periodsResult;

  return (
    <div>
      <PageHeader
        eyebrow="Reports"
        title="CA reports"
        description="Review GST readiness and unresolved work before sharing exports."
        actions={
        <ActionLink
          href="/dashboard/exports"
          variant="primary"
        >
          <FileText className="size-4" />
          Create export
        </ActionLink>
        }
      />

      <PageBody>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Approved transactions", approvedCount ?? 0, "success"],
          ["Draft/review items", reviewCount ?? 0, "warning"],
          ["Completed exports", exportCount ?? 0, "brand"],
        ].map(([label, value, tone]) => (
          <StatTile
            key={label}
            label={label as string}
            value={value as number}
            tone={tone as "success" | "warning" | "brand"}
          />
        ))}
      </div>

      <SectionCard
        title="GST readiness report"
        actions={
          <RecordCount
            value={periods?.length ?? 0}
            label="periods"
            singularLabel="period"
          />
        }
        bodyClassName="p-0"
      >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!periods || periods.length === 0) && (
          <EmptyState
            title="No report data yet"
            message="Generate GST summaries after approving transactions to populate this report."
          />
        )}

        {!error && periods && periods.length > 0 && (
          <DataTable minWidth={1040} ariaLabel="GST readiness report">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>GSTIN</th>
                  <th className={tableHeadCellClass}>Period</th>
                  <th className={tableHeadCellClass}>Readiness</th>
                  <th className={tableNumericHeadCellClass}>Mismatches</th>
                  <th className={tableNumericHeadCellClass}>Missing docs</th>
                  <th className={tableNumericHeadCellClass}>Net tax</th>
                  <th className={tableActionHeadCellClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => {
                  const client = Array.isArray(period.clients)
                    ? period.clients[0]
                    : period.clients;
                  const summary = Array.isArray(period.gst_summaries)
                    ? period.gst_summaries[0]
                    : period.gst_summaries;

                  return (
                    <tr key={period.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {client?.business_name ?? "Unknown client"}
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {client?.gstin ?? "Not provided"}
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {formatDisplayDateRange(
                          period.period_start,
                          period.period_end,
                        )}
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip tone={statusTone(period.status)}>
                          {period.status.replaceAll("_", " ")}
                        </StatusChip>
                      </td>
                      <td className={tableNumericCellClass}>
                        {summary?.mismatch_count ?? 0}
                      </td>
                      <td className={tableNumericCellClass}>
                        {summary?.missing_document_count ?? 0}
                      </td>
                      <td className={tableNumericCellClass}>
                        {formatCurrency(summary?.net_tax_payable ?? 0)}
                      </td>
                      <td className={tableActionCellClass}>
                        <TextLink
                          href={`/dashboard/gst-summary/${period.id}`}
                          aria-label={`Open GST period for ${client?.business_name ?? "unknown client"}`}
                        >
                          Open
                          <ArrowRight className="size-4" />
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
