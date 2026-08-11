import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "draft":
      return "info";
    case "needs_review":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
    case "duplicate":
      return "danger";
    default:
      return "neutral";
  }
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function extractionSource(model?: string | null) {
  return model === "rule_based_text_v1" ? "Rule-based extraction" : "AI extraction";
}

export default async function ReviewQueuePage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Review queue screens are ready, but extracted transactions need
            Supabase environment variables and migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      "id, client_id, transaction_type, status, transaction_date, party_name, invoice_number, total_amount, confidence_score, clients(business_name), ai_extractions(risk_flags, model)",
    )
    .eq("firm_id", firm!.id)
    .in("status", ["draft", "needs_review", "duplicate"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Review Queue
        </p>
        <h1 className="mt-2 text-3xl font-semibold">AI extraction review</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          AI-created transactions stay draft or needs-review until a CA approves
          them in the next workflow phase.
        </p>
      </div>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Extracted transactions</p>
          <span className="font-mono text-xs text-khata-muted">
            {transactions?.length ?? 0} records
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!transactions || transactions.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No review items yet</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              WhatsApp documents will appear here after text extraction and the
              AI extraction job create draft transaction records.
            </p>
          </div>
        )}

        {!error && transactions && transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Party</th>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const client = Array.isArray(transaction.clients)
                    ? transaction.clients[0]
                    : transaction.clients;
                  const extraction = Array.isArray(transaction.ai_extractions)
                    ? transaction.ai_extractions[0]
                    : transaction.ai_extractions;
                  const riskCount = extraction?.risk_flags?.length ?? 0;

                  return (
                    <tr
                      key={transaction.id}
                      className="border-t border-khata-border"
                    >
                      <td className="px-4 py-3 font-medium">
                        {client?.business_name ?? "Unknown client"}
                      </td>
                      <td className="px-4 py-3">
                        {transaction.party_name ?? "Pending"}
                        {riskCount > 0 && (
                          <p className="mt-1 text-xs text-khata-danger">
                            {riskCount} risk flag{riskCount === 1 ? "" : "s"}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-khata-muted">
                          {extractionSource(extraction?.model)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {transaction.invoice_number ?? "Pending"}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {transaction.transaction_type}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip tone={statusTone(transaction.status)}>
                          {transaction.status.replaceAll("_", " ")}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {Math.round(transaction.confidence_score * 100)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(transaction.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/review-queue/${transaction.id}`}
                          className="font-semibold text-khata-green"
                        >
                          Review
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
