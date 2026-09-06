import {
  ActionLink,
  DataTable,
  EmptyState,
  PageBody,
  PageHeader,
  QueryError,
  RecordCount,
  SectionCard,
  SetupRequired,
  TextLink,
  tableActionCellClass,
  tableActionHeadCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableMonoTextClass,
  tablePrimaryTextClass,
  tableSecondaryTextClass,
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

export default async function ClientsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before managing client workspaces." />
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
    <div>
      <PageHeader
        eyebrow="Clients"
        title="Client workspaces"
        description={`Manage GSTIN details, WhatsApp sender mapping, filing cadence, assignment readiness, and client status for ${firm?.name ?? "this firm"}.`}
        actions={
        <ActionLink
          href="/dashboard/clients/new"
          variant="primary"
        >
          Add client
        </ActionLink>
        }
      />

      <PageBody>
        <SectionCard
          title="Client list"
          actions={<RecordCount value={clients?.length ?? 0} />}
          bodyClassName="p-0"
        >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!clients || clients.length === 0) && (
          <EmptyState
            title="No clients yet"
            message="Add the first business client before wiring WhatsApp ingestion, AI extraction, ledger review, and GST summaries."
          />
        )}

        {!error && clients && clients.length > 0 && (
          <DataTable minWidth={860}>
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Business</th>
                  <th className={tableHeadCellClass}>WhatsApp</th>
                  <th className={tableHeadCellClass}>GSTIN</th>
                  <th className={tableHeadCellClass}>Filing</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableActionHeadCellClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className={tableRowClass}>
                    <td className={tableCellClass}>
                      <p className={tablePrimaryTextClass}>{client.business_name}</p>
                      <p className={tableSecondaryTextClass}>
                        {client.contact_name || client.phone || "Contact pending"}
                      </p>
                    </td>
                    <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                      {client.whatsapp_phone || "Not linked"}
                    </td>
                    <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                      {client.gstin || "Pending"}
                    </td>
                    <td className={`${tableCellClass} capitalize`}>
                      {client.filing_frequency}
                    </td>
                    <td className={tableCellClass}>
                      <StatusChip tone={statusTone(client.status)}>
                        {client.status.replaceAll("_", " ")}
                      </StatusChip>
                    </td>
                    <td className={tableActionCellClass}>
                      <TextLink
                        href={`/dashboard/clients/${client.id}`}
                      >
                        Open
                      </TextLink>
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
