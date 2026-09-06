import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Check,
  ChevronRight,
  FileSpreadsheet,
  Menu,
  MessageSquareText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { LeadCaptureForm } from "@/components/lead-capture-form";

const navItems = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

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

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-khata-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          aria-label="KhataOne home"
          className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
        >
          <BrandLogo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm text-khata-muted md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-medium hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            Sign in
          </Link>
          <a
            href="#demo"
            className="inline-flex h-9 items-center justify-center rounded-md bg-khata-green px-4 text-sm font-medium text-white shadow-sm hover:bg-khata-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            Book a demo
          </a>
        </div>

        <details className="group relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-khata-border bg-white text-khata-ink shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green">
            <span className="sr-only">Open navigation menu</span>
            <Menu className="h-5 w-5" />
          </summary>
          <div className="absolute right-0 top-14 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-khata-border bg-white p-2 shadow-lg">
            <nav aria-label="Mobile primary" className="grid gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="rounded-lg px-3 py-3 text-sm font-medium text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink"
              >
                Sign in
              </Link>
              <a
                href="#demo"
                className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-khata-green px-4 text-sm font-medium text-white"
              >
                Book a demo
              </a>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  const toneClass = {
    neutral: "border-khata-border bg-khata-paperMuted text-khata-muted",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/35 bg-warning/10 text-warning",
    danger: "border-destructive/30 bg-destructive/10 text-destructive",
    brand: "border-khata-green/30 bg-khata-green/10 text-khata-green",
  }[tone];

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${toneClass}`}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "secondary";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-khata-green text-white shadow-md hover:bg-khata-greenDark"
      : variant === "secondary"
        ? "bg-white text-khata-green shadow-sm hover:bg-khata-paper"
        : "border border-khata-border bg-white text-khata-ink shadow-sm hover:bg-khata-paperMuted";

  return (
    <a
      href={href}
      className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-8 text-sm font-medium transition ${variantClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green`}
    >
      {children}
    </a>
  );
}

function ReviewQueuePreview() {
  return (
    <div className="k-card k-elevated p-5">
      <div className="flex items-center justify-between border-b border-khata-border pb-3">
        <p className="text-sm font-semibold">Review queue</p>
        <Chip label="7 awaiting review" tone="warning" />
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
              <Chip label={label} tone={tone} />
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
      <LandingHeader />

      <main>
        <section className="k-hero border-b border-khata-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-28">
            <div>
              <Chip label="Built for CA firms" tone="brand" />
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
                <ButtonLink href="#demo">
                  Book a guided demo <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="#how" variant="outline">
                  See how it works
                </ButtonLink>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-khata-border pt-6">
                {[
                  ["8", "Demo clients"],
                  ["16", "Transactions in flight"],
                  ["100%", "Human-approved postings"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd className="num text-3xl font-semibold text-khata-green">
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
            <SectionLabel>Workflow</SectionLabel>
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
            <SectionLabel>Platform</SectionLabel>
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
            <div
              className="k-card k-elevated p-8"
              style={{ borderLeft: "4px solid rgb(var(--saffron-rgb))" }}
            >
              <p className="max-w-5xl text-xl leading-relaxed tracking-normal text-khata-ink">
                &ldquo;Our clients were never going to learn new software. They
                already send us photos of bills all day. KhataOne just made
                that stream reviewable.&rdquo;
              </p>
              <p className="mt-5 text-sm text-khata-muted">
                Illustrative quote &mdash; partner at a fictional four-partner
                practice, Bengaluru
              </p>
            </div>
          </div>
        </section>

        <section id="demo" className="border-b border-khata-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <SectionLabel>Workflow setup</SectionLabel>
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
          <div className="mx-auto max-w-3xl px-4 py-20">
            <SectionLabel>Answers</SectionLabel>
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
            <ButtonLink href="#demo" variant="secondary">
              Book a demo <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-khata-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-khata-muted sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo />
          <p>WhatsApp-first AI bookkeeping and GST preparation workflow for CA firms.</p>
        </div>
      </footer>
    </div>
  );
}
