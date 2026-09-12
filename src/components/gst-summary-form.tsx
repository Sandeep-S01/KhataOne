"use client";

import { useActionState } from "react";

import {
  generateGstSummaryAction,
  type GstActionState,
} from "@/app/actions/gst";
import {
  Button,
  FieldError,
  FieldLabel,
  FilterBar,
  FormMessage,
  Input,
  Select,
} from "@/components/design-system";

export type GstClientOption = {
  id: string;
  business_name: string;
  filing_frequency: string;
};

const initialState: GstActionState = {
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

export function GstSummaryForm({ clients }: { clients: GstClientOption[] }) {
  const [state, formAction, pending] = useActionState(
    generateGstSummaryAction,
    initialState,
  );

  return (
    <FilterBar
      action={formAction}
      className="md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]"
    >
      <label className="block">
        <FieldLabel>
          Client
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
          Custom period start
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
          Custom period end
        </FieldLabel>
        <Input
          name="period_end"
          type="date"
          defaultValue={monthEnd()}
          className="mt-1"
        />
        <FieldError message={state.fieldErrors?.period_end} />
      </label>

      <label className="block">
        <FieldLabel>
          Filing
        </FieldLabel>
        <Select
          name="filing_type"
          defaultValue="monthly"
          className="mt-1"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </Select>
        <FieldError message={state.fieldErrors?.filing_type} />
      </label>

      <div className="flex items-end">
        <Button
          type="submit"
          disabled={pending || clients.length === 0}
          className="w-full"
        >
          {pending ? "Generating..." : "Generate"}
        </Button>
      </div>

      {state.message && (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "danger"}
          className="md:col-span-5"
        />
      )}
    </FilterBar>
  );
}
