import { notFound } from "next/navigation";

import {
  ActionLink,
  DataTable,
  DetailList,
  EmptyState,
  PageBody,
  PageHeader,
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
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

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

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: period } = await supabase
    .from("gst_periods")
    .select(
      "*, clients(business_name, gstin, filing_frequency), gst_summaries(*)",
    )
    .eq("id", periodId)
    .eq("firm_id", firm!.id)
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
  const { data: sourceTransactions } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, transaction_date, party_name, invoice_number, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_amount, status",
    )
    .eq("firm_id", firm!.id)
    .eq("client_id", period.client_id)
    .gte("transaction_date", period.period_start)
    .lte("transaction_date", period.period_end)
    .order("transaction_date", { ascending: false });
  const { data: audits } = await supabase
    .from("audit_logs")
    .select("id, action, actor_user_id, created_at")
    .eq("firm_id", firm!.id)
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

      <PageBody className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Period details">
          <DetailList
            items={[
              { label: "Client", value: client?.business_name ?? "Unknown client" },
              { label: "GSTIN", value: client?.gstin ?? "Pending", mono: true },
              { label: "Period", value: `${period.period_start} to ${period.period_end}`, mono: true },
              { label: "Filing", value: period.filing_type },
              { label: "Generated", value: summary?.generated_at ? new Date(summary.generated_at).toLocaleString("en-IN") : "Pending", mono: true },
            ]}
          />
        </SectionCard>

        <SectionCard title="Tax summary">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                value={formatCurrency(Number(value ?? 0))}
                tone={tone as "neutral" | "brand" | "success" | "warning"}
                className="bg-khata-paper"
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusChip tone={Number(summary?.mismatch_count ?? 0) > 0 ? "warning" : "success"}>
              {summary?.mismatch_count ?? 0} mismatches
            </StatusChip>
            <StatusChip tone={Number(summary?.missing_document_count ?? 0) > 0 ? "warning" : "success"}>
              {summary?.missing_document_count ?? 0} missing docs
            </StatusChip>
          </div>
        </SectionCard>

      <div className="xl:col-span-2">
      <SectionCard title="Source transactions" bodyClassName="p-0">
        {!sourceTransactions || sourceTransactions.length === 0 ? (
          <EmptyState
            title="No source transactions in this period"
            message="Approved transactions within the period range will appear here."
          />
        ) : (
          <DataTable minWidth={980}>
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
                      {transaction.transaction_date ?? "Pending"}
                    </td>
                    <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                      {transaction.party_name ?? "Pending"}
                    </td>
                    <td className={`${tableCellClass} num`}>
                      {transaction.invoice_number ?? "Pending"}
                    </td>
                    <td className={`${tableCellClass} capitalize`}>
                      {transaction.transaction_type}
                    </td>
                    <td className={`${tableCellClass} capitalize`}>
                      {transaction.status.replaceAll("_", " ")}
                    </td>
                    <td className={tableNumericCellClass}>
                      {formatCurrency(transaction.taxable_amount)}
                    </td>
                    <td className={tableNumericCellClass}>
                      {formatCurrency(
                        Number(transaction.cgst_amount ?? 0) +
                          Number(transaction.sgst_amount ?? 0) +
                          Number(transaction.igst_amount ?? 0),
                      )}
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

      <div className="xl:col-span-2">
      <SectionCard title="Generation audit" bodyClassName="p-0">
        {!audits || audits.length === 0 ? (
          <EmptyState
            title="No GST summary audit entries yet"
            message="Generation and export activity for this period will appear here."
          />
        ) : (
          <DataTable minWidth={640}>
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
                      {new Date(audit.created_at).toLocaleString("en-IN")}
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
