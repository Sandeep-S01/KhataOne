"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";

import {
  submitLeadRequest,
  type LeadRequestState,
} from "@/app/actions/lead-request";
import { FieldError, FieldLabel } from "@/components/design-system";

const initialState: LeadRequestState = {
  status: "idle",
  message: "",
};

const fieldClass =
  "mt-1.5 min-h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none transition placeholder:text-khata-muted/60 focus:border-khata-green focus:bg-white focus:ring-2 focus:ring-khata-green/10";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-khata-green px-4 text-sm font-medium text-white shadow-sm transition hover:bg-khata-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {pending ? "Sending request..." : "Request demo"}
      {!pending && <ArrowRight className="ml-2 h-4 w-4" />}
    </button>
  );
}

export function LeadCaptureForm() {
  const [state, formAction] = useActionState(submitLeadRequest, initialState);

  return (
    <form
      action={formAction}
      className="k-card p-5"
    >
      <div className="mb-5">
        <p className="font-display text-xl font-semibold tracking-normal text-khata-ink">
          Book a KhataOne demo
        </p>
        <p className="mt-2 text-sm leading-6 text-khata-muted">
          Share your firm details and the team will configure the right starting
          workflow for your intake and review process.
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Name</FieldLabel>
          <input
            name="full_name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.full_name)}
            aria-describedby={state.fieldErrors?.full_name ? "full-name-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="full-name-error" message={state.fieldErrors?.full_name} />
        </label>

        <label className="block">
          <FieldLabel>Firm</FieldLabel>
          <input
            name="firm_name"
            type="text"
            autoComplete="organization"
            required
            aria-invalid={Boolean(state.fieldErrors?.firm_name)}
            aria-describedby={state.fieldErrors?.firm_name ? "firm-name-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="firm-name-error" message={state.fieldErrors?.firm_name} />
        </label>

        <label className="block">
          <FieldLabel>Work email</FieldLabel>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "lead-email-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="lead-email-error" message={state.fieldErrors?.email} />
        </label>

        <label className="block">
          <FieldLabel>WhatsApp / phone</FieldLabel>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            aria-describedby={state.fieldErrors?.phone ? "lead-phone-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="lead-phone-error" message={state.fieldErrors?.phone} />
        </label>

        <label className="block">
          <FieldLabel>Firm size</FieldLabel>
          <select
            name="firm_size"
            className={fieldClass}
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
          <FieldLabel>Request type</FieldLabel>
          <select
            name="intent"
            aria-invalid={Boolean(state.fieldErrors?.intent)}
            aria-describedby={state.fieldErrors?.intent ? "lead-intent-error" : undefined}
            className={fieldClass}
            defaultValue="demo"
            required
          >
            <option value="demo">Book demo</option>
            <option value="waitlist">Join waitlist</option>
            <option value="signup">Start signup</option>
          </select>
          <FieldError id="lead-intent-error" message={state.fieldErrors?.intent} />
        </label>
      </div>

      <label className="mt-3 block">
        <FieldLabel>Current workflow</FieldLabel>
        <textarea
          name="message"
          rows={4}
          className={`${fieldClass} h-auto resize-y py-3`}
          placeholder="Example: 80 clients, GST monthly, clients send bills on WhatsApp."
        />
      </label>

      {state.message && (
        <div
          aria-live="polite"
          className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {state.status === "success" && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{state.message}</p>
        </div>
      )}

      <div className="mt-4">
        <SubmitButton />
      </div>
      <p className="mt-3 text-xs leading-5 text-khata-muted">
        We will use these details only to respond to your KhataOne demo request.
      </p>
    </form>
  );
}
