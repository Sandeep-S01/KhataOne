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
      className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#00964f] px-6 text-lg font-semibold text-white shadow-[0_14px_30px_rgba(0,150,79,0.2)] transition hover:bg-[#007d43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green disabled:cursor-not-allowed disabled:opacity-70"
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
      className="rounded-[28px] border border-[#dedbd2] bg-white p-6 shadow-[0_22px_58px_rgba(17,21,25,0.1)] sm:p-8"
    >
      <div className="mb-6">
        <p className="text-2xl font-semibold tracking-[-0.02em] text-[#05070a]">
          Book a KhataOne demo
        </p>
        <p className="mt-3 text-base leading-7 text-[#626a70]">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#626a70]">
            Name
          </span>
          <input
            name="full_name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(state.fieldErrors?.full_name)}
            className="mt-2 h-[52px] min-h-[52px] w-full rounded-2xl border border-[#dedbd2] bg-[#fafaf7] px-4 text-base outline-none transition placeholder:text-[#626a70]/60 focus:border-[#00964f] focus:bg-white focus:ring-4 focus:ring-[#00964f]/10"
          />
          <FieldError message={state.fieldErrors?.full_name} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#626a70]">
            Firm
          </span>
          <input
            name="firm_name"
            type="text"
            autoComplete="organization"
            aria-invalid={Boolean(state.fieldErrors?.firm_name)}
            className="mt-2 h-[52px] min-h-[52px] w-full rounded-2xl border border-[#dedbd2] bg-[#fafaf7] px-4 text-base outline-none transition placeholder:text-[#626a70]/60 focus:border-[#00964f] focus:bg-white focus:ring-4 focus:ring-[#00964f]/10"
          />
          <FieldError message={state.fieldErrors?.firm_name} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#626a70]">
            Work email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className="mt-2 h-[52px] min-h-[52px] w-full rounded-2xl border border-[#dedbd2] bg-[#fafaf7] px-4 text-base outline-none transition placeholder:text-[#626a70]/60 focus:border-[#00964f] focus:bg-white focus:ring-4 focus:ring-[#00964f]/10"
          />
          <FieldError message={state.fieldErrors?.email} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#626a70]">
            WhatsApp / phone
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            className="mt-2 h-[52px] min-h-[52px] w-full rounded-2xl border border-[#dedbd2] bg-[#fafaf7] px-4 text-base outline-none transition placeholder:text-[#626a70]/60 focus:border-[#00964f] focus:bg-white focus:ring-4 focus:ring-[#00964f]/10"
          />
          <FieldError message={state.fieldErrors?.phone} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#626a70]">
            Firm size
          </span>
          <select
            name="firm_size"
            className="mt-2 h-[52px] min-h-[52px] w-full rounded-2xl border border-[#dedbd2] bg-[#fafaf7] px-4 text-base outline-none transition focus:border-[#00964f] focus:bg-white focus:ring-4 focus:ring-[#00964f]/10"
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
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#626a70]">
            Request type
          </span>
          <select
            name="intent"
            aria-invalid={Boolean(state.fieldErrors?.intent)}
            className="mt-2 h-[52px] min-h-[52px] w-full rounded-2xl border border-[#dedbd2] bg-[#fafaf7] px-4 text-base outline-none transition focus:border-[#00964f] focus:bg-white focus:ring-4 focus:ring-[#00964f]/10"
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
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#626a70]">
          Current workflow
        </span>
        <textarea
          name="message"
          rows={4}
          className="mt-2 w-full resize-none rounded-2xl border border-[#dedbd2] bg-[#fafaf7] px-4 py-4 text-base outline-none transition placeholder:text-[#626a70]/60 focus:border-[#00964f] focus:bg-white focus:ring-4 focus:ring-[#00964f]/10"
          placeholder="Example: 80 clients, GST monthly, clients send bills on WhatsApp."
        />
      </label>

      {state.message && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
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
      <p className="mt-4 text-sm leading-6 text-[#626a70]">
        We will use these details only to respond to your KhataOne demo request.
      </p>
    </form>
  );
}
