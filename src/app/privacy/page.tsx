import type { Metadata } from "next";

import {
  PublicInfoSection,
  PublicPageShell,
} from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Privacy | KhataOne",
  description:
    "Privacy summary for KhataOne demo requests and CA-controlled accounting workflows.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy"
      title="KhataOne privacy summary"
      description="This page explains the information KhataOne expects to handle as a WhatsApp-first accounting workflow platform for CA firms."
    >
      <PublicInfoSection title="Demo request information">
        <p>
          Demo forms collect contact and firm details so the KhataOne team can
          respond to the request and understand the firm&apos;s workflow needs.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="Accounting workflow data">
        <p>
          Product workflows are designed around private client documents,
          original WhatsApp message records, AI draft extraction output,
          reviewer actions, ledger handoff records, GST summaries, exports, and
          audit logs.
        </p>
      </PublicInfoSection>

      <PublicInfoSection title="Security posture">
        <p>
          KhataOne is built to keep firm-owned records tenant-scoped, preserve
          source records, and use private storage access patterns for client
          documents and generated exports.
        </p>
      </PublicInfoSection>
    </PublicPageShell>
  );
}
