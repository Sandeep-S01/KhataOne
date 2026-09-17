import {
  DetailList,
  FormMessage,
  PageBody,
  PageHeader,
  SectionCard,
  SetupRequired,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!hasSupabaseConfig()) {
    return <SetupRequired message="Your workspace is temporarily unavailable. Please try again later." />;
  }

  const context = await getFirmContext();
  if (!context) return null;

  const { firm, supabase, user } = context;
  const { data: firmRecord, error } = await supabase
    .from("firms")
    .select("name, gstin, phone, email, address, status")
    .eq("id", firm.id)
    .single();

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="View your firm's contact details and your account access."
      />
      <PageBody>
        {error && (
          <FormMessage message="Some firm details could not be loaded. Refresh the page to try again." />
        )}
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <SectionCard
            title="Firm profile"
            actions={firmRecord?.status && (
              <StatusChip tone={firmRecord.status === "active" ? "success" : "warning"}>
                {firmRecord.status}
              </StatusChip>
            )}
          >
            <DetailList
              labelWidth="100px"
              items={[
                { label: "Name", value: firmRecord?.name ?? firm.name ?? "Not provided" },
                { label: "GSTIN", value: firmRecord?.gstin ?? "Not provided", mono: true },
                { label: "Phone", value: firmRecord?.phone ?? "Not provided" },
                { label: "Email", value: firmRecord?.email ?? "Not provided" },
                { label: "Address", value: firmRecord?.address ?? "Not provided" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Your account">
            <DetailList
              labelWidth="100px"
              items={[
                { label: "Email", value: user.email ?? "Not provided" },
                { label: "Role", value: firm.role.replaceAll("_", " ") },
              ]}
            />
          </SectionCard>
        </div>
      </PageBody>
    </div>
  );
}
