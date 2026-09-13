import { ArrowRight, FileText } from "lucide-react";

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
  countHint,
  countOrUnavailable,
  displayCount,
  formatNullableCurrency,
} from "@/lib/availability";
import { normalizePage } from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { formatDisplayDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";
const pageSize = 50;

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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
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
  const filters = await searchParams;
  const page = normalizePage(filters.page);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize;
  const periodsPromise = (async () =>
    await supabase
      .from("gst_periods")
      .select(
        "id, period_start, period_end, filing_type, status, clients(business_name, gstin), gst_summaries(net_tax_payable, mismatch_count, missing_document_count, generated_at)",
      )
      .eq("firm_id", firm.id)
      .order("period_start", { ascending: false })
      .order("id", { ascending: false })
      .range(rangeFrom, rangeTo))();
  const approvedCountPromise = supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .eq("status", "approved");
  const reviewCountPromise = supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .in("status", ["draft", "needs_review"]);
  const exportCountPromise = supabase
      .from("exports")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .eq("status", "completed");

  const [periodsResult, approvedCountResult, reviewCountResult, exportCountResult] =
    await Promise.all([
      periodsPromise,
      approvedCountPromise,
      reviewCountPromise,
      exportCountPromise,
    ]);
  const { data: periods, error } = periodsResult;
  const approvedCount = countOrUnavailable(approvedCountResult);
  const reviewCount = countOrUnavailable(reviewCountResult);
  const exportCount = countOrUnavailable(exportCountResult);
  const hasUnavailableReportCount = [
    approvedCount,
    reviewCount,
    exportCount,
  ].some((value) => value === null);
  const pagePeriods = (periods ?? []).slice(0, pageSize);
  const hasNextPage = (periods?.length ?? 0) > pageSize;

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
      {hasUnavailableReportCount && (
        <QueryError message="One or more report counts could not be loaded. Refresh to retry." />
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {[
          [
            "Approved transactions",
            approvedCount,
            approvedCount === null ? "danger" : approvedCount > 0 ? "success" : "neutral",
            "Approved transaction count.",
          ],
          [
            "Draft/review items",
            reviewCount,
            reviewCount === null ? "danger" : reviewCount > 0 ? "warning" : "neutral",
            "Draft and needs-review transaction count.",
          ],
          [
            "Completed exports",
            exportCount,
            exportCount === null ? "danger" : exportCount > 0 ? "brand" : "neutral",
            "Completed private export count.",
          ],
        ].map(([label, value, tone, hint]) => (
          <StatTile
            key={label}
            label={label as string}
            value={displayCount(value as number | null)}
            tone={tone as "success" | "warning" | "brand" | "neutral" | "danger"}
            hint={countHint(value as number | null, hint as string)}
          />
        ))}
      </div>

      <SectionCard
        title="GST readiness report"
        description="Newest matching periods are shown first. Use pagination to reach older GST readiness rows."
        actions={
          <RecordCount
            value={pagePeriods.length}
            label="periods"
            singularLabel="period"
          />
        }
        bodyClassName="p-0"
      >

        {error && (
          <QueryError message="GST readiness report could not be loaded. Refresh to retry." />
        )}

        {!error && (!periods || periods.length === 0) && (
          <EmptyState
            title="No report data yet"
            message="Generate GST summaries after approving transactions to populate this report."
          />
        )}

        {!error && periods && periods.length > 0 && (
          <>
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
                {pagePeriods.map((period) => {
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
                        {summary?.mismatch_count ?? "Unavailable"}
                      </td>
                      <td className={tableNumericCellClass}>
                        {summary?.missing_document_count ?? "Unavailable"}
                      </td>
                      <td className={tableNumericCellClass}>
                        {formatNullableCurrency(summary?.net_tax_payable)}
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
          <PaginationControls
            basePath="/dashboard/reports"
            page={page}
            hasNext={hasNextPage}
            searchParams={filters}
            label="report periods"
          />
          </>
        )}
      </SectionCard>
      </PageBody>
    </div>
  );
}
