import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";

const assurances = [
  "Create one firm workspace for reviewed accounting work.",
  "Invite clients into a WhatsApp-first intake flow after setup.",
  "Keep extraction draft-first until a reviewer approves it.",
  "Use approved records for GST summaries, reports and exports.",
];

const setupItems = [
  ["Firm profile", "Owner details"],
  ["Review policy", "Approval first"],
  ["Export path", "Reviewed records"],
  ["GST workflow", "Period ready"],
];

export const metadata: Metadata = {
  title: "Create account | KhataOne",
  description:
    "Create a KhataOne CA firm workspace for WhatsApp-first intake, draft extraction, CA review, GST summaries, and exports.",
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupPage() {
  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 sm:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            aria-label="KhataOne home"
            className="inline-flex rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            <BrandLogo />
          </Link>

          <h1 className="mt-8 text-2xl font-semibold tracking-normal text-khata-ink">
            Create your firm workspace
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-khata-muted">
            Set up your firm account so your team can review documents, approve
            draft entries and keep GST work traceable.
          </p>

          <AuthForm mode="signup" />

          <div className="my-6 flex items-center gap-3 text-xs text-khata-muted">
            <div className="h-px flex-1 bg-khata-border" />
            <span>Already registered?</span>
            <div className="h-px flex-1 bg-khata-border" />
          </div>

          <Link
            href="/login"
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-khata-border bg-transparent px-4 py-2 text-sm font-medium text-khata-ink shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            Sign in to existing workspace
          </Link>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-khata-muted transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to website
          </Link>
        </div>
      </div>

      <aside className="hidden flex-col justify-center border-l border-khata-border bg-khata-paperMuted px-12 lg:flex">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold tracking-normal text-khata-ink">
            Start with a firm account. Add workflow detail after registration.
          </h2>

          <div className="mt-6 grid gap-3 text-sm text-khata-muted">
            {assurances.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-khata-green"
                  aria-hidden="true"
                />
                <p className="leading-5">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-md border border-khata-border bg-white p-4 shadow-sm">
            <p className="k-eyebrow text-khata-muted">Setup path</p>
            <dl className="mt-2 grid gap-1 text-sm">
              {setupItems.map(([title, description]) => (
                <div
                  key={title}
                  className="flex justify-between gap-4"
                >
                  <dt className="text-khata-ink">{title}</dt>
                  <dd className="text-right text-khata-muted">{description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </aside>
    </section>
  );
}
