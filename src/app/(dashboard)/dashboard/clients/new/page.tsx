import Link from "next/link";

import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <div className="p-5">
      <div className="mb-5">
        <Link
          href="/dashboard/clients"
          className="text-sm font-semibold text-khata-green"
        >
          Back to clients
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase text-khata-green">
          New client
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Add business client</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Store the accounting identity and WhatsApp mapping needed before
          document intake can safely match inbound messages.
        </p>
      </div>
      <ClientForm />
    </div>
  );
}
