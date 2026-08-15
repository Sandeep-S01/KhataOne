"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext, type FirmContext } from "@/lib/firms";

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

async function writeAuditLog({
  supabase,
  firmId,
  clientId,
  actorUserId,
  action,
  entityId,
  beforeData,
  afterData,
}: {
  supabase: FirmContext["supabase"];
  firmId: string;
  clientId?: string | null;
  actorUserId: string | null;
  action: string;
  entityId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
}) {
  await supabase.from("audit_logs").insert({
    firm_id: firmId,
    client_id: clientId ?? null,
    actor_user_id: actorUserId,
    action,
    entity_type: "client",
    entity_id: entityId ?? null,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
    metadata: { source: "dashboard" },
  });
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

  const { firm, supabase, userId: actorUserId } = context;
  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      firm_id: firm.id,
      business_name: input.businessName,
      contact_name: optional(input.contactName),
      phone: optional(input.phone),
      whatsapp_phone: optional(input.whatsappPhone),
      email: optional(input.email),
      gstin: optional(input.gstin),
      state_code: optional(input.stateCode),
      filing_frequency: input.filingFrequency,
      status: input.status,
    })
    .select("*")
    .single();

  if (error || !client) {
    return {
      status: "error",
      message: error?.message ?? "Could not create client.",
    };
  }

  await writeAuditLog({
    supabase,
    firmId: firm.id,
    clientId: client.id,
    actorUserId,
    action: "client.created",
    entityId: client.id,
    afterData: client,
  });

  redirect(`/dashboard/clients/${client.id}` as Route);
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

  const { firm, supabase, userId: actorUserId } = context;
  const { data: beforeData } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("firm_id", firm.id)
    .single();

  const { data: client, error } = await supabase
    .from("clients")
    .update({
      business_name: input.businessName,
      contact_name: optional(input.contactName),
      phone: optional(input.phone),
      whatsapp_phone: optional(input.whatsappPhone),
      email: optional(input.email),
      gstin: optional(input.gstin),
      state_code: optional(input.stateCode),
      filing_frequency: input.filingFrequency,
      status: input.status,
    })
    .eq("id", clientId)
    .eq("firm_id", firm.id)
    .select("*")
    .single();

  if (error || !client) {
    return {
      status: "error",
      message: error?.message ?? "Could not update client.",
    };
  }

  await writeAuditLog({
    supabase,
    firmId: firm.id,
    clientId: client.id,
    actorUserId,
    action: "client.updated",
    entityId: client.id,
    beforeData,
    afterData: client,
  });

  redirect(`/dashboard/clients/${client.id}` as Route);
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

  const { firm, supabase, userId: actorUserId } = context;
  const { data: beforeData } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("firm_id", firm.id)
    .single();

  const { data: client } = await supabase
    .from("clients")
    .update({ status: "archived" })
    .eq("id", clientId)
    .eq("firm_id", firm.id)
    .select("*")
    .single();

  if (client) {
    await writeAuditLog({
      supabase,
      firmId: firm.id,
      clientId: client.id,
      actorUserId,
      action: "client.archived",
      entityId: client.id,
      beforeData,
      afterData: client,
    });
  }

  redirect("/dashboard/clients");
}
