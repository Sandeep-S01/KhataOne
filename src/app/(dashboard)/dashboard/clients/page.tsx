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
import {
  normalizePage,
  normalizeSearch,
  toPostgrestContainsPattern,
} from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { withServerTiming } from "@/lib/performance";

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

const statusOptions = [
  "all",
  "active",
  "pending_documents",
  "review_needed",
  "filing_ready",
  "archived",
];

const pageSize = 50;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before managing client workspaces." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const filters = await searchParams;
  const selectedStatus = statusOptions.includes(filters.status ?? "")
    ? filters.status ?? "all"
    : "all";
  const search = normalizeSearch(filters.q);
  const page = normalizePage(filters.page);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize;
  let query = supabase
    .from("clients")
    .select(
      "id, business_name, contact_name, phone, whatsapp_phone, gstin, state_code, filing_frequency, status, created_at",
    )
    .eq("firm_id", firm.id);

  if (selectedStatus !== "all") {
    query = query.eq("status", selectedStatus);
  }

  const searchPattern = toPostgrestContainsPattern(search);

  if (searchPattern) {
    query = query.or(
      [
        `business_name.ilike.${searchPattern}`,
        `contact_name.ilike.${searchPattern}`,
        `phone.ilike.${searchPattern}`,
        `whatsapp_phone.ilike.${searchPattern}`,
        `gstin.ilike.${searchPattern}`,
        `state_code.ilike.${searchPattern}`,
      ].join(","),
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(rangeFrom, rangeTo);

  const { data: clients, error } = await withServerTiming(
    "dashboard.clients.query",
    () => query,
    {
      page,
      has_status_filter: selectedStatus !== "all",
      has_search_filter: Boolean(searchPattern),
    },
  );
  const pageClients = (clients ?? []).slice(0, pageSize);
  const hasNextPage = (clients?.length ?? 0) > pageSize;
  const statusCounts = statusOptions
    .filter((status) => status !== "all")
    .map((status) => ({
      status,
      count: pageClients.filter((client) => client.status === status).length,
    }));

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
        <FilterBar action="/dashboard/clients">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
            <div className="grid gap-1.5">
              <label
                htmlFor="client-search"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Search
              </label>
              <Input
                id="client-search"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Business, GSTIN, phone"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="client-status"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Status
              </label>
              <Select
                id="client-status"
                name="status"
                defaultValue={selectedStatus}
              >
                {statusOptions.map((status) => (
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
              <ActionLink href="/dashboard/clients" size="sm">
                Clear
              </ActionLink>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusCounts.map((item) => (
              <StatusChip key={item.status} tone={statusTone(item.status)}>
                {item.status.replaceAll("_", " ")}: {item.count}
              </StatusChip>
            ))}
          </div>
        </FilterBar>

        <SectionCard
          title="Client list"
          actions={<RecordCount value={pageClients.length} label="shown" />}
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

        {!error && clients && clients.length > 0 && pageClients.length === 0 && (
          <EmptyState
            title="No clients match these filters"
            message="Adjust the search or status filter to return client workspaces."
            action={<ActionLink href="/dashboard/clients">Clear filters</ActionLink>}
          />
        )}

        {!error && pageClients.length > 0 && (
          <>
            <DataTable minWidth={920} ariaLabel="Client workspaces">
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
                {pageClients.map((client) => (
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
            <PaginationControls
              basePath="/dashboard/clients"
              page={page}
              hasNext={hasNextPage}
              searchParams={filters}
              label="client records"
            />
          </>
        )}
        </SectionCard>
      </PageBody>
    </div>
  );
}
