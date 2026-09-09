"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";

import {
  submitLeadRequest,
  type LeadRequestState,
} from "@/app/actions/lead-request";
import {
  Button,
  FieldError,
  FieldLabel,
  FormMessage,
  Input,
  Select,
  Textarea,
} from "@/components/design-system";

const initialState: LeadRequestState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full"
    >
      {pending && (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {pending ? "Sending request..." : "Request demo"}
      {!pending && <ArrowRight className="ml-2 h-4 w-4" />}
    </Button>
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
          <Input
            name="full_name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={Boolean(state.fieldErrors?.full_name)}
            aria-describedby={state.fieldErrors?.full_name ? "full-name-error" : undefined}
            className="mt-1.5"
          />
          <FieldError id="full-name-error" message={state.fieldErrors?.full_name} />
        </label>

        <label className="block">
          <FieldLabel>Firm</FieldLabel>
          <Input
            name="firm_name"
            type="text"
            autoComplete="organization"
            required
            aria-invalid={Boolean(state.fieldErrors?.firm_name)}
            aria-describedby={state.fieldErrors?.firm_name ? "firm-name-error" : undefined}
            className="mt-1.5"
          />
          <FieldError id="firm-name-error" message={state.fieldErrors?.firm_name} />
        </label>

        <label className="block">
          <FieldLabel>Work email</FieldLabel>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "lead-email-error" : undefined}
            className="mt-1.5"
          />
          <FieldError id="lead-email-error" message={state.fieldErrors?.email} />
        </label>

        <label className="block">
          <FieldLabel>WhatsApp / phone</FieldLabel>
          <Input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            aria-describedby={state.fieldErrors?.phone ? "lead-phone-error" : undefined}
            className="mt-1.5"
          />
          <FieldError id="lead-phone-error" message={state.fieldErrors?.phone} />
        </label>

        <label className="block">
          <FieldLabel>Firm size</FieldLabel>
          <Select
            name="firm_size"
            className="mt-1.5"
            defaultValue=""
          >
            <option value="">Select</option>
            <option value="solo">Solo practice</option>
            <option value="2-5">2-5 team members</option>
            <option value="6-20">6-20 team members</option>
            <option value="20+">20+ team members</option>
          </Select>
        </label>

        <label className="block">
          <FieldLabel>Request type</FieldLabel>
          <Select
            name="intent"
            aria-invalid={Boolean(state.fieldErrors?.intent)}
            aria-describedby={state.fieldErrors?.intent ? "lead-intent-error" : undefined}
            className="mt-1.5"
            defaultValue="demo"
            required
          >
            <option value="demo">Book demo</option>
            <option value="waitlist">Join waitlist</option>
            <option value="signup">Start signup</option>
          </Select>
          <FieldError id="lead-intent-error" message={state.fieldErrors?.intent} />
        </label>
      </div>

      <label className="mt-3 block">
        <FieldLabel>Current workflow</FieldLabel>
        <Textarea
          name="message"
          rows={4}
          className="mt-1.5"
          placeholder="Example: 80 clients, GST monthly, clients send bills on WhatsApp."
        />
      </label>

      {state.message && (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "danger"}
          className="mt-4"
        />
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
