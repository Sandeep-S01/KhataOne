"use client";

import { useActionState, useEffect } from "react";

import {
  updateTransactionAction,
  type ReviewActionState,
} from "@/app/actions/review";
import {
  Button,
  FieldError,
  FieldLabel,
  FormActions,
  FormMessage,
  Input,
  Select,
  Textarea,
} from "@/components/design-system";

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

function numberValue(value: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

export function TransactionReviewForm({
  transaction,
  onDirtyChange,
  returnContext = "",
}: {
  transaction: TransactionReviewValues;
  onDirtyChange?: (isDirty: boolean) => void;
  returnContext?: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateTransactionAction,
    initialState,
  );
  const fieldError = (name: string) => state.fieldErrors?.[name];
  const errorId = (name: string) =>
    fieldError(name) ? `transaction-${name.replaceAll("_", "-")}-error` : undefined;

  useEffect(() => {
    if (state.status === "success") {
      onDirtyChange?.(false);
    }
  }, [onDirtyChange, state.status]);

  function markDirty() {
    onDirtyChange?.(true);
  }

  return (
    <form action={formAction} className="k-card p-5" onChange={markDirty}>
      <input type="hidden" name="transaction_id" value={transaction.id} />
      {returnContext && (
        <input type="hidden" name="return_context" value={returnContext} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <FieldLabel>
            Type
          </FieldLabel>
          <Select
            name="transaction_type"
            aria-invalid={Boolean(fieldError("transaction_type"))}
            aria-describedby={errorId("transaction_type")}
            defaultValue={transaction.transaction_type}
            className="mt-1"
          >
            <option value="purchase">Purchase</option>
            <option value="sales">Sales</option>
            <option value="expense">Expense</option>
            <option value="payment">Payment</option>
            <option value="receipt">Receipt</option>
            <option value="unclear">Unclear</option>
          </Select>
          <FieldError id={errorId("transaction_type")} message={fieldError("transaction_type")} />
        </label>

        <label className="block">
          <FieldLabel>
            Date
          </FieldLabel>
          <Input
            name="transaction_date"
            type="date"
            defaultValue={transaction.transaction_date ?? ""}
            className="mt-1"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Party
          </FieldLabel>
          <Input
            name="party_name"
            type="text"
            defaultValue={transaction.party_name ?? ""}
            className="mt-1"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Party GSTIN
          </FieldLabel>
          <Input
            name="party_gstin"
            type="text"
            defaultValue={transaction.party_gstin ?? ""}
            className="num mt-1 uppercase"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Invoice number
          </FieldLabel>
          <Input
            name="invoice_number"
            type="text"
            defaultValue={transaction.invoice_number ?? ""}
            className="num mt-1"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Category
          </FieldLabel>
          <Input
            name="category"
            type="text"
            defaultValue={transaction.category ?? ""}
            className="mt-1"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Place of supply
          </FieldLabel>
          <Input
            name="place_of_supply"
            type="text"
            defaultValue={transaction.place_of_supply ?? ""}
            className="mt-1"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Payment mode
          </FieldLabel>
          <Input
            name="payment_mode"
            type="text"
            defaultValue={transaction.payment_mode ?? ""}
            className="mt-1"
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
            <FieldLabel>
              {label}
            </FieldLabel>
            <Input
              name={name}
              type="number"
              aria-invalid={Boolean(fieldError(name))}
              aria-describedby={errorId(name)}
              step="0.01"
              defaultValue={numberValue(
                transaction[name as keyof TransactionReviewValues] as
                  | number
                  | null,
              )}
              className="num mt-1 text-right"
            />
            <FieldError id={errorId(name)} message={fieldError(name)} />
          </label>
        ))}
      </div>

      <label className="mt-4 block">
        <FieldLabel>
          Description
        </FieldLabel>
        <Textarea
          name="description"
          rows={3}
          defaultValue={transaction.description ?? ""}
          className="mt-1"
        />
      </label>

      <FormMessage message={state.message} className="mt-4" />

      <FormActions>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving..." : "Save review edits"}
        </Button>
      </FormActions>
    </form>
  );
}
