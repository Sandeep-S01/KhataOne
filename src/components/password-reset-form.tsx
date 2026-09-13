"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

import {
  requestPasswordReset,
  type AuthActionState,
} from "@/app/actions/auth";
import { Button, FieldError, FormMessage } from "@/components/design-system";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

const fieldClass =
  "mt-1.5 h-11 w-full rounded-md border border-khata-border bg-transparent px-3 py-1 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/55 focus:border-khata-green focus:bg-white focus:ring-1 focus:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:text-sm";

export function PasswordResetForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="block">
        <span className="text-sm font-medium leading-none text-khata-ink">
          Work email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={
            state.fieldErrors?.email ? "password-reset-email-error" : undefined
          }
          className={fieldClass}
        />
        <FieldError
          id="password-reset-email-error"
          message={state.fieldErrors?.email}
        />
      </label>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : "danger"}
      />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight aria-hidden="true" />
        )}
        {pending ? "Sending reset link..." : "Send reset link"}
      </Button>
    </form>
  );
}
