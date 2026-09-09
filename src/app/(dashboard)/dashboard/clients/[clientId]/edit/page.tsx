import { notFound } from "next/navigation";

import { ClientForm } from "@/components/client-form";
import {
  ActionLink,
  PageBody,
  PageHeader,
  SetupRequired,
} from "@/components/design-system";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before editing client records." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("firm_id", firm.id)
    .single();

  if (!client) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Edit client"
        title={client.business_name}
        description="Changes are saved to the client profile and recorded in audit logs."
        actions={
          <ActionLink href={`/dashboard/clients/${client.id}`}>
            Back to client
          </ActionLink>
        }
      />
      <PageBody>
        <ClientForm client={client} />
      </PageBody>
    </div>
  );
}
