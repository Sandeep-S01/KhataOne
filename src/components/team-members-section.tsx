"use client";

import { useActionState, useCallback, useEffect, useState } from "react";

import {
  updateFirmMemberAction,
  type MemberActionState,
} from "@/app/actions/firm-members";
import {
  Button,
  FieldLabel,
  FormActions,
  FormMessage,
  SectionCard,
  Select,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";

export type TeamMember = {
  membership_id: string;
  user_id: string;
  email: string | null;
  role: string;
  status: string;
  joined_at: string;
};

const initialState: MemberActionState = { status: "idle", message: "" };

function MemberEditor({
  member,
  actorRole,
  onCancel,
  onSaved,
}: {
  member: TeamMember;
  actorRole: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateFirmMemberAction, initialState);

  useEffect(() => {
    if (state.status === "success") onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="mt-4 border-t border-khata-border pt-4">
      <input type="hidden" name="membership_id" value={member.membership_id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <FieldLabel>Role</FieldLabel>
          <Select name="role" defaultValue={member.role} disabled={pending} className="mt-2">
            {actorRole === "owner" && <option value="admin">Admin</option>}
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </Select>
        </label>
        <label className="block">
          <FieldLabel>Access</FieldLabel>
          <Select name="status" defaultValue={member.status} disabled={pending} className="mt-2">
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
        </label>
      </div>
      <p className="mt-3 text-xs text-khata-muted">
        Disabled members lose access to this firm until their access is restored.
      </p>
      <FormMessage message={state.status === "error" ? state.message : ""} className="mt-3" />
      <FormActions>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save access"}
        </Button>
      </FormActions>
    </form>
  );
}

function MemberRow({
  member,
  actorRole,
  currentUserId,
}: {
  member: TeamMember;
  actorRole: string;
  currentUserId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const isCurrentUser = member.user_id === currentUserId;
  const canEdit = !isCurrentUser && member.role !== "owner"
    && member.status !== "invited"
    && (actorRole === "owner" || member.role !== "admin");
  const memberLabel = member.email || "Member account";
  const onSaved = useCallback(() => {
    setEditing(false);
    setSaved(true);
  }, []);

  return (
    <li className="border-t border-khata-border px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all text-sm font-medium text-khata-ink">{memberLabel}</p>
          {isCurrentUser && <p className="text-xs text-khata-muted">Your account</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip>{member.role}</StatusChip>
          <StatusChip tone={member.status === "active" ? "success" : "warning"}>
            {member.status}
          </StatusChip>
          {canEdit && !editing && (
            <Button
              variant="outline"
              size="sm"
              aria-label={`Manage access for ${memberLabel}`}
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              Manage
            </Button>
          )}
        </div>
      </div>
      {saved && !editing && (
        <FormMessage message="Team access updated." tone="success" className="mt-3" />
      )}
      {editing && (
        <MemberEditor
          member={member}
          actorRole={actorRole}
          onCancel={() => setEditing(false)}
          onSaved={onSaved}
        />
      )}
    </li>
  );
}

export function TeamMembersSection({
  members,
  actorRole,
  currentUserId,
}: {
  members: TeamMember[];
  actorRole: string;
  currentUserId: string;
}) {
  return (
    <SectionCard
      title="Team access"
      description="Review who can use this firm workspace and manage existing members."
      bodyClassName="p-0"
    >
      {members.length > 0 ? (
        <ul>
          {members.map((member) => (
            <MemberRow
              key={member.membership_id}
              member={member}
              actorRole={actorRole}
              currentUserId={currentUserId}
            />
          ))}
        </ul>
      ) : (
        <p className="p-4 text-sm text-khata-muted">No team members are available.</p>
      )}
    </SectionCard>
  );
}
