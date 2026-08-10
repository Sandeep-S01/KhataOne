"use client";

import { useActionState } from "react";

import { createFirm, type AuthActionState } from "@/app/actions/auth";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-khata-danger">{message}</p>;
}

export function FirmOnboardingForm({ userEmail }: { userEmail?: string }) {
  const [state, formAction, pending] = useActionState(
    createFirm,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <label className="block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Firm name
        </span>
        <input
          name="firm_name"
          type="text"
          autoComplete="organization"
          className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
        />
        <FieldError message={state.fieldErrors?.firm_name} />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Firm email
        </span>
        <input
          name="email"
          type="email"
          defaultValue={userEmail}
          autoComplete="email"
          className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
        />
        <FieldError message={state.fieldErrors?.email} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            GSTIN
          </span>
          <input
            name="gstin"
            type="text"
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 font-mono text-sm uppercase outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Phone
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Address
        </span>
        <textarea
          name="address"
          rows={4}
          className="mt-1 w-full resize-none rounded-md border border-khata-border bg-khata-paper px-3 py-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
        />
      </label>

      {state.message && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-khata-danger">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-md bg-khata-green px-5 text-sm font-semibold text-white shadow-ledger transition hover:bg-khata-greenDark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Creating workspace..." : "Create firm workspace"}
      </button>
    </form>
  );
}
