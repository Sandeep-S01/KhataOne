import {
  ActionLink,
  Button,
  DataTable,
  EmptyState,
  FieldLabel,
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
  StatTile,
  TextLink,
  tableActionCellClass,
  tableActionHeadCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableMonoTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tablePrimaryTextClass,
  tableSecondaryTextClass,
  tableRowClass,
} from "@/components/design-system";
import { normalizePage } from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { formatDisplayDate } from "@/lib/format";
import { withServerTiming } from "@/lib/request-performance";

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

const pageSize = 50;

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

  return (
    <div>
      <PageHeader
        eyebrow="Ledger"
        title="Approved ledger handoff"
        description="Inspect approved handoffs and make audited ledger corrections."
      />

      <PageBody>
      <FilterBar action="/dashboard/ledger" className="md:grid-cols-5">
        <label className="block">
          <FieldLabel>
            Client
          </FieldLabel>
          <Select
            name="client"
            defaultValue={filters.client ?? ""}
            className="mt-1"
          >
            <option value="">All clients</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.business_name}
              </option>
            ))}
          </Select>
        </label>

        <label className="block">
          <FieldLabel>
            From
          </FieldLabel>
          <Input
            name="from"
            type="date"
            defaultValue={filters.from ?? ""}
            className="mt-1"
          />
        </label>

        <label className="block">
          <FieldLabel>
            To
          </FieldLabel>
          <Input
            name="to"
            type="date"
            defaultValue={filters.to ?? ""}
            className="mt-1"
          />
        </label>

        <label className="block">
          <FieldLabel>
            Account
          </FieldLabel>
          <Input
            name="account"
            type="search"
            defaultValue={filters.account ?? ""}
            className="mt-1"
          />
        </label>

        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Apply
          </Button>
          <ActionLink href="/dashboard/ledger" size="sm">
            Clear
          </ActionLink>
        </div>

        {activeFilters.length > 0 && (
          <div className="md:col-span-5">
            <FieldLabel>Active filters</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-md border border-khata-border bg-khata-paperMuted px-2 py-1 text-xs font-medium text-khata-muted"
                >
                  {filter}
                </span>
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

      <SectionCard
        title="Ledger entries"
        actions={<RecordCount value={pageEntries.length} label="shown" />}
        bodyClassName="p-0"
      >

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
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {formatDisplayDate(entry.entry_date)}
                      </td>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {client?.business_name ?? "Unknown client"}
                      </td>
                      <td className={tableCellClass}>{entry.account_name}</td>
                      <td className={tableCellClass}>
                        <p className={tableMonoTextClass}>
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
                          href={`/dashboard/ledger/${entry.id}`}
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
