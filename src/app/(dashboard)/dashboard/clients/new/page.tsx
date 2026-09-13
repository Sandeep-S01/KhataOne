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
  clientReturnKeys,
  dashboardReturnHref,
  sanitizeReturnContext,
} from "@/lib/return-context";

export const dynamic = "force-dynamic";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to: rawReturnContext } = await searchParams;
  const returnContext = sanitizeReturnContext(rawReturnContext, clientReturnKeys);
  const clientsHref = dashboardReturnHref(
    "/dashboard/clients",
    returnContext,
    clientReturnKeys,
  );

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before adding client records." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const canManageClientRecords = canManageClients(context.firm.role);

  return (
    <div>
      <PageHeader
        eyebrow="New client"
        title="Add business client"
        description="Store the accounting identity and WhatsApp mapping needed before document intake can safely match inbound messages."
        actions={
          <ActionLink href={clientsHref}>Back to clients</ActionLink>
        }
      />
      <PageBody>
        {canManageClientRecords ? (
          <ClientForm returnContext={returnContext} />
        ) : (
          <SectionCard title="Read-only access">
            <PermissionNotice message={readOnlyRoleMessage} />
          </SectionCard>
        )}
      </PageBody>
    </div>
  );
}
