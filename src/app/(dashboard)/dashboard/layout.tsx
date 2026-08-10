import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-khata-paper text-khata-ink">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-khata-border bg-white lg:border-b-0 lg:border-r">
          <div className="flex h-16 items-center justify-between border-b border-khata-border px-5">
            <Link href="/" className="text-xl font-semibold">
              KhataOne
            </Link>
          </div>
          <DashboardNav />
        </aside>
        <section>
          <header className="flex min-h-16 items-center justify-between border-b border-khata-border bg-white px-5">
            <div>
              <p className="text-sm font-semibold">Firm Workspace</p>
              <p className="text-xs text-khata-muted">
                Draft AI outputs require CA approval.
              </p>
            </div>
            <form action={signOut}>
              <button className="rounded-md border border-khata-border bg-khata-paper px-3 py-2 text-sm font-medium">
                Sign out
              </button>
            </form>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
