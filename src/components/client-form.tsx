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

export function ClientForm({
  client,
  returnContext = "",
}: {
  client?: ClientFormValues;
  returnContext?: string;
}) {
  const isEditing = Boolean(client?.id);
  const [state, formAction, pending] = useActionState(
    isEditing ? updateClientAction : createClientAction,
    initialState,
  );

  const errorId = (name: string) =>
    state.fieldErrors?.[name] ? `client-${name.replaceAll("_", "-")}-error` : undefined;

  return (
    <form
      action={formAction}
      className="k-card p-5"
    >
      {client?.id && <input type="hidden" name="client_id" value={client.id} />}
      {returnContext && (
        <input type="hidden" name="return_context" value={returnContext} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <FieldLabel>
            Business name
          </FieldLabel>
          <Input
            name="business_name"
            aria-invalid={Boolean(state.fieldErrors?.business_name)}
            aria-describedby={errorId("business_name")}
            type="text"
            defaultValue={client?.business_name ?? ""}
            className="mt-2"
          />
          <FieldError id={errorId("business_name")} message={state.fieldErrors?.business_name} />
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
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            aria-describedby={errorId("phone")}
            type="tel"
            defaultValue={client?.phone ?? ""}
            className="mt-2"
          />
          <FieldError id={errorId("phone")} message={state.fieldErrors?.phone} />
        </label>

        <label className="block">
          <FieldLabel>
            WhatsApp phone
          </FieldLabel>
          <Input
            name="whatsapp_phone"
            aria-invalid={Boolean(state.fieldErrors?.whatsapp_phone)}
            aria-describedby={errorId("whatsapp_phone")}
            type="tel"
            defaultValue={client?.whatsapp_phone ?? ""}
            className="mt-2"
          />
          <FieldError id={errorId("whatsapp_phone")} message={state.fieldErrors?.whatsapp_phone} />
        </label>

        <label className="block">
          <FieldLabel>
            Email
          </FieldLabel>
          <Input
            name="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={errorId("email")}
            type="email"
            defaultValue={client?.email ?? ""}
            className="mt-2"
          />
          <FieldError id={errorId("email")} message={state.fieldErrors?.email} />
        </label>

        <label className="block">
          <FieldLabel>
            GSTIN
          </FieldLabel>
          <Input
            name="gstin"
            aria-invalid={Boolean(state.fieldErrors?.gstin)}
            aria-describedby={errorId("gstin")}
            type="text"
            defaultValue={client?.gstin ?? ""}
            className="num mt-2 uppercase"
          />
          <FieldError id={errorId("gstin")} message={state.fieldErrors?.gstin} />
        </label>

        <label className="block">
          <FieldLabel>
            State code
          </FieldLabel>
          <Input
            name="state_code"
            aria-invalid={Boolean(state.fieldErrors?.state_code)}
            aria-describedby={errorId("state_code")}
            type="text"
            defaultValue={client?.state_code ?? ""}
            className="num mt-2 uppercase"
          />
          <FieldError id={errorId("state_code")} message={state.fieldErrors?.state_code} />
        </label>

        <label className="block">
          <FieldLabel>
            Filing frequency
          </FieldLabel>
          <Select
            name="filing_frequency"
            aria-invalid={Boolean(state.fieldErrors?.filing_frequency)}
            aria-describedby={errorId("filing_frequency")}
            defaultValue={client?.filing_frequency ?? "monthly"}
            className="mt-2"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="unknown">Unknown</option>
          </Select>
          <FieldError id={errorId("filing_frequency")} message={state.fieldErrors?.filing_frequency} />
        </label>

        <label className="block">
          <FieldLabel>
            Status
          </FieldLabel>
          <Select
            name="status"
            aria-invalid={Boolean(state.fieldErrors?.status)}
            aria-describedby={errorId("status")}
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
          <FieldError id={errorId("status")} message={state.fieldErrors?.status} />
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
