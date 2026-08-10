import Link from "next/link";
import { notFound } from "next/navigation";

import { archiveClientAction } from "@/app/actions/clients";
import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "active":
    case "filing_ready":
      return "success";
    case "pending_documents":
    case "review_needed":
      return "warning";
    case "archived":
      return "danger";
    default:
      return "neutral";
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 text-sm leading-6 text-khata-muted">
            Client detail pages need Supabase environment variables and
            migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("firm_id", firm!.id)
    .single();

  if (!client) {
    notFound();
  }

  const { data: audits } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, actor_user_id")
    .eq("client_id", client.id)
    .eq("firm_id", firm!.id)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <Link
            href="/dashboard/clients"
            className="text-sm font-semibold text-khata-green"
          >
            Back to clients
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">
            {client.business_name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-khata-muted">
            Client identity, GST setup, WhatsApp mapping, and audit history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/clients/${client.id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-khata-border bg-white px-4 text-sm font-semibold"
          >
            Edit
          </Link>
          {client.status !== "archived" && (
            <form action={archiveClientAction}>
              <input type="hidden" name="client_id" value={client.id} />
              <button className="h-10 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-khata-danger">
                Archive
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-semibold">Client profile</p>
            <StatusChip tone={statusTone(client.status)}>
              {client.status.replaceAll("_", " ")}
            </StatusChip>
          </div>
          <dl className="grid gap-4 text-sm">
            {[
              ["Contact", client.contact_name || "Pending"],
              ["Phone", client.phone || "Pending"],
              ["WhatsApp", client.whatsapp_phone || "Not linked"],
              ["Email", client.email || "Pending"],
              ["GSTIN", client.gstin || "Pending"],
              ["State code", client.state_code || "Pending"],
              ["Filing", client.filing_frequency],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[130px_1fr] gap-3 border-b border-khata-border pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="text-khata-muted">{label}</dt>
                <dd
                  className={
                    label === "GSTIN" || label === "WhatsApp"
                      ? "font-mono"
                      : "font-medium"
                  }
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
          <div className="border-b border-khata-border px-4 py-3">
            <p className="text-sm font-semibold">Audit history</p>
          </div>
          {!audits || audits.length === 0 ? (
            <div className="p-5 text-sm text-khata-muted">
              No audit entries yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id} className="border-t border-khata-border">
                      <td className="px-4 py-3 font-medium">{audit.action}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {audit.actor_user_id || "system"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {new Date(audit.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
