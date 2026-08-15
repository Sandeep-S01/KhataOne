import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileSpreadsheet,
  Gauge,
  GitPullRequest,
  LockKeyhole,
  Menu,
  MessageSquare,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LeadCaptureForm } from "@/components/lead-capture-form";

const navItems = [
  { label: "Product", href: "#platform" },
  { label: "Workflow", href: "#workflow" },
  { label: "Control", href: "#control" },
  { label: "Demo", href: "#demo" },
  { label: "FAQ", href: "#faq" },
];

const reviewRows = [
  {
    client: "Sharma Traders",
    document: "Invoice",
    state: "Needs review",
    value: "18,420",
    tone: "green",
  },
  {
    client: "Kiran Foods",
    document: "Sales invoice",
    state: "Approved",
    value: "42,890",
    tone: "green",
  },
  {
    client: "Om Textiles",
    document: "Receipt photo",
    state: "Low confidence",
    value: "2,160",
    tone: "neutral",
  },
  {
    client: "Mehta Hardware",
    document: "Bank PDF",
    state: "Extracting",
    value: "12 rows",
    tone: "neutral",
  },
];

const proofItems = [
  "DOCUMENT INTAKE",
  "AI DRAFTING",
  "CA REVIEW",
  "GST READINESS",
  "EXPORTS",
  "AUDIT TRAIL",
];

const platformItems = [
  {
    icon: MessageSquare,
    title: "Intake where clients already are",
    text: "Receipts, PDFs and bank statements arrive over WhatsApp and land in one structured queue.",
  },
  {
    icon: ScanLine,
    title: "Confidence-aware extraction",
    text: "Every field carries a confidence signal, so reviewers spend attention only where it matters.",
  },
  {
    icon: GitPullRequest,
    title: "Explicit review states",
    text: "Approve, edit, reject or request clarification. Nothing becomes ledger truth without a human.",
  },
  {
    icon: FileSpreadsheet,
    title: "Exports that fit filing work",
    text: "Approved records become summaries, CSVs and reports shaped for the tools your firm files with.",
  },
  {
    icon: Gauge,
    title: "Month-end visibility",
    text: "See what is pending, flagged or ready per client before the deadline instead of after it.",
  },
  {
    icon: LockKeyhole,
    title: "Traceable by default",
    text: "Source document, raw output and every reviewer action are preserved as an audit trail.",
  },
];

const controlBenefits = [
  "Drafts stay drafts until reviewed",
  "Low-confidence fields remain visible",
  "Every approval is traceable",
  "Source documents stay connected",
];

const businessBenefits = [
  {
    title: "Standardize intake",
    text: "Bring WhatsApp documents, notes and files into one consistent trail.",
  },
  {
    title: "Reduce chasing",
    text: "See what is pending before month-end follow-ups become urgent.",
  },
  {
    title: "Keep review explicit",
    text: "Make ownership clear for edits, approvals and clarification requests.",
  },
  {
    title: "Prepare outputs",
    text: "Use approved records for GST summaries, reports, CSVs and PDFs.",
  },
];

const demoExpectations = [
  "Review your current document intake",
  "Map extraction and approval rules",
  "Configure GST summaries and exports",
];

const workflowItems = [
  {
    step: "01",
    title: "Client sends",
    text: "Documents arrive over WhatsApp, with no new app to teach SMB clients.",
  },
  {
    step: "02",
    title: "AI drafts",
    text: "Source material becomes draft entries with per-field confidence and risk indicators.",
  },
  {
    step: "03",
    title: "Team reviews",
    text: "Reviewers confirm uncertain values, approve clean entries or request clarification.",
  },
  {
    step: "04",
    title: "Firm exports",
    text: "Reviewed records feed summaries, reports and the files your filing workflow expects.",
  },
];

