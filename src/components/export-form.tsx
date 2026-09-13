"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useActionState, useState } from "react";

import {
  createExportAction,
  type ExportActionState,
} from "@/app/actions/exports";
import {
  Button,
  FieldError,
  FieldLabel,
  FilterBar,
  FormMessage,
  InfoNote,
  Input,
  Select,
} from "@/components/design-system";
import { currentMonthDateRange, formatDisplayDateRange } from "@/lib/format";

export type ExportClientOption = {
  id: string;
  business_name: string;
};

type ExportType = "csv_transactions" | "gst_summary" | "pdf_summary";

export type ExportPeriodOption = {
  id: string;
  period_start: string;
  period_end: string;
  filing_type: string;
  status: string;
  clients:
    | {
        business_name: string | null;
      }
    | Array<{
        business_name: string | null;
      }>
    | null;
};

const initialState: ExportActionState = {
  status: "idle",
  message: "",
};

function clientName(period: ExportPeriodOption) {
  const client = Array.isArray(period.clients)
    ? period.clients[0]
    : period.clients;

  return client?.business_name ?? "Unknown client";
}

export function ExportForm({
  clients,
  periods,
}: {
  clients: ExportClientOption[];
  periods: ExportPeriodOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createExportAction,
    initialState,
  );
  const [exportType, setExportType] = useState<ExportType>("csv_transactions");
  const isTransactionExport = exportType === "csv_transactions";
  const defaultPeriod = currentMonthDateRange();
  const errorId = (name: string) =>
    state.fieldErrors?.[name] ? `export-${name.replaceAll("_", "-")}-error` : undefined;

  return (
    <FilterBar
      action={formAction}
    >
      <div
        className={
          isTransactionExport
            ? "grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto]"
            : "grid gap-3 lg:grid-cols-[1fr_2fr_auto]"
        }
      >
        <label className="block">
          <FieldLabel>
            Type
          </FieldLabel>
          <Select
            name="export_type"
            className="mt-1"
            value={exportType}
            onChange={(event) => setExportType(event.target.value as ExportType)}
            aria-invalid={Boolean(state.fieldErrors?.export_type)}
            aria-describedby={errorId("export_type")}
          >
            <option value="csv_transactions">Transactions CSV</option>
            <option value="gst_summary">GST summary CSV</option>
            <option value="pdf_summary">GST summary PDF</option>
          </Select>
          <FieldError id={errorId("export_type")} message={state.fieldErrors?.export_type} />
        </label>

        {isTransactionExport ? (
          <>
            <label className="block">
              <FieldLabel>Client</FieldLabel>
              <Select
                name="client_id"
                className="mt-1"
                defaultValue=""
                aria-invalid={Boolean(state.fieldErrors?.client_id)}
                aria-describedby={errorId("client_id")}
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.business_name}
                  </option>
                ))}
              </Select>
              <FieldError id={errorId("client_id")} message={state.fieldErrors?.client_id} />
            </label>

            <label className="block">
              <FieldLabel>Period start</FieldLabel>
              <Input
                name="period_start"
                type="date"
                defaultValue={defaultPeriod.start}
                className="mt-1"
                aria-invalid={Boolean(state.fieldErrors?.period_start)}
                aria-describedby={errorId("period_start")}
              />
              <FieldError id={errorId("period_start")} message={state.fieldErrors?.period_start} />
            </label>

            <label className="block">
              <FieldLabel>Period end</FieldLabel>
              <Input
                name="period_end"
                type="date"
                defaultValue={defaultPeriod.end}
                className="mt-1"
                aria-invalid={Boolean(state.fieldErrors?.period_end)}
                aria-describedby={errorId("period_end")}
              />
              <FieldError id={errorId("period_end")} message={state.fieldErrors?.period_end} />
            </label>
          </>
        ) : (
          <label className="block">
            <FieldLabel>Generated GST period</FieldLabel>
            <Select
              name="gst_period_id"
              className="mt-1"
              defaultValue=""
              aria-invalid={Boolean(state.fieldErrors?.gst_period_id)}
              aria-describedby={errorId("gst_period_id")}
            >
              <option value="">Select generated GST period</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {clientName(period)} |{" "}
                  {formatDisplayDateRange(period.period_start, period.period_end)} |{" "}
                  {period.status.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            <FieldError id={errorId("gst_period_id")} message={state.fieldErrors?.gst_period_id} />
          </label>
        )}

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={pending}
            className="w-full"
          >
            {pending ? (
              <>
                <Download className="size-4" />
                Queueing
              </>
            ) : (
              <>
                <FileSpreadsheet className="size-4" />
                Queue export
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-khata-muted">
        <span className="inline-flex items-center gap-1">
          <FileSpreadsheet className="size-3.5" />
          CSV uses approved transactions only.
        </span>
        <span className="inline-flex items-center gap-1">
          <FileText className="size-3.5" />
          PDF is a review summary, not GST filing proof.
        </span>
      </div>

      <InfoNote>
        Export requests are queued, generated in the background, stored
        privately, and recorded in audit history.
      </InfoNote>

      {state.message && (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "danger"}
          className="mt-3"
        />
      )}
    </FilterBar>
  );
}
