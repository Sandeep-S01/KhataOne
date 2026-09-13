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
import { formatDisplayDateTime } from "@/lib/format";
import { withServerTiming } from "@/lib/request-performance";

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

type InboxRow = {
  id: string;
  client_id: string | null;
  sender_phone: string;
  message_type: string;
  processing_status: string;
  received_at: string;
  client_business_name: string | null;
};

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
  const query = supabase.rpc("search_whatsapp_inbox", {
    target_firm_id: firm.id,
    target_status: selectedStatus === "all" ? null : selectedStatus,
    target_search: search || null,
    page_limit: pageSize + 1,
    page_offset: rangeFrom,
  });

  const { data: messages, error } = await withServerTiming(
    "dashboard.inbox.query",
    () => query,
    {
      page,
      has_status_filter: selectedStatus !== "all",
      has_search_filter: Boolean(search),
      filters_applied_before_page: true,
    },
  );
  const pageMessages = ((messages ?? []) as InboxRow[]).slice(0, pageSize);
  const hasNextPage = (messages?.length ?? 0) > pageSize;

  return (
    <div>
      <PageHeader
        eyebrow="Inbox"
        title="WhatsApp document intake"
        description="Track WhatsApp intake from receipt through client matching and extraction queueing."
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
          actions={<RecordCount value={pageMessages.length} label="shown" />}
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

        {!error && messages && messages.length > 0 && pageMessages.length === 0 && (
          <EmptyState
            title="No messages match these filters"
            message="Adjust the search or status filter to return inbound WhatsApp records."
            action={<ActionLink href="/dashboard/inbox">Clear filters</ActionLink>}
          />
        )}

        {!error && pageMessages.length > 0 && (
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
                {pageMessages.map((message) => {
                  return (
                    <tr key={message.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {message.client_business_name ?? "Unmatched sender"}
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
                        {formatDisplayDateTime(message.received_at)}
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
