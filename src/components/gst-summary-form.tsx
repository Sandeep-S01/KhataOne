"use client";

import { useActionState } from "react";

import {
  generateGstSummaryAction,
  type GstActionState,
} from "@/app/actions/gst";

export type GstClientOption = {
  id: string;
  business_name: string;
  filing_frequency: string;
};

const initialState: GstActionState = {
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

export function GstSummaryForm({ clients }: { clients: GstClientOption[] }) {
  const [state, formAction, pending] = useActionState(
    generateGstSummaryAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-khata-border bg-white p-4 shadow-sm md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]"
    >
      <label className="block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Client
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

      <label className="block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Filing
        </span>
        <select
          name="filing_type"
          defaultValue="monthly"
          className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
        <FieldError message={state.fieldErrors?.filing_type} />
      </label>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending || clients.length === 0}
          className="h-10 w-full rounded-md bg-khata-green px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Generating..." : "Generate"}
        </button>
      </div>

      {state.message && (
        <div className="md:col-span-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-khata-danger">
          {state.message}
        </div>
      )}
    </form>
  );
}
