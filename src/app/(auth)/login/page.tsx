import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";

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

export default function LoginPage() {
  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            aria-label="KhataOne home"
            className="inline-flex rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
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

          <Link
            href="/signup"
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-khata-border bg-transparent px-4 py-2 text-sm font-medium text-khata-ink shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            Create your firm account
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
            AI prepares a draft. The CA team makes the accounting decision.
          </h2>

          <div className="mt-6 grid gap-3 text-sm text-khata-muted">
            {assurances.map((item) => (
              <div key={item} className="flex gap-2.5">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-khata-green"
                  aria-hidden="true"
                />
                <p>{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-md border border-khata-border bg-white p-4 shadow-sm">
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
