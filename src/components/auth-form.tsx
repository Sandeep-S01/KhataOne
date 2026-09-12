"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import type {
  ChangeEvent,
  ComponentPropsWithoutRef,
  FormEvent,
} from "react";

import {
  signIn,
  signUp,
  type AuthActionState,
} from "@/app/actions/auth";
import { Button, FieldError, FormMessage } from "@/components/design-system";
import {
  type AuthFieldName,
  validateAuthField,
} from "@/lib/auth-validation";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

const labelClass = "text-sm font-medium leading-none text-khata-ink";
const fieldGroupClass = "grid gap-1.5";
const fieldClass =
  "h-9 w-full rounded-md border border-khata-border bg-transparent px-3 py-1 text-base text-khata-ink shadow-sm outline-none transition placeholder:text-khata-muted/55 focus:border-khata-green focus:bg-white focus:ring-1 focus:ring-khata-green aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:border-destructive aria-[invalid=true]:focus:ring-destructive disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

type AuthValues = Record<AuthFieldName, string>;

const initialValues: AuthValues = {
  full_name: "",
  firm_name: "",
  email: "",
  password: "",
};

function InlineFieldError({ id, message }: { id: string; message?: string }) {
  return (
    <span
      id={id}
      aria-live="polite"
      className="min-h-4 text-right text-xs font-medium leading-4 text-destructive"
    >
      {message}
    </span>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<AuthValues>(initialValues);
  const [dirtyFields, setDirtyFields] = useState<
    Partial<Record<AuthFieldName, boolean>>
  >({});
  const [state, formAction, pending] = useActionState(
    mode === "login" ? signIn : signUp,
    initialState,
  );
  const activeFields: AuthFieldName[] =
    mode === "signup"
      ? ["full_name", "firm_name", "email", "password"]
      : ["email", "password"];
  const fieldError = (field: AuthFieldName) =>
    dirtyFields[field]
      ? validateAuthField(field, values[field])
      : state.fieldErrors?.[field];
  const fullNameError = fieldError("full_name");
  const firmNameError = fieldError("firm_name");
  const emailError = fieldError("email");
  const passwordError = fieldError("password");
  const passwordInputId = `${mode}-password`;
  const passwordHelpId = mode === "signup" ? "signup-password-help" : undefined;
  const forgotPasswordHref =
    "/forgot-password" as ComponentPropsWithoutRef<typeof Link>["href"];

  const updateField =
    (field: AuthFieldName) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setDirtyFields((current) => ({ ...current, [field]: true }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setDirtyFields((current) => ({
      ...current,
      ...Object.fromEntries(activeFields.map((field) => [field, true])),
    }));

    if (activeFields.some((field) => validateAuthField(field, values[field]))) {
      event.preventDefault();
    }
  };

  return (
    <form
      action={formAction}
      className="mt-6 grid gap-4"
      noValidate
      onSubmit={handleSubmit}
    >
      {mode === "signup" && (
        <>
          <label className={fieldGroupClass}>
            <span className="flex min-h-4 items-center justify-between gap-3">
              <span className={labelClass}>Full name</span>
              <InlineFieldError
                id="signup-full-name-error"
                message={fullNameError}
              />
            </span>
            <input
              name="full_name"
              type="text"
              autoComplete="name"
              required
              value={values.full_name}
              onChange={updateField("full_name")}
              aria-invalid={Boolean(fullNameError)}
              aria-describedby={
                fullNameError ? "signup-full-name-error" : undefined
              }
              className={fieldClass}
            />
          </label>

          <label className={fieldGroupClass}>
            <span className="flex min-h-4 items-center justify-between gap-3">
              <span className={labelClass}>Firm name</span>
              <InlineFieldError
                id="signup-firm-name-error"
                message={firmNameError}
              />
            </span>
            <input
              name="firm_name"
              type="text"
              autoComplete="organization"
              required
              value={values.firm_name}
              onChange={updateField("firm_name")}
              aria-invalid={Boolean(firmNameError)}
              aria-describedby={
                firmNameError ? "signup-firm-name-error" : undefined
              }
              className={fieldClass}
            />
          </label>
        </>
      )}

      <label className={fieldGroupClass}>
        <span className="flex min-h-4 items-center justify-between gap-3">
          <span className={labelClass}>Work email</span>
          {mode === "signup" && (
            <InlineFieldError id="signup-email-error" message={emailError} />
          )}
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={updateField("email")}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? `${mode}-email-error` : undefined}
          className={fieldClass}
        />
        {mode === "login" && (
          <FieldError id="login-email-error" message={emailError} />
        )}
      </label>

      <div className={fieldGroupClass}>
        <div className="flex min-h-4 items-center justify-between gap-3">
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
            value={values.password}
            onChange={updateField("password")}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              mode === "signup"
                ? passwordHelpId
                : passwordError
                  ? "login-password-error"
                  : undefined
            }
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
        {mode === "signup" ? (
          <p
            id={passwordHelpId}
            aria-live="polite"
            className={`text-xs font-medium leading-4 ${
              passwordError ? "text-destructive" : "text-khata-muted"
            }`}
          >
            {passwordError ?? "Use at least 8 characters."}
          </p>
        ) : (
          <FieldError id="login-password-error" message={passwordError} />
        )}
      </div>

      <FormMessage
        message={state.fieldErrors ? undefined : state.message}
        tone={state.status === "success" ? "success" : "danger"}
      />

      <Button type="submit" disabled={pending} className="w-full">
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