const faqs = [
  {
    question: "Is KhataOne fully automated?",
    answer:
      "No. KhataOne is AI-assisted and review-first. Extracted values begin as drafts and CA approval remains central.",
  },
  {
    question: "What can clients send?",
    answer:
      "The workflow supports receipts, invoices, PDFs, bank statements, payment proofs, text notes and audio notes through WhatsApp intake.",
  },
  {
    question: "Can reviewed data be exported?",
    answer:
      "Yes. The current product direction includes CSV and PDF exports from reviewed records, with Tally-compatible export structure reserved for a later phase.",
  },
  {
    question: "Does KhataOne file GST returns directly?",
    answer:
      "No. Production v1 prepares GST summaries and export-ready data. Direct GST filing remains a future capability until an approved provider is implemented and verified.",
  },
];

function HeaderLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl bg-[#10151a] shadow-[0_10px_24px_rgba(16,21,26,0.16)] ${
        compact ? "h-12 w-40 px-4" : "h-[52px] w-44 px-5"
      }`}
    >
      <Image
        src="/khataone-logo-transparent-trimmed.png"
        alt=""
        priority={!compact}
        width={928}
        height={587}
        className={compact ? "h-10 w-auto object-contain" : "h-11 w-auto object-contain"}
      />
    </span>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#ece8df] bg-[#f8f8f4]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1536px] items-center justify-between px-6 sm:px-10 lg:px-28">
        <Link
          href="/"
          aria-label="KhataOne home"
          className="shrink-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
        >
          <HeaderLogo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-lg font-medium leading-none text-[#5b6262] transition hover:text-[#111519] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          <span className="h-8 w-px bg-[#dcd8cf]" aria-hidden="true" />
          <Link
            href="/login"
            className="text-lg font-medium leading-none text-[#5b6262] transition hover:text-[#111519] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            Sign in
          </Link>
          <a
            href="#demo"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#00964f] px-5 text-lg font-semibold leading-none text-white shadow-[0_14px_28px_rgba(0,150,79,0.2)] transition hover:bg-[#007d43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            Book a demo
          </a>
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex h-12 w-12 cursor-pointer list-none items-center justify-center rounded-2xl border border-[#dcd8cf] bg-white text-[#111519] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green">
            <span className="sr-only">Open navigation menu</span>
            <Menu className="h-5 w-5" />
          </summary>
          <div className="absolute right-0 top-14 w-[min(22rem,calc(100vw-3rem))] rounded-3xl border border-[#dcd8cf] bg-white p-3 shadow-[0_24px_60px_rgba(17,21,25,0.14)]">
            <nav aria-label="Mobile primary" className="grid gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-base font-semibold text-[#5b6262] hover:bg-[#f2f2ee] hover:text-[#111519]"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="rounded-2xl px-4 py-3 text-base font-semibold text-[#5b6262] hover:bg-[#f2f2ee] hover:text-[#111519]"
              >
                Sign in
              </Link>
              <a
                href="#demo"
                className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-[#00964f] px-4 text-base font-semibold text-white"
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

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={`text-sm font-semibold uppercase tracking-[0.28em] ${
        dark ? "text-white/56" : "text-[#626a70]"
      }`}
    >
      {children}
    </p>
  );
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-2xl px-3 py-2 text-sm font-semibold leading-none ${
        tone === "green"
          ? "bg-[#d8f4df] text-[#007d43]"
          : "bg-[#f1f1ee] text-[#5b6262]"
      }`}
    >
      {children}
    </span>
  );
}

