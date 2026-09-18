import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";

import { isInvalidSession } from "@/lib/auth-deadline";
import { hasSupabaseConfig } from "@/lib/env";
import { withServerTiming } from "@/lib/request-performance";
import { createClient } from "@/lib/supabase/server";

export type ActiveFirm = {
  id: string;
  role: string;
  name?: string;
};

export const ACTIVE_FIRM_COOKIE = "khataone_active_firm";

export type FirmContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  userId: string;
  firm: ActiveFirm;
  availableFirms: ActiveFirm[];
};

export const getFirmContext = cache(async (): Promise<FirmContext | null> => {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await withServerTiming(
    "firm_context.auth_get_user",
    () => supabase.auth.getUser(),
    { component: "firm_context" },
  );

  if (authError && !isInvalidSession(authError)) {
    throw new Error("Workspace authentication is temporarily unavailable.");
  }

  if (authError || !user) {
    redirect("/login");
  }

  const { data: memberships, error: membershipError } = await withServerTiming(
    "firm_context.membership_lookup",
    () =>
      supabase
        .from("firm_users")
        .select("firm_id, role, firms(name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true }),
    { component: "firm_context" },
  );

  if (membershipError) {
    throw new Error("Workspace membership could not be verified.");
  }

  if (!memberships?.length) {
    redirect("/onboarding");
  }

  const availableFirms = memberships.map((membership) => {
    const firm = Array.isArray(membership.firms)
      ? membership.firms[0]
      : membership.firms;

    return {
      id: membership.firm_id,
      role: membership.role,
      name: firm?.name,
    };
  });
  // The cookie is a preference, never proof of membership. Every request checks
  // it against the authenticated user's current active memberships.
  const preferredFirmId = (await cookies()).get(ACTIVE_FIRM_COOKIE)?.value;
  const activeFirm =
    availableFirms.find((firm) => firm.id === preferredFirmId) ??
    availableFirms[0];

  return {
    supabase,
    user,
    userId: user.id,
    firm: activeFirm,
    availableFirms,
  };
});

export async function getActiveFirm(): Promise<ActiveFirm | null> {
  const context = await getFirmContext();
  return context?.firm ?? null;
}

export async function getCurrentUserId() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await withServerTiming(
    "current_user.auth_get_user",
    () => supabase.auth.getUser(),
    { component: "current_user" },
  );

  return user?.id ?? null;
}
