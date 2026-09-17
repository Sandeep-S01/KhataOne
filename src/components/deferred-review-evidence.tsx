"use client";

import { Suspense, use, type ReactNode } from "react";

import { FieldLabel, SectionCard, mutedPanelClassName } from "@/components/design-system";
import { DocumentEvidencePanel, ExtractedSourceText } from "@/components/document-evidence-panel";
import type { DocumentEvidence } from "@/lib/document-evidence";

type Props = {
  evidence: Promise<DocumentEvidence>;
  sourceText: string;
  children?: ReactNode;
};

function ResolvedEvidence({ evidence, sourceText, children }: Props) {
  const resolved = use(evidence);
  return (
    <>
      <SectionCard
        title="Source evidence"
        description="Use the original file and extracted text as the reviewer reference before saving field edits or approving."
      >
        <DocumentEvidencePanel evidence={resolved} sourceText={sourceText} />
      </SectionCard>
      {children}
    </>
  );
}

export function DeferredReviewEvidence(props: Props) {
  return (
    <Suspense fallback={
      <SectionCard title="Source evidence">
        <div className="grid gap-4">
          <div className={mutedPanelClassName} role="status">
            <FieldLabel>Loading original preview</FieldLabel>
            {props.children && <p className="mt-2">Decision actions will be available when the evidence request finishes.</p>}
          </div>
          <ExtractedSourceText sourceText={props.sourceText} />
        </div>
      </SectionCard>
    }>
      <ResolvedEvidence {...props} />
    </Suspense>
  );
}
