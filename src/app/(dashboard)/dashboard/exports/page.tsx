import { Download } from "lucide-react";

import {
  ExportForm,
  type ExportClientOption,
  type ExportPeriodOption,
} from "@/components/export-form";
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
  tablePrimaryTextClass,
  tableSecondaryTextClass,
  tableRowClass,
} from "@/components/design-system";
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
      return "Tally-ready (reserved)";
    default:
      return type.replaceAll("_", " ");
  }
}

export default async function ExportsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables, migrations, and private storage buckets before generating exports." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return (
      <SetupRequired message="Connect Supabase environment variables, migrations, and private storage buckets before generating exports." />
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
    <div>
      <PageHeader
        eyebrow="Exports"
        title="Export jobs"
        description="Generate traceable CSV and PDF files from approved transactions and GST summaries. Exports are stored privately and logged for audit."
      />

      <PageBody>
        <ExportForm
          clients={(clients ?? []) as ExportClientOption[]}
          periods={(periods ?? []) as ExportPeriodOption[]}
        />

      <SectionCard
        title="Export history"
        actions={<RecordCount value={exports?.length ?? 0} />}
        bodyClassName="p-0"
      >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!exports || exports.length === 0) && (
          <EmptyState
            title="No exports generated yet"
            message="Create a transactions CSV or GST summary export after clients, transactions, and GST periods exist."
          />
        )}

        {!error && exports && exports.length > 0 && (
          <DataTable minWidth={980} ariaLabel="Export history">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Export</th>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Period</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableHeadCellClass}>Created</th>
                  <th className={tableActionHeadCellClass}>File</th>
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
                      className={tableRowClass}
                    >
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {exportLabel(exportRecord.export_type)}
                      </td>
                      <td className={tableCellClass}>
                        {client?.business_name ?? "Not linked"}
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {periodText}
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip tone={statusTone(exportRecord.status)}>
                          {exportRecord.status}
                        </StatusChip>
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {new Date(exportRecord.created_at).toLocaleString(
                          "en-IN",
                        )}
                      </td>
                      <td className={tableActionCellClass}>
                        {exportRecord.status === "completed" &&
                        exportRecord.storage_path ? (
                          <TextLink
                            href={`/api/exports/${exportRecord.id}/download`}
                          >
                            <Download className="size-4" />
                            Download
                          </TextLink>
                        ) : (
                          <span className={tableSecondaryTextClass}>Unavailable</span>
                        )}
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
