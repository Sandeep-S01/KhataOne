"use server";

import { revalidatePath } from "next/cache";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { canManageFirmProfile } from "@/lib/permissions";

export type FirmProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateFirmProfileAction(
  _previousState: FirmProfileActionState,
  formData: FormData,
): Promise<FirmProfileActionState> {
  const name = readString(formData, "name");
  const rawPhone = readString(formData, "phone");
  const phone = rawPhone.replace(/[\s()-]/g, "");
  const email = readString(formData, "email");
  const address = readString(formData, "address");
  const fieldErrors: Record<string, string> = {};

  if (name.length < 2 || name.length > 120) {
    fieldErrors.name = "Enter a firm name between 2 and 120 characters.";
  }
  if (phone && !/^\+?[0-9]{8,15}$/.test(phone)) {
    fieldErrors.phone = "Enter a phone number with 8 to 15 digits.";
  }
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (address.length > 500) {
    fieldErrors.address = "Keep the address under 500 characters.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  if (!hasSupabaseConfig()) {
    return { status: "error", message: "Your workspace is temporarily unavailable. Please try again later." };
  }
  const context = await getFirmContext();
  if (!context) {
    return { status: "error", message: "Your firm workspace could not be found." };
  }
  if (!canManageFirmProfile(context.firm.role)) {
    return { status: "error", message: "Only firm owners and admins can edit this profile." };
  }

  const { data, error } = await context.supabase.rpc("update_firm_profile", {
    target_firm_id: context.firm.id,
    target_name: name,
    target_phone: phone || null,
    target_email: email || null,
    target_address: address || null,
  });
  if (error || data !== context.firm.id) {
    return { status: "error", message: "Could not save the firm profile. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
  return { status: "success", message: "Firm profile saved." };
}
