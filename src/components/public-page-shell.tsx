import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

export function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-khata-paper text-khata-ink">
      <header className="border-b border-khata-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            aria-label="KhataOne home"
            className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            <BrandLogo />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-khata-muted transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
          >
            Back to website
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16">
        <p className="k-eyebrow text-khata-green">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-khata-ink">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-khata-muted">
          {description}
        </p>
        <div className="mt-10 space-y-6">{children}</div>
      </main>
    </div>
  );
}

export function PublicInfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="k-card p-5">
      <h2 className="text-base font-semibold text-khata-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-khata-muted">
        {children}
      </div>
    </section>
  );
}
