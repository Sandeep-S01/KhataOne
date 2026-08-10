import { CheckCircle2, CircleAlert } from "lucide-react";

import { StatusChip } from "@/components/status-chip";
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
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Firm settings need Supabase environment variables and migrations.
          </p>
        </section>
      </div>
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
    ["Job runner secret", Boolean(getOptionalServerEnv("JOB_RUNNER_SECRET"))],
  ] as const;

  const configuredCount = integrationRows.filter(([, configured]) => configured)
    .length;

  return (
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Firm configuration</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Review workspace identity, role boundaries, integration readiness, and
          security setup for this firm.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Firm profile</p>
            <StatusChip tone={firmRecord?.status === "active" ? "success" : "warning"}>
              {firmRecord?.status ?? "pending"}
            </StatusChip>
          </div>
          <dl className="mt-4 grid gap-4 text-sm">
            {[
              ["Name", firmRecord?.name ?? firm?.name ?? "Pending"],
              ["Slug", firmRecord?.slug ?? "Pending"],
              ["GSTIN", firmRecord?.gstin ?? "Pending"],
              ["Phone", firmRecord?.phone ?? "Pending"],
              ["Email", firmRecord?.email ?? "Pending"],
              ["Address", firmRecord?.address ?? "Pending"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[100px_1fr] gap-3 border-b border-khata-border pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="text-khata-muted">{label}</dt>
                <dd
                  className={
                    label === "GSTIN" || label === "Slug"
                      ? "font-mono"
                      : "font-medium"
                  }
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Integration readiness</p>
            <span className="font-mono text-xs text-khata-muted">
              {configuredCount}/{integrationRows.length}
            </span>
          </div>
          <div className="mt-3">
            {integrationRows.map(([label, configured]) => (
              <ConfigStatus
                key={label}
                label={label}
                configured={configured}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Workspace members</p>
          <span className="font-mono text-xs text-khata-muted">
            {members?.length ?? 0} users
          </span>
        </div>
        {!members || members.length === 0 ? (
          <div className="p-5 text-sm text-khata-muted">
            No active memberships found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-t border-khata-border">
                    <td className="px-4 py-3 font-mono text-xs">
                      {member.user_id}
                    </td>
                    <td className="px-4 py-3 capitalize">{member.role}</td>
                    <td className="px-4 py-3">
                      <StatusChip
                        tone={member.status === "active" ? "success" : "warning"}
                      >
                        {member.status}
                      </StatusChip>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {new Date(member.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-khata-border bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 text-khata-green" />
            <div>
              <p className="text-sm font-semibold">Security boundaries</p>
              <p className="mt-1 text-sm leading-6 text-khata-muted">
                Firm data uses RLS and server-side firm checks. Sensitive files
                use private storage plus authenticated downloads.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-khata-border bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold">Production checks pending</p>
              <p className="mt-1 text-sm leading-6 text-khata-muted">
                Live RLS isolation, webhook retries, extraction accuracy,
                export formats, backups, and monitoring still need verification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
