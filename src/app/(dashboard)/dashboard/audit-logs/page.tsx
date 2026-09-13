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
  PaginationControls,
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
  tableSecondaryTextClass,
  tableRowClass,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import {
  auditEntityHref,
  safeAuditChangeEntries,
  safeAuditMetadataEntries,
} from "@/lib/audit-display";
import { normalizePage } from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { auditDateOnlyToIndiaUtcRange, formatDisplayDateTime } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
const pageSize = 50;

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
  const page = normalizePage(readParam(params.page));
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize;

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing audit activity." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  let query = supabase
    .from("audit_logs")
    .select("id, client_id, actor_user_id, action, entity_type, entity_id, before_data, after_data, metadata, created_at, clients(business_name)")
    .eq("firm_id", firm.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(rangeFrom, rangeTo);

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
    const fromRange = auditDateOnlyToIndiaUtcRange(from);

    if (fromRange) {
      query = query.gte("created_at", fromRange.start);
    }
  }

  if (to) {
    const toRange = auditDateOnlyToIndiaUtcRange(to);

    if (toRange) {
      query = query.lte("created_at", toRange.end);
    }
  }

  const entityTypesQuery = supabase
    .from("audit_logs")
    .select("entity_type")
    .eq("firm_id", firm.id)
    .order("entity_type");

  const [{ data: logs, error }, { data: entityTypes }] = await Promise.all([
    query,
    entityTypesQuery,
  ]);

  const uniqueEntityTypes = Array.from(
    new Set((entityTypes ?? []).map((row) => row.entity_type).filter(Boolean)),
  );
  const pageLogs = (logs ?? []).slice(0, pageSize);
  const hasNextPage = (logs?.length ?? 0) > pageSize;

  return (
    <div>
      <PageHeader
        eyebrow="Audit Logs"
        title="Traceability"
        description="Trace client, extraction, review, ledger, GST, and export activity. Date filters use India calendar days."
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
            From date
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
            To date
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
        title="Audit events"
        description="Newest matching events are shown first. Use pagination to reach older matching audit records."
        actions={<RecordCount value={pageLogs.length} />}
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
          <>
          <DataTable minWidth={1240} ariaLabel="Audit log events">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Action</th>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Entity</th>
                  <th className={tableHeadCellClass}>Safe investigation detail</th>
                  <th className={tableHeadCellClass}>Actor</th>
                  <th className={tableNumericHeadCellClass}>Time</th>
                </tr>
              </thead>
              <tbody>
                {pageLogs.map((log) => {
                  const client = Array.isArray(log.clients)
                    ? log.clients[0]
                    : log.clients;
                  const entityHref = auditEntityHref(log.entity_type, log.entity_id);
                  const metadataEntries = safeAuditMetadataEntries(log.metadata);
                  const changeEntries = safeAuditChangeEntries(
                    log.entity_type,
                    log.before_data,
                    log.after_data,
                  );
                  const hasSafeDetails = metadataEntries.length > 0 || changeEntries.length > 0;

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
                        {entityHref ? (
                          <Link
                            href={entityHref}
                            className={`${tablePrimaryTextClass} underline decoration-khata-border underline-offset-4 hover:text-khata-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green`}
                          >
                            {log.entity_type}
                          </Link>
                        ) : (
                          <span className={tablePrimaryTextClass}>{log.entity_type}</span>
                        )}
                        <p className={`mt-1 ${tableMonoTextClass} text-khata-muted`}>
                          {log.entity_id ?? "No entity id"}
                        </p>
                      </td>
                      <td className={`${tableCellClass} max-w-xl`}>
                        {hasSafeDetails ? (
                          <div className="space-y-2 text-xs leading-5">
                            {changeEntries.length > 0 && (
                              <div className="space-y-1">
                                {changeEntries.slice(0, 4).map((entry) => (
                                  <p key={entry.label} className="text-khata-muted">
                                    <span className="font-medium text-khata-ink">{entry.label}:</span>{" "}
                                    <span className={entry.mono ? tableMonoTextClass : undefined}>
                                      {entry.before}
                                    </span>{" "}
                                    <span aria-hidden="true">→</span>{" "}
                                    <span className={entry.mono ? tableMonoTextClass : undefined}>
                                      {entry.after}
                                    </span>
                                  </p>
                                ))}
                                {changeEntries.length > 4 && (
                                  <p className="text-khata-muted">More safe changes are available in the record.</p>
                                )}
                              </div>
                            )}
                            {metadataEntries.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {metadataEntries.slice(0, 5).map((entry) => (
                                  <span
                                    key={entry.label}
                                    className="rounded-full border border-khata-border bg-khata-paperMuted px-2 py-1 text-[11px] text-khata-muted"
                                  >
                                    <span className="font-medium text-khata-ink">{entry.label}:</span>{" "}
                                    <span className={entry.mono ? tableMonoTextClass : undefined}>
                                      {entry.value}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={tableSecondaryTextClass}>No safe details</span>
                        )}
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {log.actor_user_id ?? "system"}
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {formatDisplayDateTime(log.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </DataTable>
          <PaginationControls
            basePath="/dashboard/audit-logs"
            page={page}
            hasNext={hasNextPage}
            searchParams={{
              action,
              entity_type: entityType,
              actor,
              from,
              to,
              page: String(page),
            }}
            label="audit events"
          />
          </>
        )}
      </SectionCard>
      </PageBody>
    </div>
  );
}
