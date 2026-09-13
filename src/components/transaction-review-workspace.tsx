"use client";

import {
  approveTransactionAction,
  markDuplicateTransactionAction,
  rejectTransactionAction,
  requestClarificationAction,
} from "@/app/actions/review";
import { DocumentEvidencePanel } from "@/components/document-evidence-panel";
import {
  Button,
  DetailList,
  FieldLabel,
  FormMessage,
  InfoNote,
  SectionCard,
  Textarea,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import type { DocumentEvidence } from "@/lib/document-evidence";
import {
  TransactionReviewForm,
  type TransactionReviewValues,
} from "@/components/transaction-review-form";
import { type ComponentPropsWithoutRef, useState } from "react";
import { useFormStatus } from "react-dom";

type ReviewSummaryItem = {
  label: string;
  value: string;
  mono?: boolean;
};

type TransactionReviewWorkspaceProps = {
  transaction: TransactionReviewValues;
  reviewError?: string;
  summaryItems: ReviewSummaryItem[];
  riskFlags: string[];
  evidence: DocumentEvidence;
  sourceText: string;
  returnContext?: string;
};

const unsavedDecisionMessage =
  "Save review edits before approving, rejecting, marking duplicate, or requesting clarification.";

function DecisionSubmitButton({
  blocked,
  pendingLabel,
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Button>, "disabled" | "type"> & {
  blocked: boolean;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const disabled = blocked || pending;

  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled}
      aria-busy={pending}
      aria-disabled={disabled}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

function ClarificationFields({
  blocked,
  clarificationLabelId,
  clarificationHelpId,
  dirtyDescriptionId,
}: {
  blocked: boolean;
  clarificationLabelId: string;
  clarificationHelpId: string;
  dirtyDescriptionId: string;
}) {
  const { pending } = useFormStatus();
  const disabled = blocked || pending;

  return (
    <>
      <label className="grid gap-1.5">
        <FieldLabel id={clarificationLabelId}>
          Clarification message
        </FieldLabel>
        <Textarea
          name="clarification_note"
          rows={3}
          aria-labelledby={clarificationLabelId}
          aria-describedby={clarificationHelpId}
          placeholder="Ask for the missing invoice number, GSTIN, payment proof, or tax breakup."
          disabled={disabled}
        />
      </label>
      <p id="review-clarification-help" className="text-xs text-khata-muted">
        Sends a WhatsApp clarification request and records the action in audit
        logs.
      </p>
      <Button
        type="submit"
        variant="outline"
        disabled={disabled}
        aria-busy={pending}
        aria-disabled={disabled}
        aria-describedby={blocked ? dirtyDescriptionId : clarificationHelpId}
      >
        {pending ? "Requesting clarification..." : "Request WhatsApp clarification"}
      </Button>
    </>
  );
}

export function TransactionReviewWorkspace({
  transaction,
  reviewError,
  summaryItems,
  riskFlags,
  evidence,
  sourceText,
  returnContext = "",
}: TransactionReviewWorkspaceProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const dirtyDescriptionId = "review-unsaved-decision-note";
  const clarificationLabelId = "review-clarification-label";
  const clarificationHelpId = hasUnsavedChanges
    ? dirtyDescriptionId
    : "review-clarification-help";

  return (
    <>
      <TransactionReviewForm
        transaction={transaction}
        onDirtyChange={setHasUnsavedChanges}
        returnContext={returnContext}
      />

      <div className="grid gap-4 xl:sticky xl:top-20">
        <SectionCard title="Review summary">
          <DetailList items={summaryItems} />
          {riskFlags.length > 0 && (
            <div className="mt-4">
              <FieldLabel>
                Risk flags
              </FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {riskFlags.map((flag) => (
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

        <SectionCard title="Decision actions">
          <div className="grid gap-3">
            <InfoNote>
              Approval creates a ledger handoff entry and records the reviewer
              decision in audit logs.
            </InfoNote>

            {reviewError && <FormMessage message={reviewError} />}

            {hasUnsavedChanges && (
              <div
                id={dirtyDescriptionId}
                role="status"
                className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm leading-6 text-warning"
              >
                {unsavedDecisionMessage}
              </div>
            )}

            <form action={approveTransactionAction}>
              <input
                type="hidden"
                name="transaction_id"
                value={transaction.id}
              />
              {returnContext && (
                <input type="hidden" name="return_context" value={returnContext} />
              )}
              <DecisionSubmitButton
                className="w-full"
                blocked={hasUnsavedChanges}
                pendingLabel="Approving..."
                aria-describedby={
                  hasUnsavedChanges ? dirtyDescriptionId : undefined
                }
              >
                Approve and create ledger handoff
              </DecisionSubmitButton>
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
                {returnContext && (
                  <input type="hidden" name="return_context" value={returnContext} />
                )}
                <DecisionSubmitButton
                  variant="danger"
                  className="w-full"
                  blocked={hasUnsavedChanges}
                  pendingLabel="Rejecting..."
                  aria-describedby={
                    hasUnsavedChanges ? dirtyDescriptionId : undefined
                  }
                >
                  Reject
                </DecisionSubmitButton>
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
                {returnContext && (
                  <input type="hidden" name="return_context" value={returnContext} />
                )}
                <DecisionSubmitButton
                  variant="secondary"
                  className="w-full"
                  blocked={hasUnsavedChanges}
                  pendingLabel="Marking duplicate..."
                  aria-describedby={
                    hasUnsavedChanges ? dirtyDescriptionId : undefined
                  }
                >
                  Mark duplicate
                </DecisionSubmitButton>
              </form>
            </div>

            <form
              action={requestClarificationAction}
              className="grid gap-2"
              aria-describedby={clarificationHelpId}
            >
              <input
                type="hidden"
                name="transaction_id"
                value={transaction.id}
              />
              {returnContext && (
                <input type="hidden" name="return_context" value={returnContext} />
              )}
              <ClarificationFields
                blocked={hasUnsavedChanges}
                clarificationLabelId={clarificationLabelId}
                clarificationHelpId={clarificationHelpId}
                dirtyDescriptionId={dirtyDescriptionId}
              />
            </form>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
