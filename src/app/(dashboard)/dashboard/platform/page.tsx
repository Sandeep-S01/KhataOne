import { Blocks, CircleDollarSign, Landmark, Send, ShieldCheck } from "lucide-react";

import {
  DataTable,
  DetailList,
  IconPanel,
  PageBody,
  PageHeader,
  PaginationControls,
  RecordCount,
  SectionCard,
  SetupRequired,
  TableToolbar,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableNumericTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tablePrimaryTextClass,
  tableRowClass,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { dashboardPageSize, normalizePage } from "@/lib/dashboard-query";
import { getFirmContext } from "@/lib/firms";
import { formatDisplayDateTime } from "@/lib/format";
import { getGstIntegrationProvider } from "@/lib/integrations/gst";

export const dynamic = "force-dynamic";

const roadmap = [
  {
    title: "Direct GST integration",
    icon: ShieldCheck,
    status: "Planned",
    description:
      "Provider-backed GSTR comparison, filing preparation, and eventual submission after compliance verification.",
  },
  {
    title: "Bank reconciliation",
    icon: Landmark,
    status: "Planned",
    description:
      "Bank statement ingestion, matching rules, unmatched items, and review-first reconciliation workflows.",
  },
  {
    title: "WhatsApp reminders",
    icon: Send,
    status: "Planned",
    description:
      "Missing document nudges, clarification loops, client confirmations, and filing-period reminders.",
  },
  {
    title: "Accounting sync",
    icon: Blocks,
    status: "Planned",
    description:
      "Tally, Zoho Books, and QuickBooks integration events using the export/audit foundation.",
  },
  {
    title: "Billing and subscriptions",
    icon: CircleDollarSign,
    status: "Planned",
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

export default async function PlatformPage({ searchParams }: {
  searchParams: Promise<{ page?: string }>;
}) {
  const provider = getGstIntegrationProvider();
  const filters = await searchParams;
  const page = normalizePage(filters.page);
  const rangeFrom = (page - 1) * dashboardPageSize;
  const rangeTo = page * dashboardPageSize;

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
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(0, rangeTo);
  const externalIntegrationsQuery = supabase
    .from("external_integrations")
    .select("id, integration_type, provider, status, created_at")
    .eq("firm_id", firm.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(0, rangeTo);
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

  const integrationRows = [
    ...(gstIntegrations ?? []).map((item) => ({
      id: item.id, type: "gst", provider: item.provider,
      status: item.status, created_at: item.created_at,
    })),
    ...(externalIntegrations ?? []).map((item) => ({
      id: item.id, type: item.integration_type, provider: item.provider,
      status: item.status, created_at: item.created_at,
    })),
  ].sort((left, right) => right.created_at.localeCompare(left.created_at) || right.id.localeCompare(left.id));
  const pageIntegrations = integrationRows.slice(rangeFrom, rangeTo);
  const hasNextPage = integrationRows.length > rangeTo;

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Long-term extensions"
        description="Track planned integrations behind provider, compliance, audit, and review gates."
      />

      <PageBody>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {roadmap.map((item) => {
          const Icon = item.icon;

          return (
            <IconPanel
              key={item.title}
              icon={Icon}
              title={item.title}
              description={item.description}
              tone="brand"
              action={<StatusChip tone="neutral">{item.status}</StatusChip>}
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

        <SectionCard bodyClassName="p-0">
          <TableToolbar
            title="Integration records"
            meta={
              <RecordCount
                value={integrationEventCount ?? 0}
                label="events"
                singularLabel="event"
              />
            }
          />
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
                {pageIntegrations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className={`${tableCellClass} border-t border-khata-border text-khata-muted`}
                    >
                      No integration records have been configured yet.
                    </td>
                  </tr>
                ) : (
                  pageIntegrations.map((item) => (
                    <tr key={item.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>{item.type}</td>
                      <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                        {item.provider}
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip tone={statusTone(item.status)}>
                          {item.status}
                        </StatusChip>
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {formatDisplayDateTime(item.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
          </DataTable>
          <PaginationControls basePath="/dashboard/platform" page={page} hasNext={hasNextPage} searchParams={filters} label="integrations" />
        </SectionCard>
      </div>
      </PageBody>
    </div>
  );
}
