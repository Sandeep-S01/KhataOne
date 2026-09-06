"use client";

import { useActionState } from "react";

import {
  signIn,
  signUp,
  type AuthActionState,
} from "@/app/actions/auth";
import { Button, FieldError, FormMessage } from "@/components/design-system";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

const labelClass = "text-sm font-medium leading-none text-khata-ink";
const fieldClass =
  "mt-1.5 h-9 w-full rounded-md border border-khata-border bg-transparent px-3 py-1 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/55 focus:border-khata-green focus:bg-white focus:ring-1 focus:ring-khata-green disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, formAction, pending] = useActionState(
    mode === "login" ? signIn : signUp,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      {mode === "signup" && (
        <>
          <label className="block">
            <span className={labelClass}>Name</span>
            <input
              name="full_name"
              type="text"
              autoComplete="name"
              className={fieldClass}
            />
            <FieldError message={state.fieldErrors?.full_name} />
          </label>

          <label className="block">
            <span className={labelClass}>Firm</span>
            <input
              name="firm_name"
              type="text"
              autoComplete="organization"
              className={fieldClass}
            />
            <FieldError message={state.fieldErrors?.firm_name} />
          </label>
        </>
      )}

      <label className="block">
        <span className={labelClass}>Work email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.email} />
      </label>

      <label className="block">
        <span className={labelClass}>Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={fieldClass}
        />
        <FieldError message={state.fieldErrors?.password} />
      </label>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : "danger"}
      />

      <Button
        type="submit"
        disabled={pending}
      >
        {pending
          ? "Working..."
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </Button>
    </form>
  );
}
