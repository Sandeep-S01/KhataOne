import Link from "next/link";
import { notFound } from "next/navigation";

import {
  approveTransactionAction,
  markDuplicateTransactionAction,
  rejectTransactionAction,
  requestClarificationAction,
} from "@/app/actions/review";
import {
  TransactionReviewForm,
  type TransactionReviewValues,
} from "@/components/transaction-review-form";
import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

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

export default async function TransactionReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { transactionId } = await params;
  const { error: actionError } = await searchParams;

  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Transaction review needs Supabase environment variables and
            migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: transaction } = await supabase
    .from("transactions")
    .select(
      "*, clients(business_name, whatsapp_phone, phone), documents(source_text, storage_path, file_name, file_mime_type), ai_extractions(risk_flags, normalized_output, confidence_score, model, prompt_version)",
    )
    .eq("id", transactionId)
    .eq("firm_id", firm!.id)
    .single();

  if (!transaction) {
    notFound();
  }

  const client = Array.isArray(transaction.clients)
    ? transaction.clients[0]
    : transaction.clients;
  const document = Array.isArray(transaction.documents)
    ? transaction.documents[0]
    : transaction.documents;
  const extraction = Array.isArray(transaction.ai_extractions)
    ? transaction.ai_extractions[0]
    : transaction.ai_extractions;
  const riskFlags = extraction?.risk_flags ?? [];

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <Link
            href="/dashboard/review-queue"
            className="text-sm font-semibold text-khata-green"
          >
            Back to review queue
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">
            Review transaction
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
            Verify extracted fields before approval. Approval creates a ledger
            handoff entry and records the CA reviewer.
          </p>
        </div>
        <StatusChip tone={statusTone(transaction.status)}>
          {transaction.status.replaceAll("_", " ")}
        </StatusChip>
      </div>

      {actionError && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-khata-danger">
          {actionError}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <TransactionReviewForm
          transaction={transaction as TransactionReviewValues}
        />

        <div className="grid gap-5">
          <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
            <p className="text-sm font-semibold">Review summary</p>
            <dl className="mt-4 grid gap-3 text-sm">
              {[
                ["Client", client?.business_name ?? "Unknown client"],
                ["Invoice", transaction.invoice_number ?? "Pending"],
                ["Amount", formatCurrency(transaction.total_amount)],
                [
                  "Confidence",
                  `${Math.round(transaction.confidence_score * 100)}%`,
                ],
                ["Source", extractionSource(extraction?.model)],
                ["File", document?.file_name ?? document?.storage_path ?? "No file"],
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
            {riskFlags.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-khata-muted">
                  Risk flags
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {riskFlags.map((flag: string) => (
                    <StatusChip key={flag} tone="warning">
                      {flag}
                    </StatusChip>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
            <p className="text-sm font-semibold">Source text</p>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-khata-border bg-khata-paper p-3 text-xs leading-5 text-khata-muted">
              {document?.source_text ||
                "No source text available yet. OCR/PDF/audio text extraction is required before media-only documents can be trusted."}
            </pre>
          </section>

          <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
            <p className="text-sm font-semibold">Decision actions</p>
            <div className="mt-4 grid gap-3">
              <form action={approveTransactionAction}>
                <input
                  type="hidden"
                  name="transaction_id"
                  value={transaction.id}
                />
                <button className="h-11 w-full rounded-md bg-khata-green px-4 text-sm font-semibold text-white">
                  Approve and create ledger handoff
                </button>
              </form>

              <div className="grid gap-3 sm:grid-cols-2">
                <form action={rejectTransactionAction}>
                  <input
                    type="hidden"
                    name="transaction_id"
                    value={transaction.id}
                  />
                  <input
                    type="hidden"
                    name="review_note"
                    value="Rejected during CA review"
                  />
                  <button className="h-10 w-full rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-khata-danger">
                    Reject
                  </button>
                </form>
                <form action={markDuplicateTransactionAction}>
                  <input
                    type="hidden"
                    name="transaction_id"
                    value={transaction.id}
                  />
                  <input
                    type="hidden"
                    name="review_note"
                    value="Marked duplicate during CA review"
                  />
                  <button className="h-10 w-full rounded-md border border-khata-border bg-khata-paper px-4 text-sm font-semibold">
                    Mark duplicate
                  </button>
                </form>
              </div>

              <form action={requestClarificationAction} className="grid gap-2">
                <input
                  type="hidden"
                  name="transaction_id"
                  value={transaction.id}
                />
                <textarea
                  name="clarification_note"
                  rows={3}
                  className="w-full resize-none rounded-md border border-khata-border bg-khata-paper px-3 py-3 text-sm outline-none transition focus:border-khata-green focus:bg-white"
                  placeholder="Ask the client for the missing invoice number, GSTIN, payment proof, or tax breakup."
                />
                <button className="h-10 rounded-md border border-khata-border bg-white px-4 text-sm font-semibold">
                  Request WhatsApp clarification
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