function ProductConsolePreview() {
  return (
    <div className="w-full max-w-[860px] rounded-[28px] border border-[#dedbd2] bg-white p-5 shadow-[0_22px_58px_rgba(17,21,25,0.14)] sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-semibold text-[#0f1418]">Firm review console</p>
          <p className="mt-2 text-lg text-[#626a70]">August readiness</p>
        </div>
        <StatusPill tone="green">6 need approval</StatusPill>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["PENDING", "38"],
          ["READY", "11"],
          ["FLAGGED", "07"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-[#f3f3ef] p-5">
            <p className="text-base font-semibold tracking-wide text-[#626a70]">
              {label}
            </p>
            <p className="mt-3 font-mono text-4xl font-semibold text-[#05070a]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3">
        {reviewRows.map((row) => (
          <div
            key={row.client}
            className="grid gap-4 rounded-3xl border border-[#dedbd2] bg-white px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <div>
              <p className="text-xl font-semibold text-[#05070a]">{row.client}</p>
              <p className="mt-1 text-base text-[#626a70]">{row.document}</p>
            </div>
            <StatusPill tone={row.tone}>{row.state}</StatusPill>
            <p className="font-mono text-xl font-semibold text-[#05070a] sm:text-right">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HumanControlPreview() {
  return (
    <div className="rounded-[28px] border border-[#dedbd2] bg-white p-5 shadow-[0_22px_58px_rgba(17,21,25,0.12)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ece8df] pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#626a70]">
            Review item
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#05070a]">
            Kiran Foods - Sales invoice
          </h3>
        </div>
        <StatusPill tone="green">Ready for CA review</StatusPill>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          ["Invoice no.", "KF-1027", "High"],
          ["Taxable value", "36,348", "High"],
          ["GST amount", "6,542", "Review"],
          ["GSTIN", "Needs confirmation", "Low"],
        ].map(([label, value, confidence]) => (
          <div
            key={label}
            className="rounded-3xl border border-[#dedbd2] bg-[#fafaf7] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#626a70]">
                {label}
              </p>
              <span
                className={`rounded-2xl px-2.5 py-1 text-xs font-semibold ${
                  confidence === "Low"
                    ? "bg-[#fff4db] text-[#8a5b11]"
                    : confidence === "Review"
                      ? "bg-[#f1f1ee] text-[#5b6262]"
                      : "bg-[#d8f4df] text-[#007d43]"
                }`}
              >
                {confidence}
              </span>
            </div>
            <p className="mt-3 font-mono text-xl font-semibold text-[#05070a]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl bg-[#10151a] p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-lg font-semibold">Reviewer action required</p>
          <p className="text-sm text-white/60">Source PDF linked</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {["Edit fields", "Ask client", "Approve"].map((action, index) => (
            <button
              key={action}
              type="button"
              className={`h-11 rounded-2xl border text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                index === 2
                  ? "border-[#00964f] bg-[#00964f] text-white"
                  : "border-white/15 bg-white/5 text-white"
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BusinessValueSection() {
  return (
    <section className="border-y border-[#ece8df] bg-[#f3f3ef]">
      <div className="mx-auto grid max-w-[1536px] gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-28 lg:py-32">
        <div>
          <SectionLabel>Business value</SectionLabel>
          <h2 className="mt-8 max-w-[760px] text-[clamp(2.6rem,4.8vw,4.4rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-[#05070a]">
            Reduce document chasing without removing the accountant.
          </h2>
          <p className="mt-8 max-w-[680px] text-xl leading-9 text-[#626a70] sm:text-2xl sm:leading-10">
            KhataOne keeps the messy client side simple while giving your firm a
            structured, review-first workflow for month-end preparation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {businessBenefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-[24px] border border-[#dedbd2] bg-white p-6"
            >
              <ClipboardCheck className="h-6 w-6 text-[#00964f]" />
              <h3 className="mt-6 text-2xl font-semibold text-[#05070a]">
                {benefit.title}
              </h3>
              <p className="mt-4 text-lg leading-8 text-[#626a70]">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[#10151a] text-white">
      <div className="mx-auto max-w-[1536px] px-6 py-20 sm:px-10 lg:px-28 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <SectionLabel dark>Next step</SectionLabel>
            <h2 className="mt-8 max-w-[980px] text-[clamp(2.6rem,5vw,4.6rem)] font-semibold leading-[1.12] tracking-[-0.035em]">
              Bring client documents, review, and GST preparation into one
              controlled workflow.
            </h2>
            <p className="mt-7 max-w-[720px] text-xl leading-8 text-white/64">
              Start with a guided workflow review before automation touches your
              accounting records.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="#demo"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#00964f] px-7 text-lg font-semibold text-white shadow-[0_16px_32px_rgba(0,150,79,0.2)] transition hover:bg-[#00a65a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Book a demo
              <ArrowRight className="ml-3 h-5 w-5" />
            </a>
            <a
              href="#workflow"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/16 bg-white/5 px-7 text-lg font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Review workflow
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="min-h-[280px] border-[#dedbd2] p-8 sm:p-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d8f4df] text-[#007d43]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-10 text-2xl font-semibold tracking-[-0.01em] text-[#05070a]">
        {title}
      </h3>
      <p className="mt-5 max-w-md text-xl leading-8 text-[#626a70]">{text}</p>
    </div>
  );
}

function WorkflowStep({ item }: { item: (typeof workflowItems)[number] }) {
  return (
    <div>
      <div className="h-px w-full bg-white/12" />
      <p className="mt-9 font-mono text-lg font-semibold text-[#00a65a]">
        {item.step}
      </p>
      <h3 className="mt-7 text-2xl font-semibold text-white">{item.title}</h3>
      <p className="mt-5 text-xl leading-8 text-white/64">{item.text}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-t border-[#dedbd2] py-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-xl font-semibold text-[#05070a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green">
        {question}
        <ChevronRight className="h-5 w-5 shrink-0 text-[#626a70] transition group-open:rotate-90" />
      </summary>
      <p className="mt-4 max-w-4xl text-lg leading-8 text-[#626a70]">{answer}</p>
    </details>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f8f4] text-[#05070a]">
      <LandingHeader />

      <section className="ledger-grid border-b border-[#ece8df] bg-[#fafaf7]">
        <div className="mx-auto grid max-w-[1536px] gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-28 lg:py-24">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="mb-8 inline-flex w-fit items-center gap-3 rounded-full border border-[#dedbd2] bg-white px-4 py-3 text-base font-medium text-[#4f5960] shadow-sm sm:px-5 sm:text-lg">
              <ShieldCheck className="h-5 w-5 text-[#00964f]" />
              CA-controlled AI accounting workflow
            </div>
            <h1 className="max-w-[760px] break-words text-[clamp(2.55rem,10vw,5.55rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[#0b0f14] sm:text-[clamp(3.3rem,6.7vw,5.55rem)] sm:tracking-[-0.045em]">
              Turn WhatsApp docs into GST-ready records.
            </h1>
            <p className="mt-9 max-w-[720px] text-lg leading-[1.55] text-[#626a70] sm:text-[clamp(1.15rem,1.8vw,1.55rem)] sm:leading-[1.6]">
              KhataOne organizes receipts, invoices, bank files, and client
              messages into structured draft entries, flags uncertainty, and
              gives CA teams control before anything is finalized.
            </p>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row">
              <a
                href="#demo"
                className="inline-flex h-16 w-full items-center justify-center whitespace-nowrap rounded-2xl bg-[#00964f] px-5 text-lg font-semibold text-white shadow-[0_16px_32px_rgba(0,150,79,0.22)] transition hover:bg-[#007d43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green sm:w-auto sm:px-8 sm:text-xl"
              >
                Book a guided demo
                <ArrowRight className="ml-3 h-5 w-5" />
              </a>
              <a
                href="#workflow"
                className="inline-flex h-16 w-full items-center justify-center whitespace-nowrap rounded-2xl border border-[#dedbd2] bg-white px-5 text-lg font-semibold text-[#05070a] shadow-sm transition hover:border-[#00964f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green sm:w-auto sm:px-8 sm:text-xl"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 text-lg text-[#626a70] sm:text-xl">
              {["Human reviewed", "CA controlled", "Export ready"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-3">
                    <Check className="h-5 w-5 text-[#00964f]" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="flex items-start lg:pt-16">
            <ProductConsolePreview />
          </div>
        </div>
      </section>

      <section id="proof" className="border-b border-[#ece8df] bg-[#f3f3ef]">
        <div className="mx-auto max-w-[1536px] px-6 py-16 text-center sm:px-10 lg:px-28">
          <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#626a70]">
            Built for accounting teams closing reviewed books every month
          </p>
          <div className="mt-12 grid gap-8 text-lg font-semibold uppercase tracking-[0.16em] text-[#626a70] sm:grid-cols-2 lg:grid-cols-6">
            {proofItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#10151a] text-white">
        <div className="mx-auto max-w-[1536px] px-6 py-24 sm:px-10 lg:px-28 lg:py-32">
          <SectionLabel dark>Workflow</SectionLabel>
          <h2 className="mt-8 max-w-[900px] text-[clamp(2.7rem,5vw,4.75rem)] font-semibold leading-[1.12] tracking-[-0.04em]">
            From client documents to reviewed records.
          </h2>
          <div className="mt-20 grid gap-12 lg:grid-cols-4">
            {workflowItems.map((item) => (
              <WorkflowStep key={item.step} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="bg-[#fafaf7]">
        <div className="mx-auto max-w-[1536px] px-6 py-24 sm:px-10 lg:px-28 lg:py-36">
          <SectionLabel>Platform</SectionLabel>
          <h2 className="mt-8 max-w-[900px] text-[clamp(2.7rem,5vw,4.75rem)] font-semibold leading-[1.12] tracking-[-0.04em]">
            Automation prepares the work. Your team stays in control.
          </h2>
          <p className="mt-8 max-w-[860px] text-2xl leading-10 text-[#626a70]">
            KhataOne is draft-first. Six building blocks take a document from a
            client message to a reviewed, exportable record.
          </p>

          <div className="mt-20 overflow-hidden rounded-[28px] border border-[#dedbd2] bg-white">
            <div className="grid md:grid-cols-2 lg:grid-cols-3">
              {platformItems.map((item, index) => (
                <div
                  key={item.title}
                  className={`border-[#dedbd2] ${
                    index < 3 ? "lg:border-b" : ""
                  } ${index % 3 !== 2 ? "lg:border-r" : ""} ${
                    index < 4 ? "md:border-b" : ""
                  } ${index % 2 === 0 ? "md:border-r lg:border-r" : ""}`}
                >
                  <PlatformCard {...item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="control" className="bg-[#fafaf7]">
        <div className="mx-auto grid max-w-[1536px] gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-28 lg:py-36">
          <div className="flex flex-col justify-center">
            <SectionLabel>Human control</SectionLabel>
            <h2 className="mt-8 max-w-[820px] text-[clamp(2.6rem,4.8vw,4.35rem)] font-semibold leading-[1.12] tracking-[-0.04em]">
              Automation prepares the work. Your team stays in control.
            </h2>
            <p className="mt-8 max-w-[720px] text-xl leading-9 text-[#626a70] sm:text-2xl sm:leading-10">
              AI assists the accountant. It does not silently replace the
              accountant or turn uncertain data into ledger truth.
            </p>
            <div className="mt-10 grid gap-4">
              {controlBenefits.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-[#dedbd2] bg-white px-5 py-4 text-lg font-semibold text-[#05070a]"
                >
                  <SlidersHorizontal className="h-5 w-5 shrink-0 text-[#00964f]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <HumanControlPreview />
        </div>
      </section>

      <BusinessValueSection />

      <section className="bg-[#fafaf7]">
        <div className="mx-auto max-w-[1536px] px-6 py-24 sm:px-10 lg:px-28 lg:py-32">
          <div className="rounded-[28px] border border-[#dedbd2] bg-white p-10 shadow-[0_22px_58px_rgba(17,21,25,0.08)] sm:p-16 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
            <div>
              <h2 className="max-w-[820px] text-[clamp(2.5rem,4.8vw,4.35rem)] font-semibold leading-[1.12] tracking-[-0.04em]">
                Bring intake, review and reporting into one controlled workflow.
              </h2>
              <p className="mt-8 max-w-[760px] text-2xl leading-10 text-[#626a70]">
                A guided walkthrough can map your client intake, review roles
                and export needs before automation enters the accounting flow.
              </p>
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row lg:mt-0">
              <a
                href="#demo"
                className="inline-flex h-16 items-center justify-center rounded-2xl bg-[#00964f] px-8 text-xl font-semibold text-white shadow-[0_16px_32px_rgba(0,150,79,0.22)] transition hover:bg-[#007d43]"
              >
                Book a demo
                <ArrowRight className="ml-3 h-5 w-5" />
              </a>
              <a
                href="#platform"
                className="inline-flex h-16 items-center justify-center rounded-2xl border border-[#dedbd2] bg-white px-8 text-xl font-semibold text-[#05070a]"
              >
                View platform
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="border-y border-[#ece8df] bg-[#f3f3ef]">
        <div className="mx-auto grid max-w-[1536px] gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[0.82fr_1.18fr] lg:px-28 lg:py-28">
          <div>
            <SectionLabel>Demo request</SectionLabel>
            <h2 className="mt-8 max-w-[720px] text-[clamp(2.6rem,4.6vw,4.35rem)] font-semibold leading-[1.12] tracking-[-0.04em]">
              See how KhataOne fits your firm&apos;s current workflow.
            </h2>
            <p className="mt-8 max-w-[680px] text-2xl leading-10 text-[#626a70]">
              Share how clients send documents, how your team reviews entries,
              and which GST or export workflows you use.
            </p>
            <div className="mt-10 grid gap-4">
              {demoExpectations.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-[#dedbd2] bg-white px-5 py-4 text-lg font-semibold text-[#05070a]"
                >
                  <Check className="h-5 w-5 shrink-0 text-[#00964f]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <LeadCaptureForm />
        </div>
      </section>

      <section id="faq" className="bg-[#fafaf7]">
        <div className="mx-auto grid max-w-[1536px] gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[0.7fr_1.3fr] lg:px-28 lg:py-32">
          <div>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-8 text-[clamp(2.5rem,4.2vw,4rem)] font-semibold leading-[1.12] tracking-[-0.04em]">
              Practical answers for CA firms.
            </h2>
          </div>
          <div className="border-b border-[#dedbd2]">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />

      <footer className="border-t border-[#ece8df] bg-[#f3f3ef]">
        <div className="mx-auto max-w-[1536px] px-6 py-20 sm:px-10 lg:px-28">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
            <div>
              <HeaderLogo compact />
              <p className="mt-8 max-w-md text-xl leading-8 text-[#626a70]">
                WhatsApp-first AI bookkeeping and GST preparation workflow for
                Indian CA firms.
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-3">
              {[
                ["PRODUCT", ["Overview", "Intake", "Review console", "Exports"]],
                ["WORKFLOW", ["Client documents", "AI drafts", "CA approval", "GST summaries"]],
                ["COMPANY", ["Demo", "Sign in", "FAQ", "Security posture"]],
              ].map(([heading, links]) => (
                <div key={heading as string}>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#626a70]">
                    {heading}
                  </p>
                  <div className="mt-7 grid gap-4">
                    {(links as string[]).map((item) => (
                      <a
                        key={item}
                        href={
                          item === "Demo"
                            ? "#demo"
                            : item === "FAQ"
                              ? "#faq"
                              : "#platform"
                        }
                        className="text-xl text-[#626a70] hover:text-[#05070a]"
                      >
                        {item}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 flex flex-col gap-4 border-t border-[#dedbd2] pt-8 text-lg text-[#626a70] sm:flex-row sm:items-center sm:justify-between">
            <p>(c) 2026 KhataOne. All rights reserved.</p>
            <p>Draft-first AI. CA-reviewed accounting records.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
