import {
  GstSummaryForm,
  type GstClientOption,
} from "@/components/gst-summary-form";
import {
  DataTable,
  EmptyState,
  PageBody,
  PageHeader,
  QueryError,
  RecordCount,
  SectionCard,
  SetupRequired,
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

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default async function GstSummaryPage() {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before generating GST readiness summaries." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const clientsQuery = supabase
    .from("clients")
    .select("id, business_name, filing_frequency")
    .eq("firm_id", firm.id)
    .neq("status", "archived")
    .order("business_name");
  const periodsQuery = supabase
    .from("gst_periods")
    .select(
      "id, period_start, period_end, filing_type, status, clients(business_name), gst_summaries(net_tax_payable, mismatch_count, missing_document_count, generated_at)",
    )
    .eq("firm_id", firm.id)
    .order("period_start", { ascending: false })
    .limit(60);

  const [{ data: clients }, { data: periods, error }] = await Promise.all([
    clientsQuery,
    periodsQuery,
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="GST Summary"
        title="GST readiness"
        description="Prepare GST summaries for a custom date range from approved transactions; it does not submit GST filings."
      />

      <PageBody>
        <GstSummaryForm clients={(clients ?? []) as GstClientOption[]} />

      <SectionCard
        title="Generated periods"
        actions={<RecordCount value={periods?.length ?? 0} />}
        bodyClassName="p-0"
      >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!periods || periods.length === 0) && (
          <EmptyState
            title="No GST summaries yet"
            message="Generate a period after client transactions have been approved in the review queue."
          />
        )}

        {!error && periods && periods.length > 0 && (
          <DataTable minWidth={980} ariaLabel="GST readiness periods">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Period</th>
                  <th className={tableHeadCellClass}>Filing</th>
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
                        {formatDisplayDateRange(
                          period.period_start,
                          period.period_end,
                        )}
                      </td>
                      <td className={`${tableCellClass} capitalize`}>
                        {period.filing_type}
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
