import {
  ActionLink,
  Button,
  DataTable,
  EmptyState,
  FieldLabel,
  FilterActions,
  FilterBar,
  FilterDateRangeField,
  FilterGrid,
  filterInlineActionsClassName,
  filterInlineButtonClassName,
  filterInlineControlClassName,
  FilterInlineField,
  InputWithIcon,
  PageBody,
  PageHeader,
  PaginationControls,
  QueryError,
  RecordCount,
  SectionCard,
  TableToolbar,
  Select,
  SetupRequired,
  StatusBadge,
  StatTile,
  TextLink,
  tableActionCellClass,
  tableActionHeadCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableNumericTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tablePrimaryTextClass,
  tableSecondaryTextClass,
  tableRowClass,
} from "@/components/design-system";
import { dashboardPageSize, normalizePage } from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { formatDisplayDate } from "@/lib/format";
import { withServerTiming } from "@/lib/request-performance";
import {
  appendReturnContext,
  buildReturnContext,
  ledgerReturnKeys,
} from "@/lib/return-context";

export const dynamic = "force-dynamic";

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

type SearchParams = {
  client?: string;
  from?: string;
  to?: string;
  account?: string;
  page?: string;
};

const pageSize = dashboardPageSize;

function activeFilterSummary(filters: SearchParams) {
  return [
    filters.client ? "Client selected" : null,
    filters.from ? `From ${filters.from}` : null,
    filters.to ? `To ${filters.to}` : null,
    filters.account ? `Account: ${filters.account}` : null,
  ].filter(Boolean);
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing approved ledger handoff records." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const page = normalizePage(filters.page);
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize;
  const clientsQuery = supabase
    .from("clients")
    .select("id, business_name")
    .eq("firm_id", firm.id)
    .neq("status", "archived")
    .order("business_name");

  let query = supabase
    .from("ledger_entries")
    .select(
      "id, transaction_id, entry_date, account_name, debit_amount, credit_amount, narration, clients(business_name), transactions(invoice_number, party_name, transaction_type)",
    )
    .eq("firm_id", firm.id)
    .order("entry_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (filters.client) {
    query = query.eq("client_id", filters.client);
  }

  if (filters.from) {
    query = query.gte("entry_date", filters.from);
  }

  if (filters.to) {
    query = query.lte("entry_date", filters.to);
  }

  if (filters.account) {
    query = query.ilike("account_name", `%${filters.account}%`);
  }

  const [{ data: entries, error }, { data: clients }] = await Promise.all([
    withServerTiming("dashboard.ledger.query", () => query, {
      page,
      has_client_filter: Boolean(filters.client),
      has_date_filter: Boolean(filters.from || filters.to),
      has_account_filter: Boolean(filters.account),
    }),
    withServerTiming("dashboard.ledger.clients_query", () => clientsQuery, {
      page,
    }),
  ]);
  const pageEntries = (entries ?? []).slice(0, pageSize);
  const hasNextPage = (entries?.length ?? 0) > pageSize;
  const totalDebit =
    pageEntries.reduce((sum, entry) => sum + Number(entry.debit_amount ?? 0), 0) ??
    0;
  const totalCredit =
    pageEntries.reduce((sum, entry) => sum + Number(entry.credit_amount ?? 0), 0) ??
    0;
  const activeFilters = activeFilterSummary(filters);
  const returnContext = buildReturnContext(filters, ledgerReturnKeys);

  return (
    <div>
      <PageHeader
        eyebrow="Ledger"
        title="Approved ledger handoff"
        description="Inspect approved handoffs and make audited ledger corrections."
      />

      <PageBody>
      <FilterBar action="/dashboard/ledger" className="min-w-0">
        <FilterGrid className="min-w-0 items-center md:grid-cols-2 xl:grid-cols-[minmax(160px,0.8fr)_minmax(180px,0.85fr)_minmax(260px,1fr)_auto]">
          <FilterInlineField label="Client" htmlFor="ledger-client">
            <Select
              id="ledger-client"
              name="client"
              defaultValue={filters.client ?? ""}
              className={filterInlineControlClassName}
            >
              <option value="">All clients</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.business_name}
                </option>
              ))}
            </Select>
          </FilterInlineField>

          <FilterInlineField label="Account" htmlFor="ledger-account">
            <InputWithIcon
              id="ledger-account"
              name="account"
              type="search"
              defaultValue={filters.account ?? ""}
              placeholder="Account name"
              inputClassName={filterInlineControlClassName}
            />
          </FilterInlineField>

          <FilterDateRangeField
            fromId="ledger-from"
            toId="ledger-to"
            fromName="from"
            toName="to"
            fromDefaultValue={filters.from ?? ""}
            toDefaultValue={filters.to ?? ""}
            className="md:col-span-2 xl:col-span-1"
          />

          <FilterActions className={filterInlineActionsClassName}>
            <Button type="submit" size="sm" className={filterInlineButtonClassName}>
              Apply
            </Button>
            <ActionLink href="/dashboard/ledger" size="sm" className={filterInlineButtonClassName}>
              Clear
            </ActionLink>
          </FilterActions>
        </FilterGrid>

        {activeFilters.length > 0 && (
          <div>
            <FieldLabel>Active filters</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <StatusBadge
                  key={filter}
                  tone="neutral"
                  className="capitalize"
                >
                  {filter}
                </StatusBadge>
              ))}
            </div>
          </div>
        )}
      </FilterBar>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Page entries", String(pageEntries.length), "neutral"],
          ["Page debit", formatCurrency(totalDebit), "brand"],
          ["Page credit", formatCurrency(totalCredit), "success"],
        ].map(([label, value, tone]) => (
          <StatTile
            key={label}
            label={label}
            value={value}
            tone={tone as "neutral" | "brand" | "success"}
          />
        ))}
      </div>

      <SectionCard bodyClassName="p-0">
        <TableToolbar
          title="Ledger entries"
          meta={<RecordCount value={pageEntries.length} label="shown" />}
        />

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!entries || entries.length === 0) && (
          <EmptyState
            title="No ledger entries found"
            message={
              activeFilters.length > 0
                ? "Adjust or clear filters to view approved ledger handoff records."
                : "Approve a review queue transaction to create ledger handoff records."
            }
            action={
              activeFilters.length > 0 ? (
                <ActionLink href="/dashboard/ledger">Clear filters</ActionLink>
              ) : undefined
            }
          />
        )}

        {!error && pageEntries.length > 0 && (
          <>
            <DataTable minWidth={980} ariaLabel="Ledger handoff entries">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Date</th>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Account</th>
                  <th className={tableHeadCellClass}>Source</th>
                  <th className={tableNumericHeadCellClass}>Debit</th>
                  <th className={tableNumericHeadCellClass}>Credit</th>
                  <th className={tableActionHeadCellClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageEntries.map((entry) => {
                  const client = Array.isArray(entry.clients)
                    ? entry.clients[0]
                    : entry.clients;
                  const transaction = Array.isArray(entry.transactions)
                    ? entry.transactions[0]
                    : entry.transactions;

                  return (
                    <tr key={entry.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                        {formatDisplayDate(entry.entry_date)}
                      </td>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {client?.business_name ?? "Unknown client"}
                      </td>
                      <td className={tableCellClass}>{entry.account_name}</td>
                      <td className={tableCellClass}>
                        <p className={tableNumericTextClass}>
                          {transaction?.invoice_number ?? "Invoice not provided"}
                        </p>
                        <p className={tableSecondaryTextClass}>
                          {transaction?.party_name ??
                            transaction?.transaction_type ??
                            "Source transaction"}
                        </p>
                      </td>
                      <td className={tableNumericCellClass}>
                        {formatCurrency(entry.debit_amount)}
                      </td>
                      <td className={tableNumericCellClass}>
                        {formatCurrency(entry.credit_amount)}
                      </td>
                      <td className={tableActionCellClass}>
                        <TextLink
                          href={appendReturnContext(
                            `/dashboard/ledger/${entry.id}`,
                            returnContext,
                          )}
                          aria-label={`Open ledger entry for ${client?.business_name ?? "unknown client"}`}
                        >
                          Open
                        </TextLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            <PaginationControls
              basePath="/dashboard/ledger"
              page={page}
              hasNext={hasNextPage}
              searchParams={filters}
              label="ledger records"
            />
          </>
        )}
      </SectionCard>
      </PageBody>
    </div>
  );
}
