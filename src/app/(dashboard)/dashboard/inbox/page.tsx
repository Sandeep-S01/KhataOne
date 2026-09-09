import {
  ActionLink,
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  Input,
  PageBody,
  PageHeader,
  PaginationControls,
  QueryError,
  RecordCount,
  SectionCard,
  Select,
  SetupRequired,
  tableActionCellClass,
  tableActionHeadCellClass,
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
import { normalizePage, normalizeSearch } from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { withServerTiming } from "@/lib/performance";

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

const inboxStatusOptions = [
  "all",
  "received",
  "unmatched",
  "matched",
  "queued",
  "media_downloaded",
  "failed",
  "media_failed",
  "ignored",
];

const pageSize = 50;

function triageLabel(status: string) {
  switch (status) {
    case "unmatched":
      return "Match sender";
    case "failed":
    case "media_failed":
      return "Check failure";
    case "received":
      return "Await matching";
    case "queued":
      return "Queued";
    case "media_downloaded":
    case "matched":
      return "Ready";
    case "ignored":
      return "Ignored";
    default:
      return "Inspect";
  }
}


export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing WhatsApp intake records." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const filters = await searchParams;
  const selectedStatus = inboxStatusOptions.includes(filters.status ?? "")
    ? filters.status ?? "all"
    : "all";
  const search = normalizeSearch(filters.q);
  const page = normalizePage(filters.page);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize;
  let query = supabase
    .from("whatsapp_messages")
    .select(
      "id, client_id, sender_phone, message_type, processing_status, received_at, clients(business_name)",
    )
    .eq("firm_id", firm.id)
    .order("received_at", { ascending: false })
    .order("id", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (selectedStatus !== "all") {
    query = query.eq("processing_status", selectedStatus);
  }

  const { data: messages, error } = await withServerTiming(
    "dashboard.inbox.query",
    () => query,
    {
      page,
      has_status_filter: selectedStatus !== "all",
      has_search_filter: Boolean(search),
      search_applied_after_page: Boolean(search),
    },
  );
  const pageMessages = (messages ?? []).slice(0, pageSize);
  const hasNextPage = (messages?.length ?? 0) > pageSize;
  const filteredMessages = pageMessages.filter((message) => {
    const client = Array.isArray(message.clients)
      ? message.clients[0]
      : message.clients;
    const matchesSearch =
      !search ||
      [client?.business_name, message.sender_phone, message.message_type]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search));

    return matchesSearch;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="WhatsApp document intake"
        description="Track inbound WhatsApp messages, client matching, media download, and queue status before AI extraction."
      />

      <PageBody>
        <FilterBar action="/dashboard/inbox">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto] md:items-end">
            <div className="grid gap-1.5">
              <label
                htmlFor="inbox-search"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Search
              </label>
              <Input
                id="inbox-search"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Sender, client, type"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="inbox-status"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Status
              </label>
              <Select
                id="inbox-status"
                name="status"
                defaultValue={selectedStatus}
              >
                {inboxStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm">
                Apply
              </Button>
              <ActionLink href="/dashboard/inbox" size="sm">
                Clear
              </ActionLink>
            </div>
          </div>
        </FilterBar>

        <SectionCard
          title="Inbound messages"
          actions={<RecordCount value={filteredMessages.length} label="shown" />}
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

        {!error && messages && messages.length > 0 && filteredMessages.length === 0 && (
          <EmptyState
            title="No messages match these filters"
            message="Adjust the search or status filter to return inbound WhatsApp records."
            action={<ActionLink href="/dashboard/inbox">Clear filters</ActionLink>}
          />
        )}

        {!error && filteredMessages.length > 0 && (
          <>
            <DataTable minWidth={860} ariaLabel="WhatsApp inbox records">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Sender</th>
                  <th className={tableHeadCellClass}>Type</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableNumericHeadCellClass}>Received</th>
                  <th className={tableActionHeadCellClass}>Triage</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((message) => {
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
                      <td className={tableActionCellClass}>
                        <span className="text-xs font-medium text-khata-muted">
                          {triageLabel(message.processing_status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            <PaginationControls
              basePath="/dashboard/inbox"
              page={page}
              hasNext={hasNextPage}
              searchParams={filters}
              label="inbox records"
            />
          </>
        )}
        </SectionCard>
      </PageBody>
    </div>
  );
}
