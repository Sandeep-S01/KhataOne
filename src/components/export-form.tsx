"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useActionState } from "react";

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
  Input,
  Select,
} from "@/components/design-system";

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
    <FilterBar
      action={formAction}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto]">
        <label className="block">
          <FieldLabel>
            Type
          </FieldLabel>
          <Select
            name="export_type"
            className="mt-1"
            defaultValue="csv_transactions"
          >
            <option value="csv_transactions">Transactions CSV</option>
            <option value="gst_summary">GST summary CSV</option>
            <option value="pdf_summary">GST summary PDF</option>
          </Select>
          <FieldError message={state.fieldErrors?.export_type} />
        </label>

        <label className="block">
          <FieldLabel>
            Client for transactions
          </FieldLabel>
          <Select
            name="client_id"
            className="mt-1"
            defaultValue=""
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.business_name}
              </option>
            ))}
          </Select>
          <FieldError message={state.fieldErrors?.client_id} />
        </label>

        <label className="block">
          <FieldLabel>
            Start
          </FieldLabel>
          <Input
            name="period_start"
            type="date"
            defaultValue={monthStart()}
            className="mt-1"
          />
          <FieldError message={state.fieldErrors?.period_start} />
        </label>

        <label className="block">
          <FieldLabel>
            End
          </FieldLabel>
          <Input
            name="period_end"
            type="date"
            defaultValue={monthEnd()}
            className="mt-1"
          />
          <FieldError message={state.fieldErrors?.period_end} />
        </label>

        <div className="flex items-end">
          <Button
            type="submit"
            disabled={pending}
            className="w-full"
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
          </Button>
        </div>
      </div>

      <label className="mt-3 block">
        <FieldLabel>
          GST period for summary exports
        </FieldLabel>
        <Select
          name="gst_period_id"
          className="mt-1"
          defaultValue=""
        >
          <option value="">Select generated GST period</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {clientName(period)} | {period.period_start} to{" "}
              {period.period_end} | {period.status.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
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
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "danger"}
          className="mt-3"
        />
      )}
    </FilterBar>
  );
}
