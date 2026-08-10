import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function LedgerEntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 text-sm leading-6 text-khata-muted">
            Ledger entry detail needs Supabase environment variables and
            migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("ledger_entries")
    .select(
      "*, clients(business_name), transactions(id, invoice_number, party_name, transaction_type, status, total_amount)",
    )
    .eq("id", entryId)
    .eq("firm_id", firm!.id)
    .single();

  if (!entry) {
    notFound();
  }

  const client = Array.isArray(entry.clients) ? entry.clients[0] : entry.clients;
  const transaction = Array.isArray(entry.transactions)
    ? entry.transactions[0]
    : entry.transactions;
  const { data: audits } = await supabase
    .from("audit_logs")
    .select("id, action, actor_user_id, metadata, created_at")
    .eq("firm_id", firm!.id)
    .eq("entity_type", "ledger_entry")
    .eq("entity_id", entry.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <Link
            href="/dashboard/ledger"
            className="text-sm font-semibold text-khata-green"
          >
            Back to ledger
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Ledger entry</h1>
          <p className="mt-2 text-sm leading-6 text-khata-muted">
            Inspect the approved handoff and its correction history.
          </p>
        </div>
        <Link
          href={`/dashboard/ledger/${entry.id}/edit`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-khata-green px-4 text-sm font-semibold text-white shadow-ledger"
        >
          Correct entry
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <p className="text-sm font-semibold">Entry details</p>
          <dl className="mt-4 grid gap-4 text-sm">
            {[
              ["Client", client?.business_name ?? "Unknown client"],
              ["Date", entry.entry_date ?? "Pending"],
              ["Account", entry.account_name],
              ["Debit", formatCurrency(entry.debit_amount)],
              ["Credit", formatCurrency(entry.credit_amount)],
              ["Narration", entry.narration ?? "No narration"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[120px_1fr] gap-3 border-b border-khata-border pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="text-khata-muted">{label}</dt>
                <dd className={label === "Debit" || label === "Credit" ? "font-mono" : "font-medium"}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <p className="text-sm font-semibold">Source transaction</p>
          <dl className="mt-4 grid gap-4 text-sm">
            {[
              ["Invoice", transaction?.invoice_number ?? "Pending"],
              ["Party", transaction?.party_name ?? "Pending"],
              ["Type", transaction?.transaction_type ?? "Unknown"],
              ["Status", transaction?.status ?? "Unknown"],
              ["Amount", formatCurrency(transaction?.total_amount ?? null)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[120px_1fr] gap-3 border-b border-khata-border pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="text-khata-muted">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {transaction?.id && (
            <Link
              href={`/dashboard/review-queue/${transaction.id}`}
              className="mt-5 inline-flex text-sm font-semibold text-khata-green"
            >
              Open review source
            </Link>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Correction audit</p>
        </div>
        {!audits || audits.length === 0 ? (
          <div className="p-5 text-sm text-khata-muted">
            No corrections recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => {
                  const metadata =
                    audit.metadata &&
                    typeof audit.metadata === "object" &&
                    "correction_note" in audit.metadata
                      ? audit.metadata
                      : null;

                  return (
                    <tr key={audit.id} className="border-t border-khata-border">
                      <td className="px-4 py-3 font-medium">{audit.action}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {audit.actor_user_id ?? "system"}
                      </td>
                      <td className="px-4 py-3 text-khata-muted">
                        {metadata?.correction_note || "No note"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {new Date(audit.created_at).toLocaleString("en-IN")}
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
