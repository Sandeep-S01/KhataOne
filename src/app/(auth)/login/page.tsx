import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import {
  ActionLink,
  authBackLinkClassName,
  authSidePanelSurfaceClassName,
  functionalIconClassName,
  functionalIconStrokeWidth,
  publicBrandHomeLinkClassName,
} from "@/components/design-system";

const assurances = [
  "Client documents arrive on WhatsApp and stay preserved as the source.",
  "Extraction prepares reviewable accounting fields with warnings.",
  "Approval creates exactly one ledger handoff, with a full audit trail.",
  "GST readiness is derived only from approved transactions.",
];

const controlItems = [
  ["Source trail", "Preserved"],
  ["Review policy", "Required"],
  ["Ledger handoff", "Approved only"],
  ["GST summaries", "Reviewed data"],
];

export const metadata: Metadata = {
  title: "Sign in | KhataOne",
  description:
    "Sign in to the KhataOne CA firm workspace for document review, ledger handoff, GST summaries, and exports.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 sm:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            aria-label="KhataOne home"
            className={publicBrandHomeLinkClassName}
          >
            <BrandLogo />
          </Link>

          <h1 className="mt-8 text-2xl font-semibold tracking-normal text-khata-ink">
            Sign in to your workspace
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-khata-muted">
            Sign in with your work email to continue reviewing documents, draft
            entries and GST-period work.
          </p>

          <AuthForm mode="login" />

          <div className="my-6 flex items-center gap-3 text-xs text-khata-muted">
            <div className="h-px flex-1 bg-khata-border" />
            <span>Need a workspace?</span>
            <div className="h-px flex-1 bg-khata-border" />
          </div>

          <ActionLink
            href="/signup"
            size="md"
            className="w-full bg-transparent focus-visible:outline-offset-4"
          >
            Create your firm account
          </ActionLink>

          <Link
            href="/"
            className={authBackLinkClassName}
          >
            <ArrowLeft
              className={functionalIconClassName}
              strokeWidth={functionalIconStrokeWidth}
              aria-hidden="true"
            />
            Back to website
          </Link>
        </div>
      </div>

      <aside className="hidden flex-col justify-center border-l border-khata-border bg-khata-paperMuted px-12 lg:flex">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold tracking-normal text-khata-ink">
            AI prepares a draft. The CA team makes the accounting decision.
          </h2>

          <div className="mt-6 grid gap-3 text-sm text-khata-muted">
            {assurances.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <ShieldCheck
                  className={`mt-0.5 ${functionalIconClassName} text-khata-green`}
                  strokeWidth={functionalIconStrokeWidth}
                  aria-hidden="true"
                />
                <p className="leading-5">{item}</p>
              </div>
            ))}
          </div>

          <div className={authSidePanelSurfaceClassName}>
            <p className="k-eyebrow text-khata-muted">Workspace controls</p>
            <dl className="mt-2 grid gap-1 text-sm">
              {controlItems.map(([title, description]) => (
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
