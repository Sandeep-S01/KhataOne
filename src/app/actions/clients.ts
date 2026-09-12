"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

export type ClientActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value.length > 0 ? value : null;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function collectClientInput(formData: FormData) {
  const businessName = readString(formData, "business_name");
  const contactName = readString(formData, "contact_name");
  const phone = normalizePhone(readString(formData, "phone"));
  const whatsappPhone = normalizePhone(readString(formData, "whatsapp_phone"));
  const email = readString(formData, "email");
  const gstin = readString(formData, "gstin").toUpperCase();
  const stateCode = readString(formData, "state_code").toUpperCase();
  const filingFrequency = readString(formData, "filing_frequency") || "monthly";
  const status = readString(formData, "status") || "onboarding";

  return {
    businessName,
    contactName,
    phone,
    whatsappPhone,
    email,
    gstin,
    stateCode,
    filingFrequency,
    status,
  };
}

function validateClientInput(input: ReturnType<typeof collectClientInput>) {
  const fieldErrors: Record<string, string> = {};
  const allowedFiling = ["monthly", "quarterly", "annual", "unknown"];
  const allowedStatus = [
    "onboarding",
    "active",
    "pending_documents",
    "review_needed",
    "filing_ready",
    "archived",
  ];

  if (input.businessName.length < 2) {
    fieldErrors.business_name = "Enter the business name.";
  }

  if (input.email && !isEmail(input.email)) {
    fieldErrors.email = "Enter a valid email.";
  }

  if (input.phone && input.phone.length < 8) {
    fieldErrors.phone = "Enter a valid phone number.";
  }

  if (input.whatsappPhone && input.whatsappPhone.length < 8) {
    fieldErrors.whatsapp_phone = "Enter a valid WhatsApp number.";
  }

  if (input.gstin && input.gstin.length !== 15) {
    fieldErrors.gstin = "GSTIN should be 15 characters.";
  }

  if (input.stateCode && input.stateCode.length !== 2) {
    fieldErrors.state_code = "Use a two-digit state code.";
  }

  if (!allowedFiling.includes(input.filingFrequency)) {
    fieldErrors.filing_frequency = "Choose a valid filing frequency.";
  }

  if (!allowedStatus.includes(input.status)) {
    fieldErrors.status = "Choose a valid status.";
  }

  return fieldErrors;
}

function canManageClients(role: string) {
  return ["owner", "admin", "staff"].includes(role);
}

function clientRpcInput(firmId: string, input: ReturnType<typeof collectClientInput>) {
  return {
    target_firm_id: firmId,
    target_business_name: input.businessName,
    target_contact_name: optional(input.contactName),
    target_phone: optional(input.phone),
    target_whatsapp_phone: optional(input.whatsappPhone),
    target_email: optional(input.email),
    target_gstin: optional(input.gstin),
    target_state_code: optional(input.stateCode),
    target_filing_frequency: input.filingFrequency,
    target_status: input.status,
  };
}

export async function createClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const input = collectClientInput(formData);
  const fieldErrors = validateClientInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      status: "error",
      message:
        "Supabase is not configured yet. Add environment variables before creating clients.",
    };
  }

  const context = await getFirmContext();

  if (!context) {
    return {
      status: "error",
      message: "Create a firm workspace before adding clients.",
    };
  }

  const { firm, supabase } = context;
  if (!canManageClients(firm.role)) {
    return { status: "error", message: "Your workspace role cannot create clients." };
  }
  const { data: clientId, error } = await supabase.rpc(
    "create_dashboard_client",
    clientRpcInput(firm.id, input),
  );

  if (error || typeof clientId !== "string" || !clientId) {
    return {
      status: "error",
      message: "Could not create client. Please retry or contact your workspace administrator.",
    };
  }
  redirect(`/dashboard/clients/${clientId}` as Route);
}

export async function updateClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const clientId = readString(formData, "client_id");
  const input = collectClientInput(formData);
  const fieldErrors = validateClientInput(input);

  if (!clientId) {
    fieldErrors.client_id = "Missing client id.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      status: "error",
      message:
        "Supabase is not configured yet. Add environment variables before updating clients.",
    };
  }

  const context = await getFirmContext();

  if (!context) {
    return {
      status: "error",
      message: "Create a firm workspace before updating clients.",
    };
  }

  const { firm, supabase } = context;
  if (!canManageClients(firm.role)) {
    return { status: "error", message: "Your workspace role cannot update clients." };
  }
  const { data: updatedClientId, error } = await supabase.rpc(
    "update_dashboard_client",
    { ...clientRpcInput(firm.id, input), target_client_id: clientId },
  );

  if (error || typeof updatedClientId !== "string" || !updatedClientId) {
    return {
      status: "error",
      message: "Could not update client. Please retry or contact your workspace administrator.",
    };
  }
  redirect(`/dashboard/clients/${updatedClientId}` as Route);
}

export async function archiveClientAction(formData: FormData) {
  const clientId = readString(formData, "client_id");

  if (!clientId || !hasSupabaseConfig()) {
    redirect("/dashboard/clients");
  }

  const context = await getFirmContext();

  if (!context) {
    redirect("/dashboard/clients");
  }

  const { firm, supabase } = context;
  if (!canManageClients(firm.role)) {
    redirect("/dashboard/clients?error=forbidden");
  }
  await supabase.rpc("archive_dashboard_client", {
    target_firm_id: firm.id,
    target_client_id: clientId,
  });

  redirect("/dashboard/clients");
}
