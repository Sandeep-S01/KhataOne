import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { PasswordResetForm } from "@/components/password-reset-form";

export const metadata: Metadata = {
  title: "Reset password | KhataOne",
  description:
    "Request a KhataOne workspace password reset link for your CA firm account.",
  alternates: {
    canonical: "/forgot-password",
  },
};

const resetNotes = [
  "Use the email attached to your KhataOne workspace.",
  "The reset link is sent through Supabase Auth.",
  "Your documents, review queue, ledger, and audit trail remain protected.",
];

export default function ForgotPasswordPage() {
  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            aria-label="KhataOne home"
            className="inline-flex min-h-11 items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green md:min-h-0"
          >
            <BrandLogo />
          </Link>

          <h1 className="mt-8 text-2xl font-semibold tracking-normal text-khata-ink">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-khata-muted">
            Enter your work email and KhataOne will send a password reset link
            if a workspace account exists.
          </p>

          <PasswordResetForm />

          <Link
            href="/login"
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-khata-muted transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green md:min-h-0"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>

      <aside className="hidden flex-col justify-center border-l border-khata-border bg-khata-paperMuted px-12 lg:flex">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold tracking-normal text-khata-ink">
            Account recovery stays inside the same controlled workspace model.
          </h2>

          <div className="mt-6 grid gap-3 text-sm text-khata-muted">
            {resetNotes.map((item) => (
              <div key={item} className="flex gap-2.5">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-khata-green"
                  aria-hidden="true"
                />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
