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
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            WhatsApp inbox screens are ready, but inbound messages need
            Supabase environment variables and migrations.
          </p>
        </section>
      </div>
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
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Inbox
        </p>
        <h1 className="mt-2 text-3xl font-semibold">WhatsApp document intake</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Track inbound WhatsApp messages, client matching, media download, and
          queue status before AI extraction.
        </p>
      </div>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Inbound messages</p>
          <span className="font-mono text-xs text-khata-muted">
            {messages?.length ?? 0} latest
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!messages || messages.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No inbound messages yet</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              Configure the Meta webhook endpoint and link client WhatsApp
              numbers before documents appear here.
            </p>
          </div>
        )}

        {!error && messages && messages.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Sender</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => {
                  const client = Array.isArray(message.clients)
                    ? message.clients[0]
                    : message.clients;

                  return (
                    <tr key={message.id} className="border-t border-khata-border">
                      <td className="px-4 py-3 font-medium">
                        {client?.business_name ?? "Unmatched sender"}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {message.sender_phone}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {message.message_type}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip tone={statusTone(message.processing_status)}>
                          {message.processing_status.replaceAll("_", " ")}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {new Date(message.received_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
