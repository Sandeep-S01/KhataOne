import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardMobileMenu } from "@/components/dashboard-mobile-menu";
import { DashboardNav } from "@/components/dashboard-nav";
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
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-khata-border bg-white lg:flex lg:flex-col">
          <div className="flex h-14 items-center gap-2 border-b border-khata-border px-3">
            <Link
              href="/dashboard"
              className="min-w-0 flex-1 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
              aria-label="KhataOne dashboard"
            >
              <BrandLogo />
            </Link>
          </div>
          <div className="border-b border-khata-border px-3 py-3">
            <div className="rounded-md border border-khata-border bg-khata-paper px-3 py-2">
              <p className="truncate text-sm font-medium text-khata-ink">
                {firmName}
              </p>
              <p className="mt-0.5 text-xs capitalize text-khata-muted">
                {roleLabel}
              </p>
            </div>
          </div>
          <DashboardNav />
        </aside>

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
