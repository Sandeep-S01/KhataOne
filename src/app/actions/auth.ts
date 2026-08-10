"use server";

import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function validateAuth(email: string, password: string) {
  const fieldErrors: Record<string, string> = {};

  if (!isEmail(email)) {
    fieldErrors.email = "Enter a valid work email.";
  }

  if (password.length < 8) {
    fieldErrors.password = "Use at least 8 characters.";
  }

  return fieldErrors;
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const fieldErrors = validateAuth(email, password);

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
        "Supabase Auth is not configured yet. Add Supabase environment variables before signing in.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  redirect("/dashboard");
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const fullName = readString(formData, "full_name");
  const firmName = readString(formData, "firm_name");
  const fieldErrors = validateAuth(email, password);

  if (fullName.length < 2) {
    fieldErrors.full_name = "Enter your name.";
  }

  if (firmName.length < 2) {
    fieldErrors.firm_name = "Enter your firm name.";
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
        "Supabase Auth is not configured yet. Add Supabase environment variables before signing up.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        firm_name: firmName,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Account created. Check your email to confirm your account, then sign in.",
    };
  }

  redirect("/onboarding");
}

export async function signOut() {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function createFirm(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = readString(formData, "firm_name");
  const gstin = readString(formData, "gstin");
  const phone = readString(formData, "phone");
  const email = readString(formData, "email");
  const address = readString(formData, "address");
  const fieldErrors: Record<string, string> = {};

  if (name.length < 2) {
    fieldErrors.firm_name = "Enter your firm name.";
  }

  if (email && !isEmail(email)) {
    fieldErrors.email = "Enter a valid firm email.";
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
        "Supabase Auth is not configured yet. Add Supabase environment variables before creating a firm workspace.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const slugBase = slugify(name) || "firm";
  const slug = `${slugBase}-${user.id.slice(0, 8)}`;
  const admin = createAdminClient();

  if (!admin) {
    return {
      status: "error",
      message:
        "Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY before creating a firm workspace.",
    };
  }

  const { data: firm, error: firmError } = await admin
    .from("firms")
    .insert({
      name,
      slug,
      owner_user_id: user.id,
      gstin: gstin || null,
      phone: phone || null,
      email: email || user.email,
      address: address || null,
      status: "active",
    })
    .select("id")
    .single();

  if (firmError || !firm) {
    return {
      status: "error",
      message:
        firmError?.message ?? "Could not create firm workspace. Try again.",
    };
  }

  const { error: membershipError } = await admin.from("firm_users").insert({
    firm_id: firm.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });

  if (membershipError) {
    return {
      status: "error",
      message:
        "Firm was created, but owner membership could not be attached. Check RLS policies.",
    };
  }

  redirect("/dashboard");
}
