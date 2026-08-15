import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type ActiveFirm = {
  id: string;
  role: string;
  name?: string;
};

export type FirmContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  userId: string;
  firm: ActiveFirm;
};

export async function getFirmContext(): Promise<FirmContext | null> {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("firm_users")
    .select("firm_id, role, firms(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  const firm = Array.isArray(membership.firms)
    ? membership.firms[0]
    : membership.firms;

  return {
    supabase,
    user,
    userId: user.id,
    firm: {
      id: membership.firm_id,
      role: membership.role,
      name: firm?.name,
    },
  };
}

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
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}
