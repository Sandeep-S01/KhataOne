"use client";

import { useActionState, useCallback, useEffect, useState } from "react";

import {
  updateFirmProfileAction,
  type FirmProfileActionState,
} from "@/app/actions/firm-profile";
import {
  Button,
  DetailList,
  FieldError,
  FieldLabel,
  FormActions,
  FormMessage,
  Input,
  SectionCard,
  Textarea,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";

type FirmProfile = {
  name: string;
  gstin: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
};

const initialState: FirmProfileActionState = { status: "idle", message: "" };

function FirmProfileEditor({
  profile,
  onCancel,
  onSaved,
}: {
  profile: FirmProfile;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateFirmProfileAction, initialState);

  useEffect(() => {
    if (state.status === "success") onSaved();
  }, [state.status, onSaved]);

  const errorId = (field: string) =>
    state.fieldErrors?.[field] ? `firm-profile-${field}-error` : undefined;

  return (
    <form action={formAction} className="grid gap-4">
      <label className="block">
        <FieldLabel>Firm name</FieldLabel>
        <Input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          defaultValue={profile.name}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={errorId("name")}
          className="mt-2"
        />
        <FieldError id={errorId("name")} message={state.fieldErrors?.name} />
      </label>
      <label className="block">
        <FieldLabel>Phone</FieldLabel>
        <Input
          name="phone"
          type="tel"
          maxLength={24}
          defaultValue={profile.phone ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.phone)}
          aria-describedby={errorId("phone")}
          className="mt-2"
        />
        <FieldError id={errorId("phone")} message={state.fieldErrors?.phone} />
      </label>
      <label className="block">
        <FieldLabel>Email</FieldLabel>
        <Input
          name="email"
          type="email"
          maxLength={254}
          defaultValue={profile.email ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={errorId("email")}
          className="mt-2"
        />
        <FieldError id={errorId("email")} message={state.fieldErrors?.email} />
      </label>
      <label className="block">
        <FieldLabel>Address</FieldLabel>
        <Textarea
          name="address"
          maxLength={500}
          rows={3}
          defaultValue={profile.address ?? ""}
          aria-invalid={Boolean(state.fieldErrors?.address)}
          aria-describedby={errorId("address")}
          className="mt-2"
        />
        <FieldError id={errorId("address")} message={state.fieldErrors?.address} />
      </label>
      <p className="text-xs text-khata-muted">GSTIN and workspace status cannot be changed here.</p>
      <FormMessage message={state.status === "error" ? state.message : ""} />
      <FormActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}

export function FirmProfileSection({
  profile,
  canEdit,
}: {
  profile: FirmProfile;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const onSaved = useCallback(() => {
    setEditing(false);
    setSaved(true);
  }, []);

  return (
    <SectionCard
      title="Firm profile"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone={profile.status === "active" ? "success" : "warning"}>
            {profile.status}
          </StatusChip>
          {canEdit && !editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              Edit profile
            </Button>
          )}
        </div>
      }
    >
      {editing ? (
        <FirmProfileEditor
          profile={profile}
          onCancel={() => setEditing(false)}
          onSaved={onSaved}
        />
      ) : (
        <div className="grid gap-3">
          <FormMessage message={saved ? "Firm profile saved." : ""} tone="success" />
          <DetailList
            labelWidth="100px"
            items={[
              { label: "Name", value: profile.name },
              { label: "GSTIN", value: profile.gstin ?? "Not provided", mono: true },
              { label: "Phone", value: profile.phone ?? "Not provided" },
              { label: "Email", value: profile.email ?? "Not provided" },
              { label: "Address", value: profile.address ?? "Not provided" },
            ]}
          />
        </div>
      )}
    </SectionCard>
  );
}
