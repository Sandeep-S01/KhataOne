import { notFound } from "next/navigation";

import { archiveClientAction } from "@/app/actions/clients";
import {
  ActionLink,
  Button,
  DataTable,
  DetailList,
  EmptyState,
  PageBody,
  PageHeader,
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
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing client details." />
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
    <div>
      <PageHeader
        eyebrow="Clients"
        title={client.business_name}
        description="Client identity, GST setup, WhatsApp mapping, and audit history."
        meta={
          <StatusChip tone={statusTone(client.status)}>
            {client.status.replaceAll("_", " ")}
          </StatusChip>
        }
        actions={
          <>
          <ActionLink
            href="/dashboard/clients"
          >
            Back to clients
          </ActionLink>
          <ActionLink
            href={`/dashboard/clients/${client.id}/edit`}
          >
            Edit
          </ActionLink>
          {client.status !== "archived" && (
            <form action={archiveClientAction}>
              <input type="hidden" name="client_id" value={client.id} />
              <Button type="submit" variant="danger" size="sm">
                Archive
              </Button>
            </form>
          )}
          </>
        }
      />

      <PageBody className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Client profile">
          <DetailList
            labelWidth="130px"
            items={[
              { label: "Contact", value: client.contact_name || "Pending" },
              { label: "Phone", value: client.phone || "Pending", mono: true },
              { label: "WhatsApp", value: client.whatsapp_phone || "Not linked", mono: true },
              { label: "Email", value: client.email || "Pending" },
              { label: "GSTIN", value: client.gstin || "Pending", mono: true },
              { label: "State code", value: client.state_code || "Pending", mono: true },
              { label: "Filing", value: client.filing_frequency },
            ]}
          />
        </SectionCard>

        <SectionCard title="Audit history" bodyClassName="p-0">
          {!audits || audits.length === 0 ? (
            <EmptyState
              title="No audit entries yet"
              message="Client changes and sensitive workflow actions will appear here."
            />
          ) : (
            <DataTable minWidth={520}>
                <thead className={tableHeaderClass}>
                  <tr>
                    <th className={tableHeadCellClass}>Action</th>
                    <th className={tableHeadCellClass}>Actor</th>
                    <th className={tableNumericHeadCellClass}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>{audit.action}</td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {audit.actor_user_id || "system"}
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {new Date(audit.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
            </DataTable>
          )}
        </SectionCard>
      </PageBody>
    </div>
  );
}
