import Link from "next/link";

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

export default async function ClientsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Client management screens are ready, but the client list needs
            Supabase environment variables and migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select(
      "id, business_name, contact_name, phone, whatsapp_phone, gstin, state_code, filing_frequency, status, created_at",
    )
    .eq("firm_id", firm!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-khata-green">
            Clients
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Client workspaces</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
            Manage GSTIN details, WhatsApp sender mapping, filing cadence,
            assignment readiness, and client status for {firm?.name ?? "this firm"}.
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-khata-green px-4 text-sm font-semibold text-white shadow-ledger"
        >
          Add client
        </Link>
      </div>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Client list</p>
          <span className="font-mono text-xs text-khata-muted">
            {clients?.length ?? 0} records
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!clients || clients.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No clients yet</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              Add the first business client before wiring WhatsApp ingestion,
              AI extraction, ledger review, and GST summaries.
            </p>
          </div>
        )}

        {!error && clients && clients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">GSTIN</th>
                  <th className="px-4 py-3 font-medium">Filing</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-t border-khata-border">
                    <td className="px-4 py-3">
                      <p className="font-medium">{client.business_name}</p>
                      <p className="text-xs text-khata-muted">
                        {client.contact_name || client.phone || "Contact pending"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {client.whatsapp_phone || "Not linked"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {client.gstin || "Pending"}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {client.filing_frequency}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip tone={statusTone(client.status)}>
                        {client.status.replaceAll("_", " ")}
                      </StatusChip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="font-semibold text-khata-green"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
