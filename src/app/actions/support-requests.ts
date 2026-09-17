"use server";

import { revalidatePath } from "next/cache";

import { getFirmContext } from "@/lib/firms";
import { checkRateLimit, clientRateLimitKey } from "@/lib/rate-limit";
import { supportCategories } from "@/lib/support-requests";

export type SupportRequestState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

function valueOf(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitSupportRequest(
  _previousState: SupportRequestState,
  formData: FormData,
): Promise<SupportRequestState> {
  const context = await getFirmContext();
  if (!context) {
    return { status: "error", message: "Sign in to a firm workspace to send a request." };
  }

  const category = valueOf(formData, "category");
  const subject = valueOf(formData, "subject");
  const description = valueOf(formData, "description");
  const fieldErrors: Record<string, string> = {};

  if (!supportCategories.some((item) => item.value === category)) {
    fieldErrors.category = "Choose an issue type.";
  }
  if (subject.length < 5 || subject.length > 120) {
    fieldErrors.subject = "Use 5 to 120 characters for the subject.";
  }
  if (description.length < 20 || description.length > 4000) {
    fieldErrors.description = "Describe the issue in 20 to 4,000 characters.";
  }
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  const rateLimit = await checkRateLimit({
    key: clientRateLimitKey({
      scope: "support-request",
      forwardedFor: null,
      realIp: null,
      fallback: context.userId,
    }),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.available || !rateLimit.ok) {
    return {
      status: "error",
      message: rateLimit.available
        ? "Too many requests. Please try again later."
        : "Request protection is temporarily unavailable. Please try again.",
    };
  }

  const { error } = await context.supabase.from("support_requests").insert({
    firm_id: context.firm.id,
    created_by: context.userId,
    category,
    subject,
    description,
  });
  if (error) {
    return {
      status: "error",
      message: "We could not save your request. Please try again later.",
    };
  }

  revalidatePath("/dashboard/help");
  return { status: "success", message: "Your request was saved. You can track it below." };
}
