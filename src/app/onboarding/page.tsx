import { redirect } from "next/navigation";

import { FirmOnboardingForm } from "@/components/firm-onboarding-form";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!hasSupabaseConfig()) {
    return (
      <main className="min-h-screen bg-khata-paper px-5 py-10 text-khata-ink">
        <section className="mx-auto max-w-xl rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 text-sm leading-6 text-khata-muted">
            Add Supabase environment variables before creating a firm workspace.
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("firm_users")
    .select("firm_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-khata-paper px-5 py-10 text-khata-ink">
      <section className="mx-auto max-w-2xl rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Firm setup
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Create your KhataOne workspace
        </h1>
        <p className="mt-3 text-sm leading-6 text-khata-muted">
          This workspace owns clients, documents, transactions, GST summaries,
          exports, and audit logs for your firm.
        </p>
        <FirmOnboardingForm userEmail={user.email} />
      </section>
    </main>
  );
}
