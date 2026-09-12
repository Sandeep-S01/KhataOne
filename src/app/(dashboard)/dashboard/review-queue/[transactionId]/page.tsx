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
import {
  ActionLink,
  Button,
  DetailList,
  FieldLabel,
  FormMessage,
  InfoNote,
  PageBody,
  PageHeader,
  SectionCard,
  SetupRequired,
  Textarea,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

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
      <SetupRequired message="Connect Supabase environment variables and migrations before reviewing transactions." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const { data: transaction } = await supabase
    .from("transactions")
    .select(
      "*, clients(business_name, whatsapp_phone, phone), documents(source_text, storage_path, file_name, file_mime_type), ai_extractions(risk_flags, normalized_output, confidence_score, model, prompt_version)",
    )
    .eq("id", transactionId)
    .eq("firm_id", firm.id)
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
  const isPosted = ["approved", "exported"].includes(transaction.status);

  return (
    <div>
      <PageHeader
        eyebrow="Review Queue"
        title="Review transaction"
        description="Verify extracted fields before approval. Approval creates a ledger handoff entry and records the CA reviewer."
        meta={
          <StatusChip tone={statusTone(transaction.status)}>
            {transaction.status.replaceAll("_", " ")}
          </StatusChip>
        }
        actions={
          <ActionLink href="/dashboard/review-queue">
            Back to review queue
          </ActionLink>
        }
      />

      {actionError && (
        <FormMessage message={actionError} className="mx-4 mt-4 md:mx-6" />
      )}

      <PageBody className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] xl:items-start">
        {isPosted ? (
          <SectionCard title="Posted transaction">
            <InfoNote>
              This approved record is read-only. Use its ledger handoff for mapping
              corrections; changing the source requires an audited reversal workflow.
            </InfoNote>
          </SectionCard>
        ) : (
          <TransactionReviewForm
            transaction={transaction as TransactionReviewValues}
          />
        )}

        <div className="grid gap-4 xl:sticky xl:top-20">
          <SectionCard title="Review summary">
            <DetailList
              items={[
                { label: "Client", value: client?.business_name ?? "Unknown client" },
                { label: "Invoice", value: transaction.invoice_number ?? "Pending", mono: true },
                { label: "Amount", value: formatCurrency(transaction.total_amount), mono: true },
                { label: "Confidence", value: `${Math.round(transaction.confidence_score * 100)}%`, mono: true },
                { label: "Source", value: extractionSource(extraction?.model) },
                { label: "File", value: document?.file_name ?? document?.storage_path ?? "No file" },
              ]}
            />
            {riskFlags.length > 0 && (
              <div className="mt-4">
                <FieldLabel>
                  Risk flags
                </FieldLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {riskFlags.map((flag: string) => (
                    <StatusChip key={flag} tone="warning">
                      {flag}
                    </StatusChip>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Source evidence"
            description="Use the original extracted text as the reviewer reference before saving field edits or approving."
          >
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-khata-border bg-khata-paper p-3 text-xs leading-5 text-khata-muted">
              {document?.source_text ||
                "No source text available yet. OCR/PDF/audio text extraction is required before media-only documents can be trusted."}
            </pre>
          </SectionCard>

          {!isPosted && <SectionCard title="Decision actions">
            <div className="grid gap-3">
              <InfoNote>
                Approval creates a ledger handoff entry and records the reviewer
                decision in audit logs.
              </InfoNote>

              <form action={approveTransactionAction}>
                <input
                  type="hidden"
                  name="transaction_id"
                  value={transaction.id}
                />
                <Button type="submit" className="w-full">
                  Approve and create ledger handoff
                </Button>
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
                  <Button type="submit" variant="danger" className="w-full">
                    Reject
                  </Button>
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
                  <Button type="submit" variant="secondary" className="w-full">
                    Mark duplicate
                  </Button>
                </form>
              </div>

              <form action={requestClarificationAction} className="grid gap-2">
                <input
                  type="hidden"
                  name="transaction_id"
                  value={transaction.id}
                />
                <Textarea
                  name="clarification_note"
                  rows={3}
                  placeholder="Ask the client for the missing invoice number, GSTIN, payment proof, or tax breakup."
                />
                <Button type="submit" variant="outline">
                  Request WhatsApp clarification
                </Button>
              </form>
            </div>
          </SectionCard>}
        </div>
      </PageBody>
    </div>
  );
}
