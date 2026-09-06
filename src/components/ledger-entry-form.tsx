"use client";

import { useActionState } from "react";

import {
  updateLedgerEntryAction,
  type LedgerActionState,
} from "@/app/actions/ledger";
import {
  Button,
  FieldError,
  FieldLabel,
  FormActions,
  FormMessage,
  Input,
  Textarea,
} from "@/components/design-system";

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

export function LedgerEntryForm({ entry }: { entry: LedgerEntryValues }) {
  const [state, formAction, pending] = useActionState(
    updateLedgerEntryAction,
    initialState,
  );

  return (
    <form action={formAction} className="k-card p-5">
      <input type="hidden" name="entry_id" value={entry.id} />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <FieldLabel>
            Entry date
          </FieldLabel>
          <Input
            name="entry_date"
            type="date"
            defaultValue={entry.entry_date ?? ""}
            className="mt-1"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Account name
          </FieldLabel>
          <Input
            name="account_name"
            type="text"
            defaultValue={entry.account_name}
            className="mt-1"
          />
          <FieldError message={state.fieldErrors?.account_name} />
        </label>

        <label className="block">
          <FieldLabel>
            Debit
          </FieldLabel>
          <Input
            name="debit_amount"
            type="number"
            step="0.01"
            defaultValue={entry.debit_amount}
            className="num mt-1 text-right"
          />
          <FieldError message={state.fieldErrors?.debit_amount} />
        </label>

        <label className="block">
          <FieldLabel>
            Credit
          </FieldLabel>
          <Input
            name="credit_amount"
            type="number"
            step="0.01"
            defaultValue={entry.credit_amount}
            className="num mt-1 text-right"
          />
          <FieldError message={state.fieldErrors?.credit_amount} />
        </label>
      </div>

      <label className="mt-4 block">
        <FieldLabel>
          Narration
        </FieldLabel>
        <Textarea
          name="narration"
          rows={3}
          defaultValue={entry.narration ?? ""}
          className="mt-1"
        />
      </label>

      <label className="mt-4 block">
        <FieldLabel>
          Correction note
        </FieldLabel>
        <Textarea
          name="correction_note"
          rows={3}
          className="mt-1"
          placeholder="Reason for correcting this ledger handoff."
        />
      </label>

      <FormMessage message={state.message} className="mt-4" />

      <FormActions>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving..." : "Save ledger correction"}
        </Button>
      </FormActions>
    </form>
  );
}
