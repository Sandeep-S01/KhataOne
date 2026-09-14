import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { DashboardMobileMenu } from "@/components/dashboard-mobile-menu";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopbarActions } from "@/components/dashboard-topbar-actions";
import { Button } from "@/components/design-system";
import { getFirmContext } from "@/lib/firms";

export const metadata: Metadata = {
  title: "Dashboard | KhataOne",
  description: "Protected CA operations console for KhataOne.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getFirmContext();
  const firmName = context?.firm.name ?? "Firm Workspace";
  const roleLabel = context?.firm.role
    ? context.firm.role.replaceAll("_", " ")
    : "CA-approved records";
  const userEmail = context?.user.email ?? "CA user";
  const profileInitial = userEmail.trim().charAt(0).toUpperCase() || "U";

  return (
    <main className="min-h-screen bg-khata-paper text-khata-ink">
      <a
        href="#dashboard-content"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-semibold text-khata-green shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-khata-green"
      >
        Skip to dashboard content
      </a>
      <div className="flex min-h-screen p-0">
        <DashboardSidebar firmName={firmName} roleLabel={roleLabel} />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-khata-border bg-white/95 px-4 shadow-xs backdrop-blur-md md:px-6">
            <DashboardMobileMenu />

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
            className="min-w-0 flex-1 scroll-mt-16 outline-none"
          >
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
