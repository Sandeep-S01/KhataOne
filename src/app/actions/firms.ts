"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

import { isInvalidSession } from "@/lib/auth-deadline";
import { ACTIVE_FIRM_COOKIE } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export async function switchFirm(formData: FormData) {
  const firmId = formData.get("firm_id");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError && !isInvalidSession(authError)) {
    throw new Error("Workspace authentication is temporarily unavailable.");
  }

  if (authError || !user) {
    redirect("/login");
  }

  if (typeof firmId !== "string" || !firmId) {
    throw new Error("Workspace access could not be verified.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("firm_users")
    .select("firm_id")
    .eq("user_id", user.id)
    .eq("firm_id", firmId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("Workspace access could not be verified.");
  }

  (await cookies()).set(ACTIVE_FIRM_COOKIE, firmId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // A workspace switch must leave entity-detail routes from the prior firm.
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard", RedirectType.replace);
}
