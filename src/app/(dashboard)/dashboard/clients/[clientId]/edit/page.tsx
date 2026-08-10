import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientForm } from "@/components/client-form";
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 text-sm leading-6 text-khata-muted">
            Client editing needs Supabase environment variables and migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("firm_id", firm!.id)
    .single();

  if (!client) {
    notFound();
  }

  return (
    <div className="p-5">
      <div className="mb-5">
        <Link
          href={`/dashboard/clients/${client.id}`}
          className="text-sm font-semibold text-khata-green"
        >
          Back to client
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase text-khata-green">
          Edit client
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{client.business_name}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Changes are saved to the client profile and recorded in audit logs.
        </p>
      </div>
      <ClientForm client={client} />
    </div>
  );
}
