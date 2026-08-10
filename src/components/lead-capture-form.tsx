"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import {
  submitLeadRequest,
  type LeadRequestState,
} from "@/app/actions/lead-request";

const initialState: LeadRequestState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center rounded-md bg-khata-green px-5 text-sm font-semibold text-white shadow-ledger transition hover:bg-khata-greenDark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Sending request..." : "Request demo"}
      {!pending && <ArrowRight className="ml-2 h-4 w-4" />}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-khata-danger">{message}</p>;
}

export function LeadCaptureForm() {
  const [state, formAction] = useActionState(submitLeadRequest, initialState);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-khata-border bg-white p-4 shadow-ledger sm:p-5"
    >
      <div className="mb-5">
        <p className="text-sm font-semibold">Book a KhataOne demo</p>
        <p className="mt-1 text-sm leading-6 text-khata-muted">
          Share your firm details and the team will configure the right starting
          workflow.
        </p>
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
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
            WhatsApp / phone
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          />
          <FieldError message={state.fieldErrors?.phone} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Firm size
          </span>
          <select
            name="firm_size"
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
            defaultValue=""
          >
            <option value="">Select</option>
            <option value="solo">Solo practice</option>
            <option value="2-5">2-5 team members</option>
            <option value="6-20">6-20 team members</option>
            <option value="20+">20+ team members</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Request type
          </span>
          <select
            name="intent"
            className="mt-1 h-11 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
            defaultValue="demo"
          >
            <option value="demo">Book demo</option>
            <option value="waitlist">Join waitlist</option>
            <option value="signup">Start signup</option>
          </select>
          <FieldError message={state.fieldErrors?.intent} />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-khata-muted">
          Current workflow
        </span>
        <textarea
          name="message"
          rows={4}
          className="mt-1 w-full resize-none rounded-md border border-khata-border bg-khata-paper px-3 py-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
          placeholder="Example: 80 clients, GST monthly, clients send bills on WhatsApp."
        />
      </label>

      {state.message && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-green-200 bg-green-50 text-khata-green"
              : "border-red-200 bg-red-50 text-khata-danger"
          }`}
        >
          {state.status === "success" && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{state.message}</p>
        </div>
      )}

      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}
