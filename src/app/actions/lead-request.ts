"use server";

import { headers } from "next/headers";

import {
  checkRateLimit,
  clientRateLimitKey,
} from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

export type LeadRequestState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

const initialFieldErrors: Record<string, string> = {};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeOptional(value: string) {
  return value.length > 0 ? value : null;
}

export async function submitLeadRequest(
  _previousState: LeadRequestState,
  formData: FormData,
): Promise<LeadRequestState> {
  const honeypot = readString(formData, "website");

  if (honeypot) {
    return {
      status: "success",
      message: "Thanks. We received your request.",
    };
  }

  const fullName = readString(formData, "full_name");
  const firmName = readString(formData, "firm_name");
  const email = readString(formData, "email");
  const phone = readString(formData, "phone");
  const firmSize = readString(formData, "firm_size");
  const intent = readString(formData, "intent") || "demo";
  const message = readString(formData, "message");
  const fieldErrors = { ...initialFieldErrors };
  const headerStore = await headers();
  const rateLimit = checkRateLimit({
    key: clientRateLimitKey({
      scope: "lead-request",
      forwardedFor: headerStore.get("x-forwarded-for"),
      realIp: headerStore.get("x-real-ip"),
      fallback: email || "anonymous",
    }),
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return {
      status: "error",
      message: "Too many requests. Please try again later.",
    };
  }

  if (fullName.length < 2) {
    fieldErrors.full_name = "Enter your name.";
  }

  if (firmName.length < 2) {
    fieldErrors.firm_name = "Enter your firm name.";
  }

  if (!isEmail(email)) {
    fieldErrors.email = "Enter a valid work email.";
  }

  if (phone.length < 8) {
    fieldErrors.phone = "Enter a valid phone or WhatsApp number.";
  }

  if (!["demo", "waitlist", "signup"].includes(intent)) {
    fieldErrors.intent = "Choose a valid request type.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "The request form is ready, but Supabase persistence is not configured yet. Add Supabase environment variables to store submissions.",
    };
  }

  const userAgent = headerStore.get("user-agent");

  const { error } = await supabase.from("lead_requests").insert({
    full_name: fullName,
    firm_name: firmName,
    email,
    phone,
    firm_size: sanitizeOptional(firmSize),
    intent,
    message: sanitizeOptional(message),
    source: "landing_page",
    user_agent: sanitizeOptional(userAgent ?? ""),
  });

  if (error) {
    return {
      status: "error",
      message:
        "We could not save the request. Please try again after the database migration is applied.",
    };
  }

  return {
    status: "success",
    message: "Thanks. We received your request and will follow up soon.",
  };
}
