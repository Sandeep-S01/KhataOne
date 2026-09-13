import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { UpdatePasswordForm } from "@/components/update-password-form";

export const metadata: Metadata = {
  title: "Update password | KhataOne",
  description:
    "Set a new password for your KhataOne CA firm workspace account.",
  alternates: {
    canonical: "/reset-password",
  },
};

export default function ResetPasswordPage() {
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
            Set a new password
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-khata-muted">
            After opening the reset link from your email, choose a new password
            for your KhataOne workspace account.
          </p>

          <UpdatePasswordForm />

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
            Password changes stay connected to Supabase Auth.
          </h2>
          <div className="mt-6 flex gap-2.5 text-sm text-khata-muted">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-khata-green"
              aria-hidden="true"
            />
            <p>
              Once the recovery session is active, KhataOne updates only the
              account password. Firm data, source documents, and audit history
              remain unchanged.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
