import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-khata-paper text-khata-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            KhataOne
          </Link>
          <Link
            href="/"
            className="rounded-md border border-khata-border bg-white px-4 py-2 text-sm font-medium"
          >
            Home
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-center py-12">
          {children}
        </div>
      </div>
    </main>
  );
}
