import Link from "next/link";
import type { Route } from "next";
import { Download } from "lucide-react";

import {
  ExportForm,
  type ExportClientOption,
  type ExportPeriodOption,
} from "@/components/export-form";
import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "danger";
    case "processing":
    case "queued":
      return "warning";
    default:
      return "neutral";
  }
}

function exportLabel(type: string) {
  switch (type) {
    case "csv_transactions":
      return "Transactions CSV";
    case "gst_summary":
      return "GST summary CSV";
    case "pdf_summary":
      return "GST summary PDF";
    case "tally_ready":
      return "Tally-ready";
    default:
      return type.replaceAll("_", " ");
  }
}

export default async function ExportsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Exports need Supabase environment variables, migrations, and private
            storage buckets.
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
            Exports need Supabase environment variables, migrations, and private
            storage buckets.
          </p>
        </section>
      </div>
    );
  }

  const { firm, supabase } = context;
  const clientsPromise = (async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, business_name")
      .eq("firm_id", firm.id)
      .neq("status", "archived")
      .order("business_name");

    return (data ?? []) as ExportClientOption[];
  })().catch(() => [] as ExportClientOption[]);
  const periodsPromise = (async () => {
    const { data } = await supabase
      .from("gst_periods")
      .select("id, period_start, period_end, filing_type, status, clients(business_name)")
      .eq("firm_id", firm.id)
      .order("period_start", { ascending: false })
      .limit(80);

    return (data ?? []) as ExportPeriodOption[];
  })().catch(() => [] as ExportPeriodOption[]);
  const exportsPromise = (async () =>
    await supabase
      .from("exports")
      .select(
        "id, export_type, status, storage_path, completed_at, created_at, metadata, clients(business_name), gst_periods(period_start, period_end)",
      )
      .eq("firm_id", firm.id)
      .order("created_at", { ascending: false })
      .limit(80))();

  const [clients, periods, exportsResult] = await Promise.all([
    clientsPromise,
    periodsPromise,
    exportsPromise,
  ]);
  const { data: exports, error } = exportsResult;

  return (
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Exports
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Export jobs</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Generate traceable CSV and PDF files from approved transactions and
          GST summaries. Exports are stored privately and logged for audit.
        </p>
      </div>

      <div className="mb-5">
        <ExportForm
          clients={(clients ?? []) as ExportClientOption[]}
          periods={(periods ?? []) as ExportPeriodOption[]}
        />
      </div>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Export history</p>
          <span className="font-mono text-xs text-khata-muted">
            {exports?.length ?? 0} records
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!exports || exports.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No exports generated yet</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              Create a transactions CSV or GST summary export after clients,
              transactions, and GST periods exist.
            </p>
          </div>
        )}

        {!error && exports && exports.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Export</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">File</th>
                </tr>
              </thead>
              <tbody>
                {exports.map((exportRecord) => {
                  const client = Array.isArray(exportRecord.clients)
                    ? exportRecord.clients[0]
                    : exportRecord.clients;
                  const period = Array.isArray(exportRecord.gst_periods)
                    ? exportRecord.gst_periods[0]
                    : exportRecord.gst_periods;
                  const metadata = exportRecord.metadata as
                    | Record<string, string>
                    | null;
                  const periodText = period
                    ? `${period.period_start} to ${period.period_end}`
                    : metadata?.period_start && metadata?.period_end
                      ? `${metadata.period_start} to ${metadata.period_end}`
                      : "Not linked";

                  return (
                    <tr
                      key={exportRecord.id}
                      className="border-t border-khata-border"
                    >
                      <td className="px-4 py-3 font-medium">
                        {exportLabel(exportRecord.export_type)}
                      </td>
                      <td className="px-4 py-3">
                        {client?.business_name ?? "Not linked"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {periodText}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip tone={statusTone(exportRecord.status)}>
                          {exportRecord.status}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {new Date(exportRecord.created_at).toLocaleString(
                          "en-IN",
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {exportRecord.status === "completed" &&
                        exportRecord.storage_path ? (
                          <Link
                            href={
                              `/api/exports/${exportRecord.id}/download` as Route
                            }
                            className="inline-flex items-center justify-end gap-2 font-semibold text-khata-green"
                          >
                            <Download className="size-4" />
                            Download
                          </Link>
                        ) : (
                          <span className="text-khata-muted">Unavailable</span>
                        )}
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
