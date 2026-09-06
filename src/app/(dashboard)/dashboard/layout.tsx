import { LogOut, Menu } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/design-system";
import { getFirmContext } from "@/lib/firms";

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
            <details className="group relative lg:hidden">
              <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-khata-muted transition hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green">
                <span className="sr-only">Open workspace navigation</span>
                <Menu className="size-5" aria-hidden="true" />
              </summary>
              <div className="absolute left-0 top-11 z-30 w-72 overflow-hidden rounded-lg border border-khata-border bg-white shadow-lg">
                <div className="border-b border-khata-border px-3 py-3">
                  <BrandLogo />
                </div>
                <DashboardNav />
              </div>
            </details>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{firmName}</p>
              <p className="hidden truncate text-xs text-khata-muted sm:block">
                Draft AI outputs require CA approval before ledger impact.
              </p>
            </div>

            <form action={signOut} className="shrink-0">
              <Button type="submit" variant="ghost" size="sm" className="gap-2">
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </header>
          <div className="min-w-0 flex-1">{children}</div>
        </section>
      </div>
    </main>
  );
}
