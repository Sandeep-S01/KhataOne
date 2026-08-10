import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <section className="w-full max-w-md rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
      <p className="text-sm font-semibold uppercase text-khata-green">
        Start workspace
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Create your firm account</h1>
      <p className="mt-3 text-sm leading-6 text-khata-muted">
        KhataOne keeps AI extraction draft-first until your CA team reviews and
        approves the accounting record.
      </p>
      <AuthForm mode="signup" />
      <p className="mt-5 text-sm text-khata-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-khata-green">
          Sign in
        </Link>
      </p>
    </section>
  );
}
