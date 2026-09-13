import { notFound } from "next/navigation";

import {
  ActionLink,
  DetailList,
  FieldLabel,
  FormMessage,
  InfoNote,
  PageBody,
  PageHeader,
  PermissionNotice,
  SectionCard,
  SetupRequired,
} from "@/components/design-system";
import { DocumentEvidencePanel } from "@/components/document-evidence-panel";
import { StatusChip } from "@/components/status-chip";
import { type TransactionReviewValues } from "@/components/transaction-review-form";
import { TransactionReviewWorkspace } from "@/components/transaction-review-workspace";
import { hasSupabaseConfig } from "@/lib/env";
import { getDocumentEvidence } from "@/lib/document-evidence";
import { getFirmContext } from "@/lib/firms";
import { canReviewTransactions, readOnlyRoleMessage } from "@/lib/permissions";
import {
  dashboardReturnHref,
  reviewQueueReturnKeys,
  sanitizeReturnContext,
} from "@/lib/return-context";

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
    return "Not provided";
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
  searchParams: Promise<{ error?: string; return_to?: string }>;
}) {
  const { transactionId } = await params;
  const { error: actionError, return_to: rawReturnContext } = await searchParams;
  const returnContext = sanitizeReturnContext(rawReturnContext, reviewQueueReturnKeys);
  const reviewQueueHref = dashboardReturnHref(
    "/dashboard/review-queue",
    returnContext,
    reviewQueueReturnKeys,
  );

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
  const canReviewTransaction = canReviewTransactions(firm.role);
  const summaryItems = [
    { label: "Client", value: client?.business_name ?? "Unknown client" },
    { label: "Invoice", value: transaction.invoice_number ?? "Not provided", mono: true },
    { label: "Amount", value: formatCurrency(transaction.total_amount), mono: true },
    { label: "Confidence", value: `${Math.round(transaction.confidence_score * 100)}%`, mono: true },
    { label: "Source", value: extractionSource(extraction?.model) },
    { label: "File", value: document?.file_name ?? document?.storage_path ?? "No file" },
  ];
  const sourceText =
    document?.source_text ||
    "No source text available yet. OCR/PDF/audio text extraction is required before media-only documents can be trusted.";
  const evidence = await getDocumentEvidence({ document, supabase });

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
          <ActionLink href={reviewQueueHref}>
            Back to review queue
          </ActionLink>
        }
      />

      {actionError && (isPosted || !canReviewTransaction) && (
        <FormMessage message={actionError} className="mx-4 mt-4 md:mx-6" />
      )}

      <PageBody className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] xl:items-start">
        {isPosted || !canReviewTransaction ? (
          <>
            <SectionCard title={isPosted ? "Posted transaction" : "Read-only access"}>
              {isPosted ? (
                <InfoNote>
                  This approved record is read-only. Use its ledger handoff for
                  mapping corrections; changing the source requires an audited
                  reversal workflow.
                </InfoNote>
              ) : (
                <PermissionNotice message={readOnlyRoleMessage} />
              )}
            </SectionCard>

            <div className="grid gap-4 xl:sticky xl:top-20">
              <SectionCard title="Review summary">
                <DetailList items={summaryItems} />
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
                description="Use the original file and extracted text as the reviewer reference before saving field edits or approving."
              >
                <DocumentEvidencePanel evidence={evidence} sourceText={sourceText} />
              </SectionCard>
            </div>
          </>
        ) : (
          <TransactionReviewWorkspace
            transaction={transaction as TransactionReviewValues}
            reviewError={actionError}
            summaryItems={summaryItems}
            riskFlags={riskFlags}
            evidence={evidence}
            sourceText={sourceText}
            returnContext={returnContext}
          />
        )}
      </PageBody>
    </div>
  );
}
