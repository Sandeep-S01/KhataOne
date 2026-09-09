import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Check,
  ChevronRight,
  FileSpreadsheet,
  MessageSquareText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { ActionLink } from "@/components/design-system";
import { LandingNavigation } from "@/components/landing-navigation";
import { LeadCaptureForm } from "@/components/lead-capture-form";
import { StatusChip } from "@/components/status-chip";
import { getPublicAppUrl } from "@/lib/env";

const reviewRows = [
  ["ABC Traders", "INV-2291", "Rs. 1,18,000", "Review recommended", "warning"],
  ["Kaveri Foods", "PUR-8842", "Rs. 46,340", "High risk", "danger"],
  ["Saanvi Textiles", "INV-1180", "Rs. 92,500", "Low risk", "success"],
  ["Deccan Auto Spares", "EXP-0442", "Rs. 15,340", "Review recommended", "warning"],
] as const;

const workflowSteps = [
  {
    icon: MessageSquareText,
    title: "Client sends on WhatsApp",
    body: "Invoices, bills and photos arrive on the number your clients already use. Every message is preserved as the source record.",
  },
  {
    icon: ScanLine,
    title: "AI prepares a draft",
    body: "Fields are extracted with confidence scores and warnings. Nothing is posted automatically.",
  },
  {
    icon: BookOpenCheck,
    title: "Your team reviews",
    body: "A reviewer confirms amounts, party, GSTIN and ledger mapping before approval.",
  },
  {
    icon: FileSpreadsheet,
    title: "Books stay ready",
    body: "Approval creates a reviewed record, audit trail and export-ready accounting data.",
  },
];

const featureItems = [
  {
    icon: MessageSquareText,
    title: "WhatsApp intake inbox",
    body: "Unmatched senders, failed downloads and duplicates surface in one triage queue.",
  },
  {
    icon: Sparkles,
    title: "Explainable extraction",
    body: "Every extracted field shows source context and confidence so reviewers correct rather than retype.",
  },
  {
    icon: ShieldCheck,
    title: "Approval is the path to books",
    body: "Drafts never reach the ledger without a named approver and traceable action.",
  },
  {
    icon: BadgeCheck,
    title: "GST readiness by period",
    body: "Blocked periods show pending reviews, mismatches and missing documents.",
  },
  {
    icon: Users,
    title: "Roles built for firms",
    body: "Owner, admin, staff and viewer permissions map to how CA practices delegate work.",
  },
  {
    icon: FileSpreadsheet,
    title: "Exports without surprises",
    body: "Transaction CSVs, GST summaries and PDF packs generate from approved data only.",
  },
];

const faqItems = [
  {
    question: "Does the AI post entries by itself?",
    answer:
      "No. Extraction prepares a draft. A person with review permission must approve before a ledger entry exists.",
  },
  {
    question: "What happens to the original WhatsApp document?",
    answer:
      "The message and its attachment stay linked to the draft, reviewed transaction and audit trail.",
  },
  {
    question: "How does GST readiness work?",
    answer:
      "KhataOne prepares GST summaries and readiness indicators from reviewed records. Direct filing stays outside v1 until a verified provider integration exists.",
  },
  {
    question: "Can this fit an existing CA workflow?",
    answer:
      "Yes. The setup conversation maps your intake, review roles, ledger habits and export requirements before automation enters the workflow.",
  },
];

const proofPoints = [
  ["WhatsApp", "Client document intake"],
  ["CA review", "Required before ledger"],
  ["GST", "Summary and export prep"],
] as const;

const trustItems = [
  "Original WhatsApp messages stay linked to document records.",
  "AI output remains a draft with confidence and risk context.",
  "Approvals and edits are traceable to reviewer action.",
  "GST summaries are prepared from reviewed records, not direct filing.",
] as const;

