import {
  ArrowRight,
  BadgeCheck,
  Bot,
  FileText,
  Landmark,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { LeadCaptureForm } from "@/components/lead-capture-form";

const workflow = [
  {
    icon: MessageCircle,
    label: "WhatsApp intake",
    text: "Clients send receipts, invoices, PDFs, bank statements, and voice notes naturally.",
  },
  {
    icon: Bot,
    label: "AI extraction",
    text: "KhataOne extracts draft transaction fields, confidence, and review flags.",
  },
  {
    icon: BadgeCheck,
    label: "CA review",
    text: "Your team approves, edits, rejects, or requests clarification before ledger impact.",
  },
  {
    icon: FileText,
    label: "GST and exports",
    text: "Prepare summaries, readiness checks, reports, and export files for filing work.",
  },
];

const queueRows = [
  ["Sharma Traders", "Purchase invoice", "Needs Review", "Rs. 18,420"],
  ["Kiran Foods", "Sales invoice", "Approved", "Rs. 42,800"],
  ["Om Textiles", "Receipt photo", "Low Confidence", "Rs. 2,160"],
  ["Mehta Hardware", "Bank PDF", "Extracting", "12 rows"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-khata-paper text-khata-ink">
      <section className="ledger-grid relative border-b border-khata-border">
        <div className="mx-auto grid min-h-[92vh] max-w-7xl gap-10 px-5 py-6 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10">
          <div className="flex flex-col">
            <nav className="flex items-center justify-between">
              <Link href="/" className="text-xl font-semibold tracking-normal">
                KhataOne
              </Link>
              <a
                href="#demo"
                className="inline-flex h-10 items-center justify-center rounded-md border border-khata-border bg-white px-4 text-sm font-medium text-khata-ink shadow-sm transition hover:border-khata-green"
              >
                Book demo
              </a>
            </nav>

            <div className="flex flex-1 flex-col justify-center py-12 lg:py-16">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-md border border-khata-border bg-white px-3 py-2 text-sm font-medium text-khata-muted">
                <ShieldCheck className="h-4 w-4 text-khata-green" />
                CA-controlled AI accounting workflow
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-normal text-khata-ink sm:text-6xl lg:text-7xl">
                KhataOne
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-khata-muted sm:text-2xl">
                WhatsApp-first AI bookkeeping and GST preparation for Indian CA
                firms.
              </p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-khata-muted">
                Clients send messy accounting material on WhatsApp. KhataOne
                extracts draft entries, flags risk, and gives your team a
                review console for ledgers, GST summaries, and exports.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#demo"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-khata-green px-5 text-sm font-semibold text-white shadow-ledger transition hover:bg-khata-greenDark"
                >
                  Start with a demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a
                  href="#workflow"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-khata-border bg-white px-5 text-sm font-semibold text-khata-ink transition hover:border-khata-green"
                >
                  See workflow
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center pb-10 lg:pb-0">
            <div className="w-full rounded-lg border border-khata-border bg-white shadow-ledger">
              <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Firm Review Console</p>
                  <p className="text-xs text-khata-muted">
                    August GST readiness
                  </p>
                </div>
                <span className="rounded-md bg-khata-paperMuted px-2.5 py-1 text-xs font-medium text-khata-green">
                  Drafts need CA approval
                </span>
              </div>
              <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
                <div className="border-b border-khata-border p-4 lg:border-b-0 lg:border-r">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Pending", "38"],
                      ["Ready", "11"],
                      ["Missing", "7"],
                      ["Exports", "24"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-md border border-khata-border bg-khata-paper px-3 py-3"
                      >
                        <p className="text-xs text-khata-muted">{label}</p>
                        <p className="mt-1 font-mono text-2xl font-semibold">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-md border border-khata-border bg-white p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-khata-saffron" />
                      <p className="text-sm font-semibold">GST readiness</p>
                    </div>
                    <div className="h-2 rounded-full bg-khata-paperMuted">
                      <div className="h-2 w-[68%] rounded-full bg-khata-green" />
                    </div>
                    <p className="mt-2 text-xs text-khata-muted">
                      68% ready after review issues are cleared.
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Review queue</p>
                    <span className="text-xs text-khata-muted">Live sample</span>
                  </div>
                  <div className="overflow-hidden rounded-md border border-khata-border">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                        <tr>
                          <th className="px-3 py-2 font-medium">Client</th>
                          <th className="px-3 py-2 font-medium">Document</th>
                          <th className="px-3 py-2 font-medium">State</th>
                          <th className="px-3 py-2 text-right font-medium">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {queueRows.map(([client, document, state, value]) => (
                          <tr
                            key={`${client}-${document}`}
                            className="border-t border-khata-border"
                          >
                            <td className="px-3 py-3 font-medium">{client}</td>
                            <td className="px-3 py-3 text-khata-muted">
                              {document}
                            </td>
                            <td className="px-3 py-3">
                              <span className="rounded-md bg-khata-paper px-2 py-1 text-xs font-medium text-khata-ink">
                                {state}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right font-mono">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-khata-border bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-khata-green">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              From WhatsApp document chaos to CA-reviewed accounting records.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-khata-border bg-khata-paper p-5"
              >
                <item.icon className="h-6 w-6 text-khata-green" />
                <h3 className="mt-5 text-lg font-semibold">{item.label}</h3>
                <p className="mt-3 text-sm leading-6 text-khata-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-khata-paper">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase text-khata-green">
              Demo request
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Start with the workflow your CA firm already runs.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-khata-muted">
              The first setup call should map your client intake, GST cadence,
              review roles, and export needs before automation enters the
              accounting workflow.
            </p>
            <div className="mt-8 grid gap-3">
              {[
                "WhatsApp document collection review",
                "AI extraction and CA approval policy",
                "GST summary and export workflow",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-khata-border bg-white px-4 py-3 text-sm font-medium"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-khata-green" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <LeadCaptureForm />
        </div>
      </section>

      <section className="border-t border-khata-border bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:px-10">
          {[
            "Firm and client workspaces",
            "Draft AI extraction with confidence",
            "CSV, PDF, and future Tally exports",
          ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-khata-border bg-khata-paper px-4 py-3 text-sm font-medium"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-khata-green" />
                {item}
              </div>
          ))}
        </div>
      </section>
    </main>
  );
}
