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
import { currentMonthDateRange } from "@/lib/format";

export type GstClientOption = {
  id: string;
  business_name: string;
  filing_frequency: string;
};

const initialState: GstActionState = {
  status: "idle",
  message: "",
};

export function GstSummaryForm({ clients }: { clients: GstClientOption[] }) {
  const [state, formAction, pending] = useActionState(
    generateGstSummaryAction,
    initialState,
  );
  const defaultPeriod = currentMonthDateRange();
  const errorId = (name: string) =>
    state.fieldErrors?.[name] ? `gst-${name.replaceAll("_", "-")}-error` : undefined;

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
        <FieldLabel>
          Custom period start
        </FieldLabel>
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
        <FieldLabel>
          Custom period end
        </FieldLabel>
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

      <label className="block">
        <FieldLabel>
          Filing
        </FieldLabel>
        <Select
          name="filing_type"
          defaultValue="monthly"
          className="mt-1"
          aria-invalid={Boolean(state.fieldErrors?.filing_type)}
          aria-describedby={errorId("filing_type")}
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </Select>
        <FieldError id={errorId("filing_type")} message={state.fieldErrors?.filing_type} />
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
