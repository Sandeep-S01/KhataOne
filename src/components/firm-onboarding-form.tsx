"use client";

import { useActionState } from "react";

import { createFirm, type AuthActionState } from "@/app/actions/auth";
import {
  Button,
  FieldError,
  FieldLabel,
  FormMessage,
  Input,
  Textarea,
} from "@/components/design-system";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

export function FirmOnboardingForm({ userEmail }: { userEmail?: string }) {
  const [state, formAction, pending] = useActionState(
    createFirm,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="block">
        <FieldLabel>
          Firm name
        </FieldLabel>
        <Input
          name="firm_name"
          type="text"
          autoComplete="organization"
          className="mt-1"
        />
        <FieldError message={state.fieldErrors?.firm_name} />
      </label>

      <label className="block">
        <FieldLabel>
          Firm email
        </FieldLabel>
        <Input
          name="email"
          type="email"
          defaultValue={userEmail}
          autoComplete="email"
          className="mt-1"
        />
        <FieldError message={state.fieldErrors?.email} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>
            GSTIN
          </FieldLabel>
          <Input
            name="gstin"
            type="text"
            className="num mt-1 uppercase"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Phone
          </FieldLabel>
          <Input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1"
          />
        </label>
      </div>

      <label className="block">
        <FieldLabel>
          Address
        </FieldLabel>
        <Textarea
          name="address"
          rows={4}
          className="mt-1"
        />
      </label>

      <FormMessage message={state.message} />

      <Button
        type="submit"
        disabled={pending}
        className="w-full"
      >
        {pending ? "Creating workspace..." : "Create firm workspace"}
      </Button>
    </form>
  );
}
