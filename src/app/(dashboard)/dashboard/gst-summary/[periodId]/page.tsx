import { notFound } from "next/navigation";

import {
  ActionLink,
  DataTable,
  DetailList,
  EmptyState,
  InfoNote,
  PageBody,
  PageHeader,
  QueryError,
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
import {
  formatDisplayDate,
  formatDisplayDateRange,
  formatDisplayDateTime,
} from "@/lib/format";
import { formatNullableCurrency } from "@/lib/availability";

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
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;

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
  const { data: sourceTransactions, error: sourceTransactionsError } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, transaction_date, party_name, invoice_number, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_amount, status",
    )
    .eq("firm_id", firm.id)
    .eq("client_id", period.client_id)
    .gte("transaction_date", period.period_start)
    .lte("transaction_date", period.period_end)
    .order("transaction_date", { ascending: false });
  const currentBlockerCount = sourceTransactions?.filter(
    (transaction) => transaction.status !== "approved" && transaction.status !== "exported",
  ).length;
  const generationTime = formatDisplayDateTime(summary?.generated_at);

  const { data: audits, error: auditsError } = await supabase
    .from("audit_logs")
    .select("id, action, actor_user_id, created_at")
    .eq("firm_id", firm.id)
    .eq("entity_type", "gst_period")
    .eq("entity_id", period.id)
    .order("created_at", { ascending: false })
    .limit(8);

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
      <SectionCard
        title="Current period transactions"
        description="Live transactions currently in this client and date range. Their statuses explain blockers; this list is not a persisted generation snapshot."
        bodyClassName="p-0"
        actions={
          typeof currentBlockerCount === "number" ? (
            <StatusChip tone={currentBlockerCount > 0 ? "warning" : "success"}>
              {currentBlockerCount} current blockers
            </StatusChip>
          ) : undefined
        }
      >
        {sourceTransactionsError ? (
          <QueryError message="Source transactions could not be loaded. Refresh to retry." />
        ) : !sourceTransactions || sourceTransactions.length === 0 ? (
          <EmptyState
            title="No current transactions in this period"
            message="Live transactions in this client and date range will appear here."
          />
        ) : (
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
                {sourceTransactions.map((transaction) => (
                  <tr key={transaction.id} className={tableRowClass}>
                    <td className={`${tableCellClass} ${tableMonoTextClass}`}>
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
        )}
      </SectionCard>
      </div>

      <div className="min-w-0 xl:col-span-2">
      <SectionCard title="Generation audit" bodyClassName="p-0">
        {auditsError ? (
          <QueryError message="Generation audit could not be loaded. Refresh to retry." />
        ) : !audits || audits.length === 0 ? (
          <EmptyState
            title="No GST summary audit entries yet"
            message="Generation and export activity for this period will appear here."
          />
        ) : (
          <DataTable minWidth={640} ariaLabel="GST period audit entries">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Action</th>
                  <th className={tableHeadCellClass}>Actor</th>
                  <th className={tableNumericHeadCellClass}>Time</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} className={tableRowClass}>
                    <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>{audit.action}</td>
                    <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                      {audit.actor_user_id ?? "system"}
                    </td>
                    <td className={`${tableNumericCellClass} text-xs`}>
                      {formatDisplayDateTime(audit.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
      </SectionCard>
      </div>
      </PageBody>
    </div>
  );
}
