"use server";

import { revalidatePath } from "next/cache";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { canManageFirmMembers } from "@/lib/permissions";

export type MemberActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateFirmMemberAction(
  _previousState: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const membershipId = formData.get("membership_id");
  const role = formData.get("role");
  const status = formData.get("status");
  if (typeof membershipId !== "string" || !uuidPattern.test(membershipId)
    || typeof role !== "string" || !["admin", "staff", "viewer"].includes(role)
    || typeof status !== "string" || !["active", "disabled"].includes(status)) {
    return { status: "error", message: "Choose a valid role and access state." };
  }
  if (!hasSupabaseConfig()) {
    return { status: "error", message: "Your workspace is temporarily unavailable. Please try again later." };
  }

  const context = await getFirmContext();
  if (!context || !canManageFirmMembers(context.firm.role)) {
    return { status: "error", message: "Only firm owners and admins can manage team access." };
  }

  const { data, error } = await context.supabase.rpc("update_firm_member", {
    target_firm_id: context.firm.id,
    target_membership_id: membershipId,
    target_role: role,
    target_status: status,
  });
  if (error || data !== membershipId) {
    return { status: "error", message: "Could not update team access. Refresh and try again." };
  }

  revalidatePath("/dashboard", "layout");
  return { status: "success", message: "Team access updated." };
}
