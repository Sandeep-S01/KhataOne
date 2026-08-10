import Link from "next/link";
import { notFound } from "next/navigation";

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
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 text-sm leading-6 text-khata-muted">
            GST period detail needs Supabase environment variables and
            migrations.
          </p>
        </section>
      </div>
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
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <Link
            href="/dashboard/gst-summary"
            className="text-sm font-semibold text-khata-green"
          >
            Back to GST summaries
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">GST period summary</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
            Review-ready GST summary generated from approved KhataOne
            transactions. Filing/submission remains outside this v1 workflow.
          </p>
        </div>
        <StatusChip tone={statusTone(period.status)}>
          {period.status.replaceAll("_", " ")}
        </StatusChip>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <p className="text-sm font-semibold">Period details</p>
          <dl className="mt-4 grid gap-4 text-sm">
            {[
              ["Client", client?.business_name ?? "Unknown client"],
              ["GSTIN", client?.gstin ?? "Pending"],
              ["Period", `${period.period_start} to ${period.period_end}`],
              ["Filing", period.filing_type],
              ["Generated", summary?.generated_at ? new Date(summary.generated_at).toLocaleString("en-IN") : "Pending"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[120px_1fr] gap-3 border-b border-khata-border pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="text-khata-muted">{label}</dt>
                <dd className={label === "GSTIN" ? "font-mono" : "font-medium"}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <p className="text-sm font-semibold">Tax summary</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Sales taxable", summary?.sales_taxable_amount],
              ["Purchase taxable", summary?.purchase_taxable_amount],
              ["Output CGST", summary?.output_cgst],
              ["Output SGST", summary?.output_sgst],
              ["Output IGST", summary?.output_igst],
              ["Input CGST", summary?.input_cgst],
              ["Input SGST", summary?.input_sgst],
              ["Input IGST", summary?.input_igst],
              ["Net payable", summary?.net_tax_payable],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-khata-border bg-khata-paper p-3"
              >
                <p className="text-xs font-semibold uppercase text-khata-muted">
                  {label}
                </p>
                <p className="mt-2 font-mono text-lg font-semibold">
                  {formatCurrency(Number(value ?? 0))}
                </p>
              </div>
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
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Source transactions</p>
        </div>
        {!sourceTransactions || sourceTransactions.length === 0 ? (
          <div className="p-5 text-sm text-khata-muted">
            No source transactions in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Party</th>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Taxable</th>
                  <th className="px-4 py-3 text-right font-medium">Tax</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {sourceTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-khata-border">
                    <td className="px-4 py-3 font-mono text-xs">
                      {transaction.transaction_date ?? "Pending"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {transaction.party_name ?? "Pending"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {transaction.invoice_number ?? "Pending"}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {transaction.transaction_type}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {transaction.status.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(transaction.taxable_amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(
                        Number(transaction.cgst_amount ?? 0) +
                          Number(transaction.sgst_amount ?? 0) +
                          Number(transaction.igst_amount ?? 0),
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(transaction.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Generation audit</p>
        </div>
        {!audits || audits.length === 0 ? (
          <div className="p-5 text-sm text-khata-muted">
            No GST summary audit entries yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} className="border-t border-khata-border">
                    <td className="px-4 py-3 font-medium">{audit.action}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {audit.actor_user_id ?? "system"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {new Date(audit.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
