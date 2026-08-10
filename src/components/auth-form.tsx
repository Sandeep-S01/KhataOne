"use client";

import { useActionState } from "react";

import {
  signIn,
  signUp,
  type AuthActionState,
} from "@/app/actions/auth";

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

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, formAction, pending] = useActionState(
    mode === "login" ? signIn : signUp,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      {mode === "signup" && (
        <>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-khata-muted">
              Name
            </span>
            <input
              name="full_name"
              type="text"
              autoComplete="name"
              className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
            />
            <FieldError message={state.fieldErrors?.full_name} />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-khata-muted">
              Firm
            </span>
            <input
              name="firm_name"
              type="text"
              autoComplete="organization"
              className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
            />
            <FieldError message={state.fieldErrors?.firm_name} />
          </label>
        </>
      )}

      <label className="block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Work email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
        />
        <FieldError message={state.fieldErrors?.email} />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
        />
        <FieldError message={state.fieldErrors?.password} />
      </label>

      {state.message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-green-200 bg-green-50 text-khata-green"
              : "border-red-200 bg-red-50 text-khata-danger"
          }`}
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-md bg-khata-green px-5 text-sm font-semibold text-white shadow-ledger transition hover:bg-khata-greenDark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending
          ? "Working..."
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
