import { DeferredSection } from "@/components/deferred-section";
import { notFound } from "next/navigation";

import {
  ActionLink,
  DataTable,
  DetailList,
  EmptyState,
  InfoNote,
  PageBody,
  PageHeader,
  PaginationControls,
  QueryError,
  SectionCard,
  SetupRequired,
  StatTile,
  TableToolbar,
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
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import {
  formatDisplayDate,
  formatDisplayDateRange,
  formatDisplayDateTime,
} from "@/lib/format";
import { formatNullableCurrency } from "@/lib/availability";
import { dashboardPageSize, normalizePage } from "@/lib/dashboard-query";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "ready":
    case "approved":
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
  return formatNullableCurrency(value);
}

function formatTaxTotal(transaction: {
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
}) {
  const values = [
    transaction.cgst_amount,
    transaction.sgst_amount,
    transaction.igst_amount,
  ];

  if (values.every((value) => value === null || value === undefined)) {
    return "Unavailable";
  }

  return formatNullableCurrency(
    Number(transaction.cgst_amount ?? 0) +
      Number(transaction.sgst_amount ?? 0) +
      Number(transaction.igst_amount ?? 0),
  );
}

export default async function GstPeriodPage({
  params,
  searchParams,
}: {
  params: Promise<{ periodId: string }>;
  searchParams: Promise<{ source_page?: string; audit_page?: string }>;
}) {
  const { periodId } = await params;
  const filters = await searchParams;
  const sourcePage = normalizePage(filters.source_page);
  const auditPage = normalizePage(filters.audit_page);
  const sourceFrom = (sourcePage - 1) * dashboardPageSize;
  const auditFrom = (auditPage - 1) * dashboardPageSize;
  const basePath = `/dashboard/gst-summary/${periodId}`;

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing GST period details." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const { data: period } = await supabase
    .from("gst_periods")
    .select(
      "*, clients(business_name, gstin, filing_frequency), gst_summaries(*)",
    )
    .eq("id", periodId)
    .eq("firm_id", firm.id)
    .single();

  if (!period) {
    notFound();
  }

  const client = Array.isArray(period.clients)
    ? period.clients[0]
    : period.clients;
  const summary = Array.isArray(period.gst_summaries)
    ? period.gst_summaries[0]
    : period.gst_summaries;
  const sourceTransactionsQuery = supabase
    .from("transactions")
    .select(
      "id, transaction_type, transaction_date, party_name, invoice_number, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_amount, status",
    )
    .eq("firm_id", firm.id)
    .eq("client_id", period.client_id)
    .gte("transaction_date", period.period_start)
    .lte("transaction_date", period.period_end)
    .order("transaction_date", { ascending: false })
    .order("id", { ascending: false })
    .range(sourceFrom, sourceFrom + dashboardPageSize);
  const generationTime = formatDisplayDateTime(summary?.generated_at);

  const auditsQuery = supabase
    .from("audit_logs")
    .select("id, action, actor_user_id, created_at")
    .eq("firm_id", firm.id)
    .eq("entity_type", "gst_period")
    .eq("entity_id", period.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(auditFrom, auditFrom + dashboardPageSize);

  return (
    <div>
      <PageHeader
        eyebrow="GST Summary"
        title="GST period summary"
        description="Review-ready GST summary generated from approved KhataOne transactions. Filing/submission remains outside this v1 workflow."
        meta={
          <StatusChip tone={statusTone(period.status)}>
            {period.status.replaceAll("_", " ")}
          </StatusChip>
        }
        actions={
          <ActionLink href="/dashboard/gst-summary">
            Back to GST summaries
          </ActionLink>
        }
      />

      <PageBody className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <SectionCard title="Period details" className="min-w-0">
          <DetailList
            items={[
              { label: "Client", value: client?.business_name ?? "Unknown client" },
              { label: "GSTIN", value: client?.gstin ?? "Not provided", mono: true },
              {
                label: "Period",
                value: formatDisplayDateRange(period.period_start, period.period_end),
                mono: true,
              },
              { label: "Filing", value: period.filing_type },
              {
                label: "Generated",
                value: formatDisplayDateTime(summary?.generated_at),
                mono: true,
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          className="min-w-0"
          title="Saved GST summary"
          description="These totals are the saved generated summary, not a live recalculation of the rows below."
        >
          <InfoNote>
            Generated {generationTime}. The current-period transaction list below is live and may include later edits or unresolved records.
          </InfoNote>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Sales taxable", summary?.sales_taxable_amount, "neutral"],
              ["Purchase taxable", summary?.purchase_taxable_amount, "neutral"],
              ["Output CGST", summary?.output_cgst, "brand"],
              ["Output SGST", summary?.output_sgst, "brand"],
              ["Output IGST", summary?.output_igst, "brand"],
              ["Input CGST", summary?.input_cgst, "success"],
              ["Input SGST", summary?.input_sgst, "success"],
              ["Input IGST", summary?.input_igst, "success"],
              ["Net payable", summary?.net_tax_payable, "warning"],
            ].map(([label, value, tone]) => (
              <StatTile
                key={label}
                label={label as string}
                value={formatNullableCurrency(value as number | null | undefined)}
                tone={tone as "neutral" | "brand" | "success" | "warning"}
                className="bg-khata-paper"
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {summary ? (
              <>
                <StatusChip
                  tone={
                    summary.mismatch_count === null ||
                    summary.mismatch_count === undefined
                      ? "neutral"
                      : Number(summary.mismatch_count) > 0
                        ? "warning"
                        : "success"
                  }
                >
                  {summary.mismatch_count ?? "Unavailable"} mismatches
                </StatusChip>
                <StatusChip
                  tone={
                    summary.missing_document_count === null ||
                    summary.missing_document_count === undefined
                      ? "neutral"
                      : Number(summary.missing_document_count) > 0
                        ? "warning"
                        : "success"
                  }
                >
                  {summary.missing_document_count ?? "Unavailable"} missing docs
                </StatusChip>
              </>
            ) : (
              <StatusChip tone="neutral">Summary unavailable</StatusChip>
            )}
          </div>
        </SectionCard>

      <div className="min-w-0 xl:col-span-2">
      <DeferredSection title="Current period transactions" load={() => sourceTransactionsQuery} errorMessage="Source transactions could not be loaded. Refresh to retry.">
          {({ data: sourceTransactions, error: sourceTransactionsError }) => {
            const pageTransactions = sourceTransactions?.slice(0, dashboardPageSize);
            const currentBlockerCount = pageTransactions?.filter(
              (transaction) => transaction.status !== "approved" && transaction.status !== "exported",
            ).length;
            return (
              <SectionCard bodyClassName="p-0">
                <TableToolbar
                  title="Current period transactions"
                  description="Live transactions currently in this client and date range. Their statuses explain blockers; this list is not a persisted generation snapshot."
                  actions={
                    typeof currentBlockerCount === "number" ? (
                      <StatusChip tone={currentBlockerCount > 0 ? "warning" : "success"}>
                        {currentBlockerCount} blockers on this page
                      </StatusChip>
                    ) : undefined
                  }
                />
                {sourceTransactionsError ? (
                  <QueryError message="Source transactions could not be loaded. Refresh to retry." />
                ) : !pageTransactions || pageTransactions.length === 0 ? (
                  <>
                  <EmptyState
                    title={sourcePage > 1 ? "No transactions on this page" : "No current transactions in this period"}
                    message={sourcePage > 1 ? "Go back to an earlier page." : "Live transactions in this client and date range will appear here."}
                  />
                  {sourcePage > 1 && <PaginationControls basePath={basePath} pageKey="source_page" page={sourcePage} hasNext={false} searchParams={filters} label="transactions" />}
                  </>
                ) : (
                  <>
                  <DataTable minWidth={980} ariaLabel="GST period source transactions">
                      <thead className={tableHeaderClass}>
                        <tr>
                          <th className={tableHeadCellClass}>Date</th>
                          <th className={tableHeadCellClass}>Party</th>
                          <th className={tableHeadCellClass}>Invoice</th>
                          <th className={tableHeadCellClass}>Type</th>
                          <th className={tableHeadCellClass}>Status</th>
                          <th className={tableNumericHeadCellClass}>Taxable</th>
                          <th className={tableNumericHeadCellClass}>Tax</th>
                          <th className={tableNumericHeadCellClass}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageTransactions.map((transaction) => (
                          <tr key={transaction.id} className={tableRowClass}>
                            <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                              {formatDisplayDate(transaction.transaction_date)}
                            </td>
                            <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                              {transaction.party_name ?? "Not provided"}
                            </td>
                            <td className={`${tableCellClass} num`}>
                              {transaction.invoice_number ?? "Not provided"}
                            </td>
                            <td className={`${tableCellClass} capitalize`}>
                              {transaction.transaction_type}
                            </td>
                            <td className={tableCellClass}>
                              <StatusChip tone={statusTone(transaction.status)}>
                                {transaction.status.replaceAll("_", " ")}
                              </StatusChip>
                            </td>
                            <td className={tableNumericCellClass}>
                              {formatCurrency(transaction.taxable_amount)}
                            </td>
                            <td className={tableNumericCellClass}>
                              {formatTaxTotal(transaction)}
                            </td>
                            <td className={tableNumericCellClass}>
                              {formatCurrency(transaction.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </DataTable>
                  <PaginationControls
                    basePath={basePath}
                    pageKey="source_page"
                    page={sourcePage}
                    hasNext={sourceTransactions.length > dashboardPageSize}
                    searchParams={filters}
                    label="transactions"
                  />
                  </>
                )}
              </SectionCard>
            );
          }}
        </DeferredSection>
      </div>

      <div className="min-w-0 xl:col-span-2">
      <DeferredSection title="Generation audit" load={() => auditsQuery} errorMessage="Generation audit could not be loaded. Refresh to retry.">
          {({ data: audits, error: auditsError }) => {
            const pageAudits = audits?.slice(0, dashboardPageSize);
            return (
              <SectionCard bodyClassName="p-0">
                <TableToolbar title="Generation audit" />
                {auditsError ? (
                  <QueryError message="Generation audit could not be loaded. Refresh to retry." />
                ) : !pageAudits || pageAudits.length === 0 ? (
                  <>
                  <EmptyState
                    title={auditPage > 1 ? "No audit entries on this page" : "No GST summary audit entries yet"}
                    message={auditPage > 1 ? "Go back to an earlier page." : "Generation and export activity for this period will appear here."}
                  />
                  {auditPage > 1 && <PaginationControls basePath={basePath} pageKey="audit_page" page={auditPage} hasNext={false} searchParams={filters} label="audit entries" />}
                  </>
                ) : (
                  <>
                  <DataTable minWidth={640} ariaLabel="GST period audit entries">
                      <thead className={tableHeaderClass}>
                        <tr>
                          <th className={tableHeadCellClass}>Action</th>
                          <th className={tableHeadCellClass}>Actor</th>
                          <th className={tableNumericHeadCellClass}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageAudits.map((audit) => (
                          <tr key={audit.id} className={tableRowClass}>
                            <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>{audit.action}</td>
                            <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                              {audit.actor_user_id ?? "system"}
                            </td>
                            <td className={`${tableNumericCellClass} text-xs`}>
                              {formatDisplayDateTime(audit.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </DataTable>
                  <PaginationControls
                    basePath={basePath}
                    pageKey="audit_page"
                    page={auditPage}
                    hasNext={audits.length > dashboardPageSize}
                    searchParams={filters}
                    label="audit entries"
                  />
                  </>
                )}
              </SectionCard>
            );
          }}
        </DeferredSection>
      </div>
      </PageBody>
    </div>
  );
}
