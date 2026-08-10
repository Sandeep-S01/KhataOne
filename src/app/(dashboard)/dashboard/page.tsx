import { redirect } from "next/navigation";

import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const stats = [
  ["Pending review", "0"],
  ["Clients active", "0"],
  ["GST ready", "0"],
  ["Exports this month", "0"],
];

export default async function DashboardPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Phase 2 routes are in place, but authentication needs
            `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </p>
        </section>
      </div>
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
    .select("firm_id, role, firms(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold">CA operations console</h1>
        <p className="mt-2 text-sm text-khata-muted">
          Client, WhatsApp, review, ledger, GST, export, and audit modules will
          land here as the next build phases are completed.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-khata-border bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase text-khata-muted">
              {label}
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-5 rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Next implementation slice</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-khata-paperMuted text-xs text-khata-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Guardrail</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "3",
                  "Dashboard shell",
                  "Next",
                  "Keep dense, table-first console patterns.",
                ],
                [
                  "4",
                  "Client management",
                  "Planned",
                  "Every client belongs to a firm.",
                ],
                [
                  "5",
                  "WhatsApp ingestion",
                  "Planned",
                  "Store raw events before processing.",
                ],
              ].map(([phase, module, status, guardrail]) => (
                <tr key={phase} className="border-t border-khata-border">
                  <td className="px-4 py-3 font-mono">{phase}</td>
                  <td className="px-4 py-3 font-medium">{module}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-khata-paper px-2 py-1 text-xs font-medium">
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-khata-muted">{guardrail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
