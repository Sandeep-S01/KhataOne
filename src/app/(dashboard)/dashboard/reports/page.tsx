import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

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
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Reports need Supabase environment variables and migrations.
          </p>
        </section>
      </div>
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Reports need Supabase environment variables and migrations.
          </p>
        </section>
      </div>
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
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-khata-green">
            Reports
          </p>
          <h1 className="mt-2 text-3xl font-semibold">CA reports</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
            Review client GST readiness, unresolved work, and export activity
            before sharing files with clients.
          </p>
        </div>
        <Link
          href="/dashboard/exports"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-khata-green px-4 text-sm font-semibold text-white"
        >
          <FileText className="size-4" />
          Create export
        </Link>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          ["Approved transactions", approvedCount ?? 0],
          ["Draft/review items", reviewCount ?? 0],
          ["Completed exports", exportCount ?? 0],
        ].map(([label, value]) => (
          <section
            key={label}
            className="rounded-lg border border-khata-border bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase text-khata-muted">
              {label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">GST readiness report</p>
          <span className="font-mono text-xs text-khata-muted">
            {periods?.length ?? 0} periods
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!periods || periods.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No report data yet</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              Generate GST summaries after approving transactions to populate
              this report.
            </p>
          </div>
        )}

        {!error && periods && periods.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">GSTIN</th>
                  <th className="px-4 py-3 font-medium">Period</th>
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
                        {client?.gstin ?? "Pending"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {period.period_start} to {period.period_end}
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
                          className="inline-flex items-center justify-end gap-2 font-semibold text-khata-green"
                        >
                          Open
                          <ArrowRight className="size-4" />
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
