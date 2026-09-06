import {
  DataTable,
  EmptyState,
  PageBody,
  PageHeader,
  QueryError,
  RecordCount,
  SectionCard,
  SetupRequired,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableMonoTextClass,
  tableNumericHeadCellClass,
  tableNumericCellClass,
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
    case "queued":
    case "media_downloaded":
    case "matched":
      return "success";
    case "received":
    case "unmatched":
      return "warning";
    case "failed":
    case "media_failed":
      return "danger";
    default:
      return "neutral";
  }
}

export default async function InboxPage() {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing WhatsApp intake records." />
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: messages, error } = await supabase
    .from("whatsapp_messages")
    .select(
      "id, client_id, sender_phone, message_type, processing_status, received_at, clients(business_name)",
    )
    .eq("firm_id", firm!.id)
    .order("received_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="WhatsApp document intake"
        description="Track inbound WhatsApp messages, client matching, media download, and queue status before AI extraction."
      />

      <PageBody>
        <SectionCard
          title="Inbound messages"
          actions={<RecordCount value={messages?.length ?? 0} label="latest" />}
          bodyClassName="p-0"
        >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!messages || messages.length === 0) && (
          <EmptyState
            title="No inbound messages yet"
            message="Configure the Meta webhook endpoint and link client WhatsApp numbers before documents appear here."
          />
        )}

        {!error && messages && messages.length > 0 && (
          <DataTable minWidth={760}>
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Sender</th>
                  <th className={tableHeadCellClass}>Type</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableNumericHeadCellClass}>Received</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => {
                  const client = Array.isArray(message.clients)
                    ? message.clients[0]
                    : message.clients;

                  return (
                    <tr key={message.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {client?.business_name ?? "Unmatched sender"}
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {message.sender_phone}
                      </td>
                      <td className={`${tableCellClass} capitalize`}>
                        {message.message_type}
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip tone={statusTone(message.processing_status)}>
                          {message.processing_status.replaceAll("_", " ")}
                        </StatusChip>
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {new Date(message.received_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </DataTable>
        )}
        </SectionCard>
      </PageBody>
    </div>
  );
}
