import type { Metadata } from "next";
import { Bell, LogOut, Search, UserRound } from "lucide-react";

import { signOut } from "@/app/actions/auth";
import { DashboardMobileMenu } from "@/components/dashboard-mobile-menu";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
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
      <div className="flex min-h-screen gap-4 p-0 lg:pr-4">
        <DashboardSidebar firmName={firmName} roleLabel={roleLabel} />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-khata-border bg-white/95 px-3 shadow-xs backdrop-blur-md md:px-4">
            <DashboardMobileMenu />

            <div className="min-w-0 flex-1 pr-1">
              <p className="truncate text-sm font-semibold">{firmName}</p>
              <p className="hidden truncate text-xs text-khata-muted sm:block">
                AI drafts require CA approval.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center gap-2 border border-khata-border bg-white px-2.5 text-sm font-medium text-khata-ink transition-colors hover:bg-khata-paperMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green sm:px-3"
                aria-label="Search workspace"
                title="Search workspace"
              >
                <Search className="size-4" aria-hidden="true" />
                <span className="hidden md:inline">Search</span>
              </button>

              <button
                type="button"
                className="relative inline-flex size-9 items-center justify-center border border-khata-border bg-white text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                aria-label="Activity alerts"
                title="Activity alerts"
              >
                <Bell className="size-4" aria-hidden="true" />
                <span className="absolute right-2 top-2 size-1.5 bg-khata-green" aria-hidden="true" />
              </button>

              <div
                className="hidden h-9 min-w-0 items-center gap-2 border border-khata-border bg-white px-2.5 sm:flex"
                title={userEmail}
              >
                <span className="flex size-6 shrink-0 items-center justify-center bg-khata-ink text-[11px] font-semibold text-white">
                  {profileInitial}
                </span>
                <span className="hidden min-w-0 flex-col leading-none lg:flex">
                  <span className="max-w-36 truncate text-xs font-semibold text-khata-ink">
                    {userEmail}
                  </span>
                  <span className="mt-1 max-w-36 truncate text-[11px] capitalize text-khata-muted">
                    {roleLabel}
                  </span>
                </span>
                <UserRound className="size-4 shrink-0 text-khata-muted lg:hidden" aria-hidden="true" />
              </div>

              <form action={signOut} className="shrink-0">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-9 min-w-9 gap-2 rounded-none border border-khata-border bg-white px-2 text-khata-ink hover:bg-khata-paperMuted sm:px-3"
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
            className="min-w-0 flex-1 scroll-mt-16 outline-none lg:overflow-hidden lg:rounded-2xl lg:border lg:border-khata-border/70 lg:bg-white/35 lg:shadow-xs"
          >
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
