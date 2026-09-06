"use client";

import { useActionState } from "react";

import {
  createClientAction,
  updateClientAction,
  type ClientActionState,
} from "@/app/actions/clients";
import {
  Button,
  FieldError,
  FieldLabel,
  FormActions,
  FormMessage,
  Input,
  Select,
} from "@/components/design-system";

const initialState: ClientActionState = {
  status: "idle",
  message: "",
};

export type ClientFormValues = {
  id?: string;
  business_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  whatsapp_phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  state_code?: string | null;
  filing_frequency?: string | null;
  status?: string | null;
};

export function ClientForm({ client }: { client?: ClientFormValues }) {
  const isEditing = Boolean(client?.id);
  const [state, formAction, pending] = useActionState(
    isEditing ? updateClientAction : createClientAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="k-card p-5"
    >
      {client?.id && <input type="hidden" name="client_id" value={client.id} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <FieldLabel>
            Business name
          </FieldLabel>
          <Input
            name="business_name"
            type="text"
            defaultValue={client?.business_name ?? ""}
            className="mt-2"
          />
          <FieldError message={state.fieldErrors?.business_name} />
        </label>

        <label className="block">
          <FieldLabel>
            Contact name
          </FieldLabel>
          <Input
            name="contact_name"
            type="text"
            defaultValue={client?.contact_name ?? ""}
            className="mt-2"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Phone
          </FieldLabel>
          <Input
            name="phone"
            type="tel"
            defaultValue={client?.phone ?? ""}
            className="mt-2"
          />
          <FieldError message={state.fieldErrors?.phone} />
        </label>

        <label className="block">
          <FieldLabel>
            WhatsApp phone
          </FieldLabel>
          <Input
            name="whatsapp_phone"
            type="tel"
            defaultValue={client?.whatsapp_phone ?? ""}
            className="mt-2"
          />
          <FieldError message={state.fieldErrors?.whatsapp_phone} />
        </label>

        <label className="block">
          <FieldLabel>
            Email
          </FieldLabel>
          <Input
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            className="mt-2"
          />
          <FieldError message={state.fieldErrors?.email} />
        </label>

        <label className="block">
          <FieldLabel>
            GSTIN
          </FieldLabel>
          <Input
            name="gstin"
            type="text"
            defaultValue={client?.gstin ?? ""}
            className="num mt-2 uppercase"
          />
          <FieldError message={state.fieldErrors?.gstin} />
        </label>

        <label className="block">
          <FieldLabel>
            State code
          </FieldLabel>
          <Input
            name="state_code"
            type="text"
            defaultValue={client?.state_code ?? ""}
            className="num mt-2 uppercase"
          />
          <FieldError message={state.fieldErrors?.state_code} />
        </label>

        <label className="block">
          <FieldLabel>
            Filing frequency
          </FieldLabel>
          <Select
            name="filing_frequency"
            defaultValue={client?.filing_frequency ?? "monthly"}
            className="mt-2"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="unknown">Unknown</option>
          </Select>
          <FieldError message={state.fieldErrors?.filing_frequency} />
        </label>

        <label className="block">
          <FieldLabel>
            Status
          </FieldLabel>
          <Select
            name="status"
            defaultValue={client?.status ?? "onboarding"}
            className="mt-2"
          >
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="pending_documents">Pending documents</option>
            <option value="review_needed">Review needed</option>
            <option value="filing_ready">Filing ready</option>
            <option value="archived">Archived</option>
          </Select>
          <FieldError message={state.fieldErrors?.status} />
        </label>
      </div>

      <FormMessage message={state.message} className="mt-4" />

      <FormActions>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Saving..."
            : isEditing
              ? "Save client"
              : "Create client"}
        </Button>
      </FormActions>
    </form>
  );
}
