import type { Metadata } from "next";

import {
  PublicInfoSection,
  PublicPageShell,
} from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Terms | KhataOne",
  description:
    "Terms summary for KhataOne's CA-controlled WhatsApp-first accounting workflow.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms"
      title="KhataOne terms summary"
      description="KhataOne is intended for CA firms and accounting teams that need a controlled workflow for client document intake, review, GST summary preparation, and exports."
    >
      <PublicInfoSection title="Human review">
        <p>
          AI extraction prepares draft accounting data. A reviewer from the CA
          firm is responsible for checking and approving entries before ledger
          handoff or export.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="GST boundary">
        <p>
          Production v1 prepares GST summaries, readiness signals, and export
          data. Direct GST filing is not represented as live unless a verified
          provider integration is implemented and compliance-approved.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="Firm responsibility">
        <p>
          Firms remain responsible for reviewing client documents, accounting
          classifications, tax treatment, exports, and filings before using any
          KhataOne-generated output in professional work.
        </p>
      </PublicInfoSection>
    </PublicPageShell>
  );
}
