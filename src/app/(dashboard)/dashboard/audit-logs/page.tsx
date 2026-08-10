import Link from "next/link";

import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function actionTone(action: string) {
  if (action.includes("approved") || action.includes("generated")) {
    return "success";
  }

  if (action.includes("rejected") || action.includes("failed")) {
    return "danger";
  }

  if (action.includes("corrected") || action.includes("clarification")) {
    return "warning";
  }

  return "neutral";
}

function readParam(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const action = readParam(params.action)?.trim() ?? "";
  const entityType = readParam(params.entity_type)?.trim() ?? "";

  if (!hasSupabaseConfig()) {
    return (
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-khata-muted">
            Audit logs need Supabase environment variables and migrations.
          </p>
        </section>
      </div>
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select("id, client_id, actor_user_id, action, entity_type, entity_id, metadata, created_at, clients(business_name)")
    .eq("firm_id", firm!.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (action) {
    query = query.ilike("action", `%${action}%`);
  }

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data: logs, error } = await query;
  const { data: entityTypes } = await supabase
    .from("audit_logs")
    .select("entity_type")
    .eq("firm_id", firm!.id)
    .order("entity_type");

  const uniqueEntityTypes = Array.from(
    new Set((entityTypes ?? []).map((row) => row.entity_type).filter(Boolean)),
  );

  return (
    <div className="p-5">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase text-khata-green">
          Audit Logs
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Traceability</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Review firm actions across client setup, AI extraction, approvals,
          ledger corrections, GST summaries, and exports.
        </p>
      </div>

      <form className="mb-5 grid gap-3 rounded-lg border border-khata-border bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Action contains
          </span>
          <input
            name="action"
            defaultValue={action}
            placeholder="approved, generated, corrected"
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-khata-muted">
            Entity
          </span>
          <select
            name="entity_type"
            defaultValue={entityType}
            className="mt-1 h-10 w-full rounded-md border border-khata-border bg-khata-paper px-3 text-sm outline-none focus:border-khata-green"
          >
            <option value="">All entities</option>
            {uniqueEntityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className="h-10 rounded-md bg-khata-green px-4 text-sm font-semibold text-white">
            Filter
          </button>
          <Link
            href="/dashboard/audit-logs"
            className="inline-flex h-10 items-center rounded-md border border-khata-border bg-khata-paper px-4 text-sm font-semibold"
          >
            Reset
          </Link>
        </div>
      </form>

      <section className="rounded-lg border border-khata-border bg-white shadow-ledger">
        <div className="flex items-center justify-between border-b border-khata-border px-4 py-3">
          <p className="text-sm font-semibold">Recent audit events</p>
          <span className="font-mono text-xs text-khata-muted">
            {logs?.length ?? 0} records
          </span>
        </div>

        {error && (
          <div className="p-4 text-sm text-khata-danger">{error.message}</div>
        )}

        {!error && (!logs || logs.length === 0) && (
          <div className="p-6">
            <p className="text-sm font-semibold">No audit logs found</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-khata-muted">
              Actions will appear here as users create clients, review
              transactions, correct ledgers, generate GST summaries, and create
              exports.
            </p>
          </div>
        )}

        {!error && logs && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
              <thead className="bg-khata-paperMuted text-xs text-khata-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const client = Array.isArray(log.clients)
                    ? log.clients[0]
                    : log.clients;

                  return (
                    <tr key={log.id} className="border-t border-khata-border">
                      <td className="px-4 py-3">
                        <StatusChip tone={actionTone(log.action)}>
                          {log.action}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3">
                        {client?.business_name ?? "Not linked"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{log.entity_type}</span>
                        <p className="mt-1 font-mono text-xs text-khata-muted">
                          {log.entity_id ?? "No entity id"}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {log.actor_user_id ?? "system"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
