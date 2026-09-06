import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { SectionCard, SetupRequired } from "@/components/design-system";
import { FirmOnboardingForm } from "@/components/firm-onboarding-form";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!hasSupabaseConfig()) {
    return (
      <main className="min-h-screen bg-khata-paper text-khata-ink">
        <SetupRequired message="Connect Supabase environment variables before creating a firm workspace." />
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
    <main className="min-h-screen bg-khata-paper text-khata-ink">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-10 lg:grid-cols-[0.85fr_1fr] lg:px-10">
        <section className="max-w-sm">
          <BrandLogo />
          <p className="k-eyebrow mt-16 text-khata-green">Firm setup</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-khata-ink">
            Create your KhataOne workspace
          </h1>
          <p className="mt-4 text-sm leading-6 text-khata-muted">
            This workspace owns clients, documents, transactions, GST summaries,
            exports, and audit logs for your firm.
          </p>
        </section>

        <SectionCard
          title="Workspace identity"
          description="Start with the firm details required for CA-controlled accounting workflows."
          bodyClassName="p-5"
        >
          <FirmOnboardingForm userEmail={user.email} />
        </SectionCard>
      </div>
    </main>
  );
}
