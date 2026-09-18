import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { DashboardMobileMenu } from "@/components/dashboard-mobile-menu";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopbarActions } from "@/components/dashboard-topbar-actions";
import { Button } from "@/components/design-system";
import { countOrUnavailable } from "@/lib/availability";
import { getFirmContext, type FirmContext } from "@/lib/firms";
import { withServerTiming } from "@/lib/request-performance";

export type SidebarCounts = {
  inbox: number | null;
  reviewQueue: number | null;
};

export const metadata: Metadata = {
  title: "Dashboard | KhataOne",
  description: "Protected CA operations console for KhataOne.",
  robots: {
    index: false,
    follow: false,
  },
};

async function getSidebarCounts(context: FirmContext | null): Promise<SidebarCounts> {
  if (!context) {
    return { inbox: null, reviewQueue: null };
  }

  const { firm, supabase } = context;

  const reviewQueuePromise = supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .in("status", ["draft", "needs_review", "duplicate"]);

  const inboxPromise = supabase
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id)
    .in("processing_status", ["received", "unmatched", "failed", "media_failed"]);

  const [reviewQueue, inbox] = await Promise.all([
    withServerTiming("dashboard_sidebar.review_queue_count", () => reviewQueuePromise),
    withServerTiming("dashboard_sidebar.inbox_count", () => inboxPromise),
  ]);

  return {
    inbox: countOrUnavailable(inbox),
    reviewQueue: countOrUnavailable(reviewQueue),
  };
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getFirmContext();
  const activeFirm = context?.firm ?? { id: "", role: "", name: "Firm Workspace" };
  const availableFirms = context?.availableFirms ?? [];
  const firmName = context?.firm.name ?? "Firm Workspace";
  const roleLabel = context?.firm.role
    ? context.firm.role.replaceAll("_", " ")
    : "CA-approved records";
  const userEmail = context?.user.email ?? "CA user";
  const profileInitial = userEmail.trim().charAt(0).toUpperCase() || "U";
  // Counts are secondary: authenticate first, then stream only the badges.
  const sidebarCounts = getSidebarCounts(context).catch(() => ({
    inbox: null,
    reviewQueue: null,
  }));

  return (
    <main className="dashboard-theme min-h-screen bg-khata-paper text-khata-ink">
      <a
        href="#dashboard-content"
        className="sr-only z-50 rounded-md bg-khata-surface px-3 py-2 text-sm font-semibold text-khata-green shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-khata-green"
      >
        Skip to dashboard content
      </a>
      <div className="flex min-h-screen p-0">
        <DashboardSidebar
          activeFirm={activeFirm}
          availableFirms={availableFirms}
          counts={sidebarCounts}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-khata-border bg-khata-surface/95 px-4 shadow-xs backdrop-blur-md md:px-8">
            <DashboardMobileMenu activeFirm={activeFirm} availableFirms={availableFirms} />

            <div className="min-w-0 flex-1 pr-1">
              <p className="truncate text-sm font-semibold">{firmName}</p>
              <p className="hidden truncate text-xs text-khata-muted sm:block">
                AI drafts require CA approval.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
              <DashboardTopbarActions
                userEmail={userEmail}
                roleLabel={roleLabel}
                profileInitial={profileInitial}
              />

              <div className="hidden h-6 w-px bg-khata-border md:block" aria-hidden="true" />

              <form action={signOut} className="shrink-0">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="min-w-11 gap-2 px-2 text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink sm:px-3 md:h-9 md:min-w-9"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </div>
          </header>
          <div
            id="dashboard-content"
            tabIndex={-1}
            className="min-w-0 flex-1 scroll-mt-14 outline-none"
          >
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
