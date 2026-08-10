import Link from "next/link";

import {
  GstSummaryForm,
  type GstClientOption,
} from "@/components/gst-summary-form";
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

export default async function GstSummaryPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            GST summaries need Supabase environment variables and migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name, filing_frequency")
    .eq("firm_id", firm!.id)
    .neq("status", "archived")
    .order("business_name");
  const { data: periods, error } = await supabase
    .from("gst_periods")
    .select(
      "id, period_start, period_end, filing_type, status, clients(business_name), gst_summaries(net_tax_payable, mismatch_count, missing_document_count, generated_at)",
    )
    .eq("firm_id", firm!.id)
    .order("period_start", { ascending: false })
    .limit(60);

  return (
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          GST Summary
        </p>
        <h1 className="mt-2 text-3xl font-semibold">GST readiness</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Generate CA-reviewed GST summaries from approved transactions. This
          prepares review and export data; it does not submit GST filings.
        </p>
      </div>

      <div className="mb-5">
        <GstSummaryForm clients={(clients ?? []) as GstClientOption[]} />
      </div>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Generated periods</p>
          <span className="font-mono text-xs text-khata-muted">
            {periods?.length ?? 0} records
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!periods || periods.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No GST summaries yet</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              Generate a period after client transactions have been approved in
              the review queue.
            </p>
          </div>
        )}

        {!error && periods && periods.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Filing</th>
                  <th className="px-4 py-3 font-medium">Readiness</th>
                  <th className="px-4 py-3 text-right font-medium">Issues</th>
                  <th className="px-4 py-3 text-right font-medium">Net tax</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
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
                  const issueCount =
                    Number(summary?.mismatch_count ?? 0) +
                    Number(summary?.missing_document_count ?? 0);

                  return (
                    <tr key={period.id} className="border-t border-khata-border">
                      <td className="px-4 py-3 font-medium">
                        {client?.business_name ?? "Unknown client"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {period.period_start} to {period.period_end}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {period.filing_type}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip tone={statusTone(period.status)}>
                          {period.status.replaceAll("_", " ")}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {issueCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(summary?.net_tax_payable ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/gst-summary/${period.id}`}
                          className="font-semibold text-khata-green"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
