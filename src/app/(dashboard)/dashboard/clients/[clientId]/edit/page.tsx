import { notFound } from "next/navigation";

import { ClientForm } from "@/components/client-form";
import {
  ActionLink,
  PageBody,
  PageHeader,
  PermissionNotice,
  SectionCard,
  SetupRequired,
} from "@/components/design-system";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { canManageClients, readOnlyRoleMessage } from "@/lib/permissions";
import {
  appendReturnContext,
  clientReturnKeys,
  sanitizeReturnContext,
} from "@/lib/return-context";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { clientId } = await params;
  const { return_to: rawReturnContext } = await searchParams;
  const returnContext = sanitizeReturnContext(rawReturnContext, clientReturnKeys);

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

  const canManageClientRecords = canManageClients(firm.role);

  return (
    <div>
      <PageHeader
        eyebrow="Edit client"
        title={client.business_name}
        description="Changes are saved to the client profile and recorded in audit logs."
        actions={
          <ActionLink
            href={appendReturnContext(
              `/dashboard/clients/${client.id}`,
              returnContext,
            )}
          >
            Back to client
          </ActionLink>
        }
      />
      <PageBody>
        {canManageClientRecords ? (
          <ClientForm client={client} returnContext={returnContext} />
        ) : (
          <SectionCard title="Read-only access">
            <PermissionNotice message={readOnlyRoleMessage} />
          </SectionCard>
        )}
      </PageBody>
    </div>
  );
}
