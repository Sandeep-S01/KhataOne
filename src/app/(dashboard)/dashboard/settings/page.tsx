import { cookies } from "next/headers";

import {
  DetailList,
  FormMessage,
  PageBody,
  PageHeader,
  SectionCard,
  SetupRequired,
} from "@/components/design-system";
import { FirmProfileSection } from "@/components/firm-profile-section";
import { PersonalPreferences } from "@/components/personal-preferences";
import { TeamMembersSection } from "@/components/team-members-section";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { canManageFirmMembers, canManageFirmProfile } from "@/lib/permissions";
import { parseStartPage, startPageCookieName } from "@/lib/personal-preferences";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!hasSupabaseConfig()) {
    return <SetupRequired message="Your workspace is temporarily unavailable. Please try again later." />;
  }

  const context = await getFirmContext();
  if (!context) return null;

  const { firm, supabase, user } = context;
  const initialStartPage = parseStartPage(
    (await cookies()).get(startPageCookieName(user.id))?.value,
  );
  const canManageTeam = canManageFirmMembers(firm.role);
  const [firmResult, memberResult] = await Promise.all([
    supabase.from("firms")
      .select("name, gstin, phone, email, address, status")
      .eq("id", firm.id)
      .single(),
    canManageTeam
      ? supabase.rpc("list_firm_members", { target_firm_id: firm.id })
      : Promise.resolve(null),
  ]);
  const { data: firmRecord, error } = firmResult;

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Set your workspace preferences and view firm details and account access."
      />
      <PageBody>
        {error && (
          <FormMessage message="Some firm details could not be loaded. Refresh the page to try again." />
        )}
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <SectionCard title="My preferences">
            <PersonalPreferences userId={user.id} initialStartPage={initialStartPage} />
          </SectionCard>
          <div className="grid gap-4">
            {firmRecord && (
              <FirmProfileSection
                profile={firmRecord}
                canEdit={canManageFirmProfile(firm.role)}
              />
            )}

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
        </div>
        {canManageTeam && (
          memberResult?.error || !memberResult?.data ? (
            <FormMessage message="Team members could not be loaded. Refresh the page to try again." />
          ) : (
            <TeamMembersSection
              members={memberResult.data}
              actorRole={firm.role}
              currentUserId={user.id}
            />
          )
        )}
      </PageBody>
    </div>
  );
}