const siteUrl = getPublicAppUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "KhataOne",
      url: siteUrl,
      logo: `${siteUrl}/favicon.png`,
    },
    {
      "@type": "SoftwareApplication",
      name: "KhataOne",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "WhatsApp-first AI-assisted bookkeeping intake, CA review, GST summary, and export workflow for Indian CA firms.",
      url: siteUrl,
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-khata-border/80 bg-white/90 backdrop-blur-md shadow-[0_1px_3px_rgba(31,42,36,0.03)]">
      <LandingNavigation />
    </header>
  );
}

function ReviewQueuePreview() {
  return (
    <div className="k-card k-elevated p-5">
      <div className="flex items-center justify-between border-b border-khata-border pb-3">
        <h2 className="text-sm font-semibold">Review queue</h2>
        <StatusChip tone="warning">7 awaiting review</StatusChip>
      </div>

      <ul className="divide-y divide-khata-border">
        {reviewRows.map(([name, ref, amount, label, tone]) => (
          <li
            key={ref}
            className="grid gap-2 py-3.5 transition-colors hover:bg-khata-paperMuted/60 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-khata-ink">{name}</p>
              <p className="num text-xs text-khata-muted">{ref}</p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:min-w-fit sm:justify-end sm:gap-3">
              <span className="num text-sm font-medium text-khata-ink">{amount}</span>
              <StatusChip tone={tone}>{label}</StatusChip>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 rounded-md bg-khata-paperMuted px-3 py-2 text-xs leading-5 text-khata-muted">
        Source document, AI draft and reviewer action remain connected.
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="k-eyebrow">{children}</p>;
}

function WorkflowCard({
  icon: Icon,
  title,
  body,
  index,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  index: number;
}) {
  return (
    <li className="k-card k-card-hover p-5">
      <span className="num text-xs font-semibold text-khata-green">
        Step {String(index + 1).padStart(2, "0")}
      </span>
      <span className="mt-4 flex size-10 items-center justify-center rounded-lg bg-khata-green/10">
        <Icon className="size-5 text-khata-green" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-khata-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-khata-muted">{body}</p>
    </li>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <article className="k-card k-card-hover p-6">
      <span className="flex size-10 items-center justify-center rounded-lg bg-khata-green/10">
        <Icon className="size-5 text-khata-green" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-khata-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-khata-muted">{body}</p>
    </article>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-khata-border">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left text-sm font-semibold text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green">
        {question}
        <ChevronRight className="size-4 shrink-0 text-khata-muted transition group-open:rotate-90" />
      </summary>
      <p className="pb-4 text-sm leading-6 text-khata-muted">{answer}</p>
    </details>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-khata-paper text-khata-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-khata-green focus:shadow-md"
      >
        Skip to content
      </a>
      <LandingHeader />

      <main id="main-content">
        <section className="k-hero border-b border-khata-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center lg:grid-cols-[1.05fr_1fr] lg:py-28">
            <div>
              <StatusChip tone="brand">Built for CA firms</StatusChip>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-normal text-khata-ink sm:text-5xl lg:text-[3.4rem]">
                Bookkeeping that starts where your clients already are:{" "}
                <span className="text-khata-green">WhatsApp</span>
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-khata-muted">
                KhataOne collects client documents on WhatsApp, prepares AI
                drafts your team can verify, and keeps GST-period work traceable
                from message to ledger entry.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ActionLink href="#demo" variant="primary" size="lg">
                  Book a demo <ArrowRight className="size-4" />
                </ActionLink>
                <ActionLink href="#how" variant="outline" size="lg">
                  See how it works
                </ActionLink>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-khata-border pt-6">
                {proofPoints.map(([value, label]) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd className="text-sm font-semibold text-khata-green sm:text-base">
                      {value}
                    </dd>
                    <p className="mt-1 text-xs leading-5 text-khata-muted">{label}</p>
                  </div>
                ))}
              </dl>
            </div>

            <ReviewQueuePreview />
          </div>
        </section>

        <section id="how" className="border-b border-khata-border bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionLabel>Four-step workflow</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-khata-ink">
              How KhataOne works
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6 text-khata-muted">
              One straight line from a client message to books your firm can
              defend in an audit.
            </p>
            <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <WorkflowCard key={step.title} {...step} index={index} />
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="border-b border-khata-border">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionLabel>What CAs get</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-khata-ink">
              Built for how CA firms work
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featureItems.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-khata-border bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <SectionLabel>Trust and control</SectionLabel>
            <div className="mt-3 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <h2 className="text-3xl font-semibold tracking-normal text-khata-ink">
                  Built for CA-controlled financial workflows.
                </h2>
                <p className="mt-4 text-[15px] leading-7 text-khata-muted">
                  KhataOne speeds intake and review without turning AI output
                  into accounting truth. Source records, draft extraction,
                  reviewer decisions and exports stay connected.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {trustItems.map((item, index) => (
                  <div
                    key={item}
                    className="k-card p-4"
                    style={{
                      borderLeft:
                        index === 3 ? "4px solid rgb(var(--saffron-rgb))" : undefined,
                    }}
                  >
                    <ShieldCheck
                      className="size-5 text-khata-green"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm leading-6 text-khata-muted">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="border-b border-khata-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <SectionLabel>Demo setup</SectionLabel>
              <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-normal text-khata-ink">
                Map the workflow your CA firm already runs.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-khata-muted">
                Share your client intake, review rules, GST cadence and export
                needs. The first conversation should shape automation around
                your current process.
              </p>
              <div className="mt-8 grid gap-3 text-sm text-khata-muted">
                {[
                  "Review current document intake",
                  "Map extraction and approval rules",
                  "Plan GST summaries and export files",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="size-4 text-khata-green" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <LeadCaptureForm />
          </div>
        </section>

        <section id="faq" className="border-b border-khata-border bg-khata-paperMuted">
          <div className="mx-auto max-w-4xl px-4 py-20">
            <SectionLabel>Common questions</SectionLabel>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-khata-ink">
              Frequently asked
            </h2>
            <div className="mt-8 border-t border-khata-border">
              {faqItems.map((faq) => (
                <FAQItem key={faq.question} {...faq} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="k-brand-gradient mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-2xl px-8 py-12 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal">
                Bring intake, review and reporting into one controlled workflow.
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Start with a guided workflow review before automation changes
                accounting records.
              </p>
            </div>
            <ActionLink href="#demo" variant="secondary" size="lg">
              Book a demo <ArrowRight className="size-4" />
            </ActionLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-khata-border bg-white text-khata-muted">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <Link
                href="/"
                aria-label="KhataOne home"
                className="inline-flex rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
              >
                <BrandLogo />
              </Link>
              <p className="max-w-sm text-sm leading-relaxed text-khata-muted">
                WhatsApp-first AI bookkeeping intake, draft extraction, and GST
                preparation workflow built specifically for Indian CA firms.
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-khata-muted">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-khata-border bg-khata-paper px-2 py-1 font-mono text-[11px] text-khata-ink">
                  <span className="size-1.5 rounded-full bg-khata-green" />
                  India GST Ready
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-khata-border bg-khata-paper px-2 py-1 font-mono text-[11px] text-khata-ink">
                  CA Controlled
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
              <div className="space-y-3">
                <p className="k-eyebrow text-khata-ink">Product</p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <a
                      href="#how"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      How it works
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#demo"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      Book a demo
                    </a>
                  </li>
                  <li>
                    <a
                      href="#faq"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      FAQ
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="k-eyebrow text-khata-ink">Workspace</p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link
                      href="/login"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      Firm Sign in
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      Create account
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/forgot-password"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      Reset password
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 col-span-2 sm:col-span-1">
                <p className="k-eyebrow text-khata-ink">Trust & Legal</p>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link
                      href="/privacy"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-khata-border pt-8 text-xs text-khata-muted sm:flex-row">
            <p>&copy; {new Date().getFullYear()} KhataOne. All rights reserved.</p>
            <p className="text-center sm:text-right">
              Designed for professional CA firms & accounting teams in India.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
