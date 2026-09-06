import { CheckCircle2, CircleAlert } from "lucide-react";

import {
  DataTable,
  DetailList,
  EmptyState,
  IconPanel,
  PageBody,
  PageHeader,
  RecordCount,
  SectionCard,
  SetupRequired,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableMonoTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tableRowClass,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import { getExtractionProviderOrder } from "@/lib/ai/extraction-providers";
import { getOptionalServerEnv, hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function ConfigStatus({
  label,
  configured,
}: {
  label: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-khata-border py-3 last:border-b-0">
      <span className="text-sm font-medium">{label}</span>
      <StatusChip tone={configured ? "success" : "warning"}>
        {configured ? "Configured" : "Pending"}
      </StatusChip>
    </div>
  );
}

export default async function SettingsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing firm configuration." />
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: firmRecord } = await supabase
    .from("firms")
    .select("id, name, slug, gstin, phone, email, address, status, created_at")
    .eq("id", firm!.id)
    .single();
  const { data: members } = await supabase
    .from("firm_users")
    .select("id, user_id, role, status, created_at")
    .eq("firm_id", firm!.id)
    .order("created_at", { ascending: true });

  const integrationRows = [
    ["Supabase public URL", hasSupabaseConfig()],
    ["Supabase service role", Boolean(getOptionalServerEnv("SUPABASE_SERVICE_ROLE_KEY"))],
    ["WhatsApp app secret", Boolean(getOptionalServerEnv("WHATSAPP_APP_SECRET"))],
    ["WhatsApp access token", Boolean(getOptionalServerEnv("WHATSAPP_ACCESS_TOKEN"))],
    ["OpenAI API key", Boolean(getOptionalServerEnv("OPENAI_API_KEY"))],
    ["AI extraction model", Boolean(getOptionalServerEnv("OPENAI_EXTRACTION_MODEL"))],
    ["Rule-based fallback", getExtractionProviderOrder().includes("rule_based_text")],
    ["Job runner secret", Boolean(getOptionalServerEnv("JOB_RUNNER_SECRET"))],
    ["Cron secret", Boolean(getOptionalServerEnv("CRON_SECRET"))],
  ] as const;

  const configuredCount = integrationRows.filter(([, configured]) => configured)
    .length;

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Firm configuration"
        description="Review workspace identity, role boundaries, integration readiness, and security setup for this firm."
      />

      <PageBody>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="Firm profile"
          actions={
            <StatusChip tone={firmRecord?.status === "active" ? "success" : "warning"}>
              {firmRecord?.status ?? "pending"}
            </StatusChip>
          }
        >
          <DetailList
            labelWidth="100px"
            items={[
              { label: "Name", value: firmRecord?.name ?? firm?.name ?? "Pending" },
              { label: "Slug", value: firmRecord?.slug ?? "Pending", mono: true },
              { label: "GSTIN", value: firmRecord?.gstin ?? "Pending", mono: true },
              { label: "Phone", value: firmRecord?.phone ?? "Pending", mono: true },
              { label: "Email", value: firmRecord?.email ?? "Pending" },
              { label: "Address", value: firmRecord?.address ?? "Pending" },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Integration readiness"
          actions={<RecordCount value={configuredCount} label={`of ${integrationRows.length}`} />}
        >
          <p className="mt-2 font-mono text-xs text-khata-muted">
            AI order: {getExtractionProviderOrder().join(", ")}
          </p>
          <div className="mt-3">
            {integrationRows.map(([label, configured]) => (
              <ConfigStatus
                key={label}
                label={label}
                configured={configured}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Workspace members"
        actions={<RecordCount value={members?.length ?? 0} label="users" />}
        bodyClassName="p-0"
      >
        {!members || members.length === 0 ? (
          <EmptyState
            title="No active memberships found"
            message="Active firm users and role boundaries will appear here."
          />
        ) : (
          <DataTable minWidth={760}>
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>User</th>
                  <th className={tableHeadCellClass}>Role</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableNumericHeadCellClass}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className={tableRowClass}>
                    <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                      {member.user_id}
                    </td>
                    <td className={`${tableCellClass} capitalize`}>{member.role}</td>
                    <td className={tableCellClass}>
                      <StatusChip
                        tone={member.status === "active" ? "success" : "warning"}
                      >
                        {member.status}
                      </StatusChip>
                    </td>
                    <td className={`${tableNumericCellClass} text-xs`}>
                      {new Date(member.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
          </DataTable>
        )}
      </SectionCard>

      <section className="grid gap-3 md:grid-cols-2">
        <IconPanel
          icon={CheckCircle2}
          title="Security boundaries"
          description="Firm data uses RLS and server-side firm checks. Sensitive files use private storage plus authenticated downloads."
          tone="success"
        />
        <IconPanel
          icon={CircleAlert}
          title="Production checks pending"
          description="Live RLS isolation, webhook retries, extraction accuracy, export formats, backups, and monitoring still need verification."
          tone="warning"
        />
      </section>
      </PageBody>
    </div>
  );
}
