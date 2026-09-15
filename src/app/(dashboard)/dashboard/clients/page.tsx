import {
  ActionLink,
  Button,
  DataTable,
  EmptyState,
  FieldLabel,
  FilterActions,
  FilterBar,
  FilterField,
  FilterGrid,
  filterActionRowClassName,
  filterControlCompactClassName,
  FormMessage,
  InputWithIcon,
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
  tableNumericTextClass,
  tablePrimaryTextClass,
  tableSecondaryTextClass,
  tableRowClass,
  TableToolbar,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import {
  normalizePage,
  normalizeSearch,
  toPostgrestContainsPattern,
} from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { withServerTiming } from "@/lib/request-performance";
import {
  appendReturnContext,
  buildReturnContext,
  clientReturnKeys,
} from "@/lib/return-context";

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
  "onboarding",
  "active",
  "pending_documents",
  "review_needed",
  "filing_ready",
  "archived",
];

const pageSize = 50;

function archiveResultMessage(result: string | undefined) {
  switch (result) {
    case "success":
      return {
        tone: "success" as const,
        message: "Client archived. The record remains available in archived filters and audit history.",
      };
    case "forbidden":
      return {
        tone: "danger" as const,
        message: "Your workspace role cannot archive clients.",
      };
    case "failed":
      return {
        tone: "danger" as const,
        message: "Could not archive the client. Please retry or contact your workspace administrator.",
      };
    case "unavailable":
      return {
        tone: "danger" as const,
        message: "Client archive is unavailable until the workspace and database are configured.",
      };
    default:
      return null;
  }
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string; archive?: string }>;
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
  const hasActiveFilters = selectedStatus !== "all" || Boolean(searchPattern);
  const archiveMessage = archiveResultMessage(filters.archive);
  const returnContext = buildReturnContext(filters, clientReturnKeys);
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
        description={`Manage client identity, WhatsApp mapping, filing cadence, and status for ${firm?.name ?? "this firm"}.`}
        actions={
        <ActionLink
          href={appendReturnContext("/dashboard/clients/new", returnContext)}
          variant="primary"
        >
          Add client
        </ActionLink>
        }
      />

      <PageBody>
        {archiveMessage && (
          <FormMessage
            tone={archiveMessage.tone}
            message={archiveMessage.message}
          />
        )}

        <FilterBar action="/dashboard/clients" className="min-w-0">
          <FilterGrid className="min-w-0 md:grid-cols-[minmax(180px,1fr)_minmax(150px,180px)]">
            <FilterField label="Search" htmlFor="client-search">
              <InputWithIcon
                id="client-search"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Business, GSTIN, phone"
                inputClassName={filterControlCompactClassName}
              />
            </FilterField>
            <FilterField label="Status" htmlFor="client-status">
              <Select
                id="client-status"
                name="status"
                defaultValue={selectedStatus}
                className={filterControlCompactClassName}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </FilterField>
          </FilterGrid>
          <FilterActions className={filterActionRowClassName}>
            <Button type="submit" size="sm" className="min-w-24">
              Apply
            </Button>
            <ActionLink href="/dashboard/clients" size="sm" className="min-w-20">
              Clear
            </ActionLink>
          </FilterActions>
          <div>
            <FieldLabel>Current page status counts</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {statusCounts.map((item) => (
                <StatusChip key={item.status} tone={statusTone(item.status)}>
                  {item.status.replaceAll("_", " ")}: {item.count}
                </StatusChip>
              ))}
            </div>
          </div>
        </FilterBar>

        <SectionCard bodyClassName="p-0">
          <TableToolbar
            title="Client list"
            meta={<RecordCount value={pageClients.length} label="shown" />}
          />

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!clients || clients.length === 0) && !hasActiveFilters && (
          <EmptyState
            title="No clients yet"
            message="Add the first business client before wiring WhatsApp ingestion, AI extraction, ledger review, and GST summaries."
          />
        )}

        {!error && (!clients || pageClients.length === 0) && hasActiveFilters && (
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
                        {client.contact_name || client.phone || "Not provided"}
                      </p>
                    </td>
                    <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                      {client.whatsapp_phone || "Not linked"}
                    </td>
                    <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                      {client.gstin || "Not provided"}
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
                        href={appendReturnContext(
                          `/dashboard/clients/${client.id}`,
                          returnContext,
                        )}
                        aria-label={`Open ${client.business_name}`}
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
