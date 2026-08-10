import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <section className="w-full max-w-md rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
      <p className="text-sm font-semibold uppercase text-khata-green">
        Firm console
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
      <p className="mt-3 text-sm leading-6 text-khata-muted">
        Access the CA review console for clients, documents, GST summaries, and
        exports.
      </p>
      <AuthForm mode="login" />
      <p className="mt-5 text-sm text-khata-muted">
        New to KhataOne?{" "}
        <Link href="/signup" className="font-semibold text-khata-green">
          Create an account
        </Link>
      </p>
    </section>
  );
}
