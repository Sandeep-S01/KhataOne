import type { Metadata } from "next";

import { LeadCaptureForm } from "@/components/lead-capture-form";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Contact | KhataOne",
  description:
    "Contact KhataOne to discuss WhatsApp-first bookkeeping intake and GST workflow setup for CA firms.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contact"
      title="Talk to KhataOne"
      description="Share your firm details and current client intake workflow. The same secure demo request flow is used here and on the landing page."
    >
      <LeadCaptureForm />
    </PublicPageShell>
  );
}
