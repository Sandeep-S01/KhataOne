"use client";

import { useActionState } from "react";

import {
  updateTransactionAction,
  type ReviewActionState,
} from "@/app/actions/review";

export type TransactionReviewValues = {
  id: string;
  transaction_type: string;
  transaction_date: string | null;
  party_name: string | null;
  party_gstin: string | null;
  invoice_number: string | null;
  description: string | null;
  category: string | null;
  place_of_supply: string | null;
  taxable_amount: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null;
  cess_amount: number | null;
  total_amount: number | null;
  payment_mode: string | null;
};

const initialState: ReviewActionState = {
  status: "idle",
  message: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-khata-danger">{message}</p>;
}

function numberValue(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

export function TransactionReviewForm({
  transaction,
}: {
  transaction: TransactionReviewValues;
}) {
  const [state, formAction, pending] = useActionState(
    updateTransactionAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger"
    >
      <input type="hidden" name="transaction_id" value={transaction.id} />

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Type
          </span>
          <select
            name="transaction_type"
            defaultValue={transaction.transaction_type}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          >
            <option value="purchase">Purchase</option>
            <option value="sales">Sales</option>
            <option value="expense">Expense</option>
            <option value="payment">Payment</option>
            <option value="receipt">Receipt</option>
            <option value="unclear">Unclear</option>
          </select>
          <FieldError message={state.fieldErrors?.transaction_type} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Date
          </span>
          <input
            name="transaction_date"
            type="date"
            defaultValue={transaction.transaction_date ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Party
          </span>
          <input
            name="party_name"
            type="text"
            defaultValue={transaction.party_name ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Party GSTIN
          </span>
          <input
            name="party_gstin"
            type="text"
            defaultValue={transaction.party_gstin ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 font-mono text-sm uppercase outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Invoice number
          </span>
          <input
            name="invoice_number"
            type="text"
            defaultValue={transaction.invoice_number ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 font-mono text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Category
          </span>
          <input
            name="category"
            type="text"
            defaultValue={transaction.category ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Place of supply
          </span>
          <input
            name="place_of_supply"
            type="text"
            defaultValue={transaction.place_of_supply ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Payment mode
          </span>
          <input
            name="payment_mode"
            type="text"
            defaultValue={transaction.payment_mode ?? ""}
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {[
          ["taxable_amount", "Taxable"],
          ["cgst_amount", "CGST"],
          ["sgst_amount", "SGST"],
          ["igst_amount", "IGST"],
          ["cess_amount", "Cess"],
          ["total_amount", "Total"],
        ].map(([name, label]) => (
          <label key={name} className="block">
            <span className="text-xs font-semibold uppercase text-khata-muted">
              {label}
            </span>
            <input
              name={name}
              type="number"
              step="0.01"
              defaultValue={numberValue(
                transaction[name as keyof TransactionReviewValues] as
                  | number
                  | null,
              )}
              className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-right font-mono text-sm outline-none transition focus:border-khata-green focus:bg-white"
            />
            <FieldError message={state.fieldErrors?.[name]} />
          </label>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Description
        </span>
        <textarea
          name="description"
          rows={3}
          defaultValue={transaction.description ?? ""}
          className="mt-1 w-full resize-none rounded-md border border-khata-border bg-khata-paper px-3 py-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
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
          {pending ? "Saving..." : "Save review edits"}
        </button>
      </div>
    </form>
  );
}
