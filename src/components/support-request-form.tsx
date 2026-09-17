"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Send } from "lucide-react";

import { submitSupportRequest, type SupportRequestState } from "@/app/actions/support-requests";
import {
  Button,
  FieldError,
  FieldLabel,
  FormMessage,
  Input,
  Select,
  Textarea,
  functionalIconClassName,
  functionalIconStrokeWidth,
} from "@/components/design-system";
import { supportCategories } from "@/lib/support-requests";

const initialState: SupportRequestState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <LoaderCircle className={`${functionalIconClassName} animate-spin`} strokeWidth={functionalIconStrokeWidth} aria-hidden="true" />
      ) : (
        <Send className={functionalIconClassName} strokeWidth={functionalIconStrokeWidth} aria-hidden="true" />
      )}
      {pending ? "Sending request..." : "Submit request"}
    </Button>
  );
}

export function SupportRequestForm() {
  const [state, formAction] = useActionState(submitSupportRequest, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <FieldLabel>Issue type</FieldLabel>
        <Select name="category" defaultValue="" required className="mt-1.5" aria-invalid={Boolean(state.fieldErrors?.category)} aria-describedby={state.fieldErrors?.category ? "support-category-error" : undefined}>
          <option value="" disabled>Select an issue type</option>
          {supportCategories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <FieldError id="support-category-error" message={state.fieldErrors?.category} />
      </label>

      <label className="block">
        <FieldLabel>Subject</FieldLabel>
        <Input name="subject" required minLength={5} maxLength={120} className="mt-1.5" placeholder="Briefly describe the problem" aria-invalid={Boolean(state.fieldErrors?.subject)} aria-describedby={state.fieldErrors?.subject ? "support-subject-error" : undefined} />
        <FieldError id="support-subject-error" message={state.fieldErrors?.subject} />
      </label>

      <label className="block">
        <FieldLabel>What happened?</FieldLabel>
        <Textarea name="description" required minLength={20} maxLength={4000} rows={6} className="mt-1.5" placeholder="Tell us what you were doing, what you expected, and what happened instead. Avoid passwords and sensitive client data." aria-invalid={Boolean(state.fieldErrors?.description)} aria-describedby={state.fieldErrors?.description ? "support-description-error" : undefined} />
        <FieldError id="support-description-error" message={state.fieldErrors?.description} />
      </label>

      {state.message && <FormMessage message={state.message} tone={state.status === "success" ? "success" : "danger"} />}
      <div className="flex flex-col gap-3 border-t border-khata-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-khata-muted">Do not include passwords or private financial documents.</p>
        <SubmitButton />
      </div>
    </form>
  );
}
