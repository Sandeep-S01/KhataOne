"use client";

import { useActionState } from "react";

import {
  updateLedgerEntryAction,
  type LedgerActionState,
} from "@/app/actions/ledger";

export type LedgerEntryValues = {
  id: string;
  entry_date: string | null;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  narration: string | null;
};

const initialState: LedgerActionState = {
  status: "idle",
  message: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-khata-danger">{message}</p>;
}

export function LedgerEntryForm({ entry }: { entry: LedgerEntryValues }) {
  const [state, formAction, pending] = useActionState(
    updateLedgerEntryAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger"
    >
      <input type="hidden" name="entry_id" value={entry.id} />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Entry date
          </span>
          <input
            name="entry_date"
            type="date"
            defaultValue={entry.entry_date ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Account name
          </span>
          <input
            name="account_name"
            type="text"
            defaultValue={entry.account_name}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.account_name} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Debit
          </span>
          <input
            name="debit_amount"
            type="number"
            step="0.01"
            defaultValue={entry.debit_amount}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-right font-mono text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.debit_amount} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Credit
          </span>
          <input
            name="credit_amount"
            type="number"
            step="0.01"
            defaultValue={entry.credit_amount}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-right font-mono text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.credit_amount} />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Narration
        </span>
        <textarea
          name="narration"
          rows={3}
          defaultValue={entry.narration ?? ""}
          className="mt-1 w-full resize-none rounded-md border border-khata-border bg-khata-paper px-3 py-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Correction note
        </span>
        <textarea
          name="correction_note"
          rows={3}
          className="mt-1 w-full resize-none rounded-md border border-khata-border bg-khata-paper px-3 py-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          placeholder="Reason for correcting this ledger handoff."
        />
      </label>

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
          {pending ? "Saving..." : "Save ledger correction"}
        </button>
      </div>
    </form>
  );
}
