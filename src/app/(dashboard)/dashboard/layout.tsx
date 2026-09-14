import type { Metadata } from "next";
import { Bell, LogOut, Search } from "lucide-react";

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
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-md text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                aria-label="Search workspace"
                title="Search workspace"
              >
                <Search className="size-5 stroke-[1.8]" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="relative inline-flex size-9 items-center justify-center rounded-md text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                aria-label="Activity alerts"
                title="Activity alerts"
              >
                <Bell className="size-5 stroke-[1.8]" aria-hidden="true" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-khata-green ring-2 ring-white" aria-hidden="true" />
              </button>

              <div
                className="hidden h-9 min-w-0 items-center gap-2 rounded-full bg-khata-paperMuted/70 px-2 py-1 sm:flex"
                title={userEmail}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-khata-ink text-[11px] font-semibold text-white shadow-sm">
                  {profileInitial}
                </span>
                <span className="hidden min-w-0 items-baseline gap-1.5 lg:flex">
                  <span className="max-w-32 truncate text-sm font-semibold text-khata-ink">
                    {userEmail}
                  </span>
                  <span className="max-w-20 truncate text-xs capitalize text-khata-muted">
                    {roleLabel}
                  </span>
                </span>
              </div>

              <div className="hidden h-6 w-px bg-khata-border md:block" aria-hidden="true" />

              <form action={signOut} className="shrink-0">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-9 min-w-9 gap-2 px-2 text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink sm:px-3"
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
