import {
  ActionLink,
  Button,
  DataTable,
  EmptyState,
  FieldLabel,
  FilterBar,
  Input,
  PageBody,
  PageHeader,
  QueryError,
  RecordCount,
  SectionCard,
  Select,
  SetupRequired,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableMonoTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tablePrimaryTextClass,
  tableRowClass,
} from "@/components/design-system";
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
  const actor = readParam(params.actor)?.trim() ?? "";
  const from = readParam(params.from)?.trim() ?? "";
  const to = readParam(params.to)?.trim() ?? "";

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing audit activity." />
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

  if (actor) {
    query = query.eq("actor_user_id", actor);
  }

  if (from) {
    query = query.gte("created_at", `${from}T00:00:00.000Z`);
  }

  if (to) {
    query = query.lte("created_at", `${to}T23:59:59.999Z`);
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
    <div>
      <PageHeader
        eyebrow="Audit Logs"
        title="Traceability"
        description="Review firm actions across client setup, AI extraction, approvals, ledger corrections, GST summaries, and exports."
      />

      <PageBody>
      <FilterBar action="/dashboard/audit-logs" className="md:grid-cols-5">
        <label className="block">
          <FieldLabel>
            Action contains
          </FieldLabel>
          <Input
            name="action"
            defaultValue={action}
            placeholder="approved, generated, corrected"
            className="mt-1"
          />
        </label>
        <label className="block">
          <FieldLabel>
            Entity
          </FieldLabel>
          <Select
            name="entity_type"
            defaultValue={entityType}
            className="mt-1"
          >
            <option value="">All entities</option>
            {uniqueEntityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <FieldLabel>
            Actor
          </FieldLabel>
          <Input
            name="actor"
            defaultValue={actor}
            placeholder="User id"
            className="mt-1"
          />
        </label>
        <label className="block">
          <FieldLabel>
            From
          </FieldLabel>
          <Input
            name="from"
            type="date"
            defaultValue={from}
            className="mt-1"
          />
        </label>
        <label className="block">
          <FieldLabel>
            To
          </FieldLabel>
          <Input
            name="to"
            type="date"
            defaultValue={to}
            className="mt-1"
          />
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Filter
          </Button>
          <ActionLink href="/dashboard/audit-logs" size="sm">
            Reset
          </ActionLink>
        </div>
      </FilterBar>

      <SectionCard
        title="Recent audit events"
        actions={<RecordCount value={logs?.length ?? 0} />}
        bodyClassName="p-0"
      >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!logs || logs.length === 0) && (
          <EmptyState
            title="No audit logs found"
            message="Actions will appear here as users create clients, review transactions, correct ledgers, generate GST summaries, and create exports."
          />
        )}

        {!error && logs && logs.length > 0 && (
          <DataTable minWidth={1040} ariaLabel="Audit log events">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Action</th>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Entity</th>
                  <th className={tableHeadCellClass}>Actor</th>
                  <th className={tableNumericHeadCellClass}>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const client = Array.isArray(log.clients)
                    ? log.clients[0]
                    : log.clients;

                  return (
                    <tr key={log.id} className={tableRowClass}>
                      <td className={tableCellClass}>
                        <StatusChip tone={actionTone(log.action)}>
                          {log.action}
                        </StatusChip>
                      </td>
                      <td className={tableCellClass}>
                        {client?.business_name ?? "Not linked"}
                      </td>
                      <td className={tableCellClass}>
                        <span className={tablePrimaryTextClass}>{log.entity_type}</span>
                        <p className={`mt-1 ${tableMonoTextClass} text-khata-muted`}>
                          {log.entity_id ?? "No entity id"}
                        </p>
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {log.actor_user_id ?? "system"}
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </DataTable>
        )}
      </SectionCard>
      </PageBody>
    </div>
  );
}
