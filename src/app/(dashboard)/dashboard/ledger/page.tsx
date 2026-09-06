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
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

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
};

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

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name")
    .eq("firm_id", firm!.id)
    .neq("status", "archived")
    .order("business_name");

  let query = supabase
    .from("ledger_entries")
    .select(
      "id, transaction_id, entry_date, account_name, debit_amount, credit_amount, narration, clients(business_name), transactions(invoice_number, party_name, transaction_type)",
    )
    .eq("firm_id", firm!.id)
    .order("entry_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

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

  const { data: entries, error } = await query;
  const totalDebit =
    entries?.reduce((sum, entry) => sum + Number(entry.debit_amount ?? 0), 0) ??
    0;
  const totalCredit =
    entries?.reduce((sum, entry) => sum + Number(entry.credit_amount ?? 0), 0) ??
    0;

  return (
    <div>
      <PageHeader
        eyebrow="Ledger"
        title="Approved ledger handoff"
        description="Filter approved handoff entries, inspect source transactions, and correct ledger mapping without silently rewriting extraction history."
      />

      <PageBody>
      <FilterBar className="md:grid-cols-5">
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
          <ActionLink href="/dashboard/ledger">Clear</ActionLink>
        </div>
      </FilterBar>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Entries", String(entries?.length ?? 0), "neutral"],
          ["Debit", formatCurrency(totalDebit), "brand"],
          ["Credit", formatCurrency(totalCredit), "success"],
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
        actions={<RecordCount value={entries?.length ?? 0} />}
        bodyClassName="p-0"
      >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!entries || entries.length === 0) && (
          <EmptyState
            title="No ledger entries found"
            message="Approve a review queue transaction or adjust filters to view ledger handoff records."
          />
        )}

        {!error && entries && entries.length > 0 && (
          <DataTable minWidth={980}>
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
                {entries.map((entry) => {
                  const client = Array.isArray(entry.clients)
                    ? entry.clients[0]
                    : entry.clients;
                  const transaction = Array.isArray(entry.transactions)
                    ? entry.transactions[0]
                    : entry.transactions;

                  return (
                    <tr key={entry.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {entry.entry_date ?? "Pending"}
                      </td>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {client?.business_name ?? "Unknown client"}
                      </td>
                      <td className={tableCellClass}>{entry.account_name}</td>
                      <td className={tableCellClass}>
                        <p className={tableMonoTextClass}>
                          {transaction?.invoice_number ?? "Pending invoice"}
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
                        >
                          Open
                        </TextLink>
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
