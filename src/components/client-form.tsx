"use client";

import { useActionState } from "react";

import {
  createClientAction,
  updateClientAction,
  type ClientActionState,
} from "@/app/actions/clients";

const initialState: ClientActionState = {
  status: "idle",
  message: "",
};

export type ClientFormValues = {
  id?: string;
  business_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  whatsapp_phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  state_code?: string | null;
  filing_frequency?: string | null;
  status?: string | null;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-khata-danger">{message}</p>;
}

export function ClientForm({ client }: { client?: ClientFormValues }) {
  const isEditing = Boolean(client?.id);
  const [state, formAction, pending] = useActionState(
    isEditing ? updateClientAction : createClientAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger"
    >
      {client?.id && <input type="hidden" name="client_id" value={client.id} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Business name
          </span>
          <input
            name="business_name"
            type="text"
            defaultValue={client?.business_name ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.business_name} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Contact name
          </span>
          <input
            name="contact_name"
            type="text"
            defaultValue={client?.contact_name ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Phone
          </span>
          <input
            name="phone"
            type="tel"
            defaultValue={client?.phone ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.phone} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            WhatsApp phone
          </span>
          <input
            name="whatsapp_phone"
            type="tel"
            defaultValue={client?.whatsapp_phone ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.whatsapp_phone} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Email
          </span>
          <input
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.email} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            GSTIN
          </span>
          <input
            name="gstin"
            type="text"
            defaultValue={client?.gstin ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 font-mono text-sm uppercase outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.gstin} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            State code
          </span>
          <input
            name="state_code"
            type="text"
            defaultValue={client?.state_code ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 font-mono text-sm uppercase outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.state_code} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Filing frequency
          </span>
          <select
            name="filing_frequency"
            defaultValue={client?.filing_frequency ?? "monthly"}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="unknown">Unknown</option>
          </select>
          <FieldError message={state.fieldErrors?.filing_frequency} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Status
          </span>
          <select
            name="status"
            defaultValue={client?.status ?? "onboarding"}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          >
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="pending_documents">Pending documents</option>
            <option value="review_needed">Review needed</option>
            <option value="filing_ready">Filing ready</option>
            <option value="archived">Archived</option>
          </select>
          <FieldError message={state.fieldErrors?.status} />
        </label>
      </div>

      {state.message && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-khata-danger">
          {state.message}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-md bg-khata-green px-5 text-sm font-semibold text-white shadow-ledger transition hover:bg-khata-greenDark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending
            ? "Saving..."
            : isEditing
              ? "Save client"
              : "Create client"}
        </button>
      </div>
    </form>
  );
}
