import type { Metadata } from "next";
import { LogOut } from "lucide-react";

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

  return (
    <main className="min-h-screen bg-khata-paper text-khata-ink">
      <a
        href="#dashboard-content"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-semibold text-khata-green shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-khata-green"
      >
        Skip to dashboard content
      </a>
      <div className="flex min-h-screen">
        <DashboardSidebar firmName={firmName} roleLabel={roleLabel} />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-khata-border bg-white/85 px-3 backdrop-blur-md md:px-4">
            <DashboardMobileMenu />

            <div className="min-w-0 flex-1 pr-1">
              <p className="truncate text-sm font-semibold">{firmName}</p>
              <p className="hidden truncate text-xs text-khata-muted sm:block">
                Draft AI outputs require CA approval before ledger impact.
              </p>
            </div>

            <form action={signOut} className="shrink-0">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="gap-2 px-2 sm:px-3"
                aria-label="Sign out"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
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
