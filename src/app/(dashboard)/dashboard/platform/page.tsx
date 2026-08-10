import { Blocks, CircleDollarSign, Landmark, Send, ShieldCheck } from "lucide-react";

import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { getGstIntegrationProvider } from "@/lib/integrations/gst";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const roadmap = [
  {
    title: "Direct GST integration",
    icon: ShieldCheck,
    status: "Future gated",
    description:
      "Provider-backed GSTR comparison, filing preparation, and eventual submission after compliance verification.",
  },
  {
    title: "Bank reconciliation",
    icon: Landmark,
    status: "Future gated",
    description:
      "Bank statement ingestion, matching rules, unmatched items, and review-first reconciliation workflows.",
  },
  {
    title: "WhatsApp reminders",
    icon: Send,
    status: "Future gated",
    description:
      "Missing document nudges, clarification loops, client confirmations, and filing-period reminders.",
  },
  {
    title: "Accounting sync",
    icon: Blocks,
    status: "Future gated",
    description:
      "Tally, Zoho Books, and QuickBooks integration events using the export/audit foundation.",
  },
  {
    title: "Billing and subscriptions",
    icon: CircleDollarSign,
    status: "Future gated",
    description:
      "Firm billing, plan limits, usage tracking, invoices, and subscription lifecycle workflows.",
  },
];

function statusTone(status: string) {
  switch (status) {
    case "active":
    case "sandbox":
      return "success";
    case "paused":
    case "planned":
      return "warning";
    default:
      return "neutral";
  }
}

export default async function PlatformPage() {
  const provider = getGstIntegrationProvider();

  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Platform extension status needs Supabase environment variables and
            migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: gstIntegrations } = await supabase
    .from("gst_integrations")
    .select("id, provider, status, created_at")
    .eq("firm_id", firm!.id)
    .order("created_at", { ascending: false });
  const { data: externalIntegrations } = await supabase
    .from("external_integrations")
    .select("id, integration_type, provider, status, created_at")
    .eq("firm_id", firm!.id)
    .order("created_at", { ascending: false });
  const { count: integrationEventCount } = await supabase
    .from("integration_events")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm!.id);

  return (
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Platform
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Long-term extensions</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Future platform capabilities are tracked behind explicit provider,
          compliance, audit, and review gates. Production v1 remains GST
          summary and export preparation only.
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {roadmap.map((item) => {
          const Icon = item.icon;

          return (
            <section
              key={item.title}
              className="rounded-lg border border-khata-border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <Icon className="size-5 text-khata-green" />
                <StatusChip tone="warning">{item.status}</StatusChip>
              </div>
              <h2 className="mt-4 text-sm font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-khata-muted">
                {item.description}
              </p>
            </section>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
          <div className="border-b border-khata-border px-4 py-3">
            <p className="text-sm font-semibold">GST provider boundary</p>
          </div>
          <div className="p-4 text-sm">
            <dl className="grid gap-3">
              <div className="grid grid-cols-[140px_1fr] gap-3">
                <dt className="text-khata-muted">Provider</dt>
                <dd className="font-mono">{provider.provider}</dd>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-3">
                <dt className="text-khata-muted">Filing status</dt>
                <dd>
                  <StatusChip tone="warning">Not implemented</StatusChip>
                </dd>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-3">
                <dt className="text-khata-muted">Guardrail</dt>
                <dd className="text-khata-muted">
                  Filing and portal submission remain blocked until an approved
                  provider is implemented, tested, and compliance-verified.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
          <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
            <p className="text-sm font-semibold">Integration records</p>
            <span className="font-mono text-xs text-khata-muted">
              {integrationEventCount ?? 0} events
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {[...(gstIntegrations ?? []), ...(externalIntegrations ?? [])]
                  .length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="border-t border-khata-border px-4 py-5 text-khata-muted"
                    >
                      No integration records have been configured yet.
                    </td>
                  </tr>
                ) : (
                  [
                    ...(gstIntegrations ?? []).map((item) => ({
                      id: item.id,
                      type: "gst",
                      provider: item.provider,
                      status: item.status,
                      created_at: item.created_at,
                    })),
                    ...(externalIntegrations ?? []).map((item) => ({
                      id: item.id,
                      type: item.integration_type,
                      provider: item.provider,
                      status: item.status,
                      created_at: item.created_at,
                    })),
                  ].map((item) => (
                    <tr key={item.id} className="border-t border-khata-border">
                      <td className="px-4 py-3 font-medium">{item.type}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {item.provider}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip tone={statusTone(item.status)}>
                          {item.status}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {new Date(item.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
