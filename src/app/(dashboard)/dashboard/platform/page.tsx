import { Blocks, CircleDollarSign, Landmark, Send, ShieldCheck } from "lucide-react";

import {
  DataTable,
  DetailList,
  IconPanel,
  PageBody,
  PageHeader,
  RecordCount,
  SectionCard,
  SetupRequired,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableMonoTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tablePrimaryTextClass,
  tableRowClass,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { getGstIntegrationProvider } from "@/lib/integrations/gst";

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
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing platform extension records." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const gstIntegrationsQuery = supabase
    .from("gst_integrations")
    .select("id, provider, status, created_at")
    .eq("firm_id", firm.id)
    .order("created_at", { ascending: false });
  const externalIntegrationsQuery = supabase
    .from("external_integrations")
    .select("id, integration_type, provider, status, created_at")
    .eq("firm_id", firm.id)
    .order("created_at", { ascending: false });
  const integrationEventCountQuery = supabase
    .from("integration_events")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firm.id);

  const [
    { data: gstIntegrations },
    { data: externalIntegrations },
    { count: integrationEventCount },
  ] = await Promise.all([
    gstIntegrationsQuery,
    externalIntegrationsQuery,
    integrationEventCountQuery,
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Long-term extensions"
        description="Future platform capabilities are tracked behind explicit provider, compliance, audit, and review gates. Production v1 remains GST summary and export preparation only."
      />

      <PageBody>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {roadmap.map((item) => {
          const Icon = item.icon;

          return (
            <IconPanel
              key={item.title}
              icon={Icon}
              title={item.title}
              description={item.description}
              tone="brand"
              action={<StatusChip tone="warning">{item.status}</StatusChip>}
              className="k-card-hover"
            />
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="GST provider boundary">
          <DetailList
            labelWidth="140px"
            items={[
              { label: "Provider", value: provider.provider, mono: true },
              { label: "Filing status", value: <StatusChip tone="warning">Not implemented</StatusChip> },
              {
                label: "Guardrail",
                value:
                  "Filing and portal submission remain blocked until an approved provider is implemented, tested, and compliance-verified.",
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Integration records"
          actions={<RecordCount value={integrationEventCount ?? 0} label="events" />}
          bodyClassName="p-0"
        >
          <DataTable minWidth={680} ariaLabel="Platform integration records">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Type</th>
                  <th className={tableHeadCellClass}>Provider</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableNumericHeadCellClass}>Created</th>
                </tr>
              </thead>
              <tbody>
                {[...(gstIntegrations ?? []), ...(externalIntegrations ?? [])]
                  .length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className={`${tableCellClass} border-t border-khata-border text-khata-muted`}
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
                    <tr key={item.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>{item.type}</td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {item.provider}
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip tone={statusTone(item.status)}>
                          {item.status}
                        </StatusChip>
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {new Date(item.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
          </DataTable>
        </SectionCard>
      </div>
      </PageBody>
    </div>
  );
}
