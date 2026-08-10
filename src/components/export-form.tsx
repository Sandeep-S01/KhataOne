"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useActionState } from "react";

import {
  createExportAction,
  type ExportActionState,
} from "@/app/actions/exports";

export type ExportClientOption = {
  id: string;
  business_name: string;
};

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

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-khata-danger">{message}</p>;
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function monthEnd() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
}

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

  return (
    <form
      action={formAction}
      className="rounded-lg border border-khata-border bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto]">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Type
          </span>
          <select
            name="export_type"
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
            defaultValue="csv_transactions"
          >
            <option value="csv_transactions">Transactions CSV</option>
            <option value="gst_summary">GST summary CSV</option>
            <option value="pdf_summary">GST summary PDF</option>
          </select>
          <FieldError message={state.fieldErrors?.export_type} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Client for transactions
          </span>
          <select
            name="client_id"
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
            defaultValue=""
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.business_name}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.client_id} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Start
          </span>
          <input
            name="period_start"
            type="date"
            defaultValue={monthStart()}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          />
          <FieldError message={state.fieldErrors?.period_start} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            End
          </span>
          <input
            name="period_end"
            type="date"
            defaultValue={monthEnd()}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          />
          <FieldError message={state.fieldErrors?.period_end} />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-khata-green px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? (
              <>
                <Download className="size-4" />
                Generating
              </>
            ) : (
              <>
                <FileSpreadsheet className="size-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          GST period for summary exports
        </span>
        <select
          name="gst_period_id"
          className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          defaultValue=""
        >
          <option value="">Select generated GST period</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {clientName(period)} | {period.period_start} to{" "}
              {period.period_end} | {period.status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.gst_period_id} />
      </label>

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

      {state.message && (
        <div
          className={`mt-3 rounded-md border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-green-200 bg-green-50 text-khata-green"
              : "border-red-200 bg-red-50 text-khata-danger"
          }`}
        >
          {state.message}
        </div>
      )}
    </form>
  );
}
