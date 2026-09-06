import { ClientForm } from "@/components/client-form";
import { ActionLink, PageBody, PageHeader } from "@/components/design-system";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        eyebrow="New client"
        title="Add business client"
        description="Store the accounting identity and WhatsApp mapping needed before document intake can safely match inbound messages."
        actions={
          <ActionLink href="/dashboard/clients">Back to clients</ActionLink>
        }
      />
      <PageBody>
        <ClientForm />
      </PageBody>
    </div>
  );
}
