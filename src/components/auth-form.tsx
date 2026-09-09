"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState(
    mode === "login" ? signIn : signUp,
    initialState,
  );
  const passwordHelpId = mode === "signup" ? "signup-password-help" : undefined;
  const passwordErrorId = state.fieldErrors?.password
    ? `${mode}-password-error`
    : undefined;
  const passwordDescription = [passwordHelpId, passwordErrorId]
    .filter(Boolean)
    .join(" ");
  const passwordInputId = `${mode}-password`;
  const forgotPasswordHref =
    "/forgot-password" as ComponentPropsWithoutRef<typeof Link>["href"];

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
              required
              aria-invalid={Boolean(state.fieldErrors?.full_name)}
              aria-describedby={
                state.fieldErrors?.full_name ? "signup-full-name-error" : undefined
              }
              className={fieldClass}
            />
            <FieldError
              id="signup-full-name-error"
              message={state.fieldErrors?.full_name}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Firm</span>
            <input
              name="firm_name"
              type="text"
              autoComplete="organization"
              required
              aria-invalid={Boolean(state.fieldErrors?.firm_name)}
              aria-describedby={
                state.fieldErrors?.firm_name ? "signup-firm-name-error" : undefined
              }
              className={fieldClass}
            />
            <FieldError
              id="signup-firm-name-error"
              message={state.fieldErrors?.firm_name}
            />
          </label>
        </>
      )}

      <label className="block">
        <span className={labelClass}>Work email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={
            state.fieldErrors?.email ? `${mode}-email-error` : undefined
          }
          className={fieldClass}
        />
        <FieldError
          id={`${mode}-email-error`}
          message={state.fieldErrors?.email}
        />
      </label>

      <div className="block">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={passwordInputId} className={labelClass}>
            Password
          </label>
          {mode === "login" && (
            <Link
              href={forgotPasswordHref}
              className="text-xs font-semibold text-khata-green transition hover:text-khata-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <span className="relative block">
          <input
            id={passwordInputId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={passwordDescription || undefined}
            className={`${fieldClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-khata-muted transition hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </span>
        {mode === "signup" && (
          <p id={passwordHelpId} className="mt-1 text-xs leading-5 text-khata-muted">
            Use at least 8 characters.
          </p>
        )}
        <FieldError
          id={`${mode}-password-error`}
          message={state.fieldErrors?.password}
        />
      </div>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : "danger"}
      />

      <Button
        type="submit"
        disabled={pending}
        className="w-full"
      >
        {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {pending
          ? "Working..."
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </Button>
    </form>
  );
}
