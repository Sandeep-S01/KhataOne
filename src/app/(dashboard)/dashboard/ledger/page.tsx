import Link from "next/link";

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
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Ledger handoff needs Supabase environment variables and migrations.
          </p>
        </section>
      </div>
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
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Ledger
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Approved ledger handoff</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Filter approved handoff entries, inspect source transactions, and
          correct ledger mapping without silently rewriting extraction history.
        </p>
      </div>

      <form className="mb-5 grid gap-3 rounded-lg border border-khata-border bg-white p-4 shadow-sm md:grid-cols-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Client
          </span>
          <select
            name="client"
            defaultValue={filters.client ?? ""}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          >
            <option value="">All clients</option>
            {clients?.map((client) => (
              <option key={client.id} value={client.id}>
                {client.business_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            From
          </span>
          <input
            name="from"
            type="date"
            defaultValue={filters.from ?? ""}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            To
          </span>
          <input
            name="to"
            type="date"
            defaultValue={filters.to ?? ""}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Account
          </span>
          <input
            name="account"
            type="search"
            defaultValue={filters.account ?? ""}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          />
        </label>

        <div className="flex items-end gap-2">
          <button className="h-10 rounded-md bg-khata-green px-4 text-sm font-semibold text-white">
            Apply
          </button>
          <Link
            href="/dashboard/ledger"
            className="inline-flex h-10 items-center rounded-md border border-khata-border bg-white px-4 text-sm font-semibold"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Entries", String(entries?.length ?? 0)],
          ["Debit", formatCurrency(totalDebit)],
          ["Credit", formatCurrency(totalCredit)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-khata-border bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase text-khata-muted">
              {label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Ledger entries</p>
          <span className="font-mono text-xs text-khata-muted">
            {entries?.length ?? 0} records
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!entries || entries.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No ledger entries found</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              Approve a review queue transaction or adjust filters to view
              ledger handoff records.
            </p>
          </div>
        )}

        {!error && entries && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 text-right font-medium">Debit</th>
                  <th className="px-4 py-3 text-right font-medium">Credit</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
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
                    <tr key={entry.id} className="border-t border-khata-border">
                      <td className="px-4 py-3 font-mono text-xs">
                        {entry.entry_date ?? "Pending"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {client?.business_name ?? "Unknown client"}
                      </td>
                      <td className="px-4 py-3">{entry.account_name}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs">
                          {transaction?.invoice_number ?? "Pending invoice"}
                        </p>
                        <p className="text-xs text-khata-muted">
                          {transaction?.party_name ??
                            transaction?.transaction_type ??
                            "Source transaction"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(entry.debit_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(entry.credit_amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/ledger/${entry.id}`}
                          className="font-semibold text-khata-green"
                        >
                          Open
                        </Link>
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
