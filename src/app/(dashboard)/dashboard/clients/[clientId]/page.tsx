import { DeferredSection } from "@/components/deferred-section";
import { notFound } from "next/navigation";

import { archiveClientAction } from "@/app/actions/clients";
import {
  ActionLink,
  DataTable,
  DetailList,
  EmptyState,
  PageBody,
  PageHeader,
  PaginationControls,
  PermissionNotice,
  QueryError,
  RecordCount,
  SectionCard,
  SetupRequired,
  StatTile,
  TableToolbar,
  TextLink,
  tableActionCellClass,
  tableActionHeadCellClass,
  tableCellClass,
  tableHeadCellClass,
  tableHeaderClass,
  tableNumericTextClass,
  tableNumericCellClass,
  tableNumericHeadCellClass,
  tablePrimaryTextClass,
  tableSecondaryTextClass,
  tableRowClass,
} from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import {
  attentionToneForCount,
  countHint,
  countOrUnavailable,
  displayCount,
  formatNullableCurrency,
} from "@/lib/availability";
import { hasSupabaseConfig } from "@/lib/env";
import { dashboardPageSize, normalizePage } from "@/lib/dashboard-query";
import { getFirmContext } from "@/lib/firms";
import {
  formatDisplayDateRange,
  formatDisplayDateTime,
} from "@/lib/format";
import { canManageClients, readOnlyRoleMessage } from "@/lib/permissions";
import {
  appendReturnContext,
  clientReturnKeys,
  dashboardReturnHref,
  sanitizeReturnContext,
} from "@/lib/return-context";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "active":
    case "filing_ready":
      return "success";
    case "pending_documents":
    case "review_needed":
      return "warning";
    case "archived":
      return "danger";
    default:
      return "neutral";
  }
}


export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ return_to?: string; documents_page?: string; gst_page?: string; audit_page?: string }>;
}) {
  const { clientId } = await params;
  const filters = await searchParams;
  const { return_to: rawReturnContext } = filters;
  const documentsPage = normalizePage(filters.documents_page);
  const gstPage = normalizePage(filters.gst_page);
  const auditPage = normalizePage(filters.audit_page);
  const documentsFrom = (documentsPage - 1) * dashboardPageSize;
  const gstFrom = (gstPage - 1) * dashboardPageSize;
  const auditFrom = (auditPage - 1) * dashboardPageSize;
  const basePath = `/dashboard/clients/${clientId}`;
  const returnContext = sanitizeReturnContext(rawReturnContext, clientReturnKeys);
  const clientsHref = dashboardReturnHref(
    "/dashboard/clients",
    returnContext,
    clientReturnKeys,
  );

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing client details." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("firm_id", firm.id)
    .single();

  if (!client && clientError?.code === "PGRST116") {
    notFound();
  }

  if (!client) {
    return (
      <QueryError message="Client details could not be loaded. Refresh to retry." />
    );
  }

  const documentsPromise = Promise.resolve(supabase
    .from("documents")
    .select("id, document_type, file_name, status, received_at, created_at")
    .eq("client_id", client.id)
    .eq("firm_id", firm.id)
    .order("received_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(documentsFrom, documentsFrom + dashboardPageSize)).catch(() => ({ data: null, error: { message: "Recent documents unavailable" } }));
  const documentsCountPromise = supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id)
    .eq("firm_id", firm.id);
  const reviewCountPromise = supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id)
    .eq("firm_id", firm.id)
    .in("status", ["draft", "needs_review", "duplicate"]);
  const approvedCountPromise = supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id)
    .eq("firm_id", firm.id)
    .eq("status", "approved");
  const gstPeriodsPromise = supabase
    .from("gst_periods")
    .select("id, period_start, period_end, filing_type, status, gst_summaries(net_tax_payable, mismatch_count, missing_document_count)")
    .eq("client_id", client.id)
    .eq("firm_id", firm.id)
    .order("period_start", { ascending: false })
    .order("id", { ascending: false })
    .range(gstFrom, gstFrom + dashboardPageSize);
  const auditsPromise = supabase
    .from("audit_logs")
    .select("id, action, created_at, actor_user_id")
    .eq("client_id", client.id)
    .eq("firm_id", firm.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(auditFrom, auditFrom + dashboardPageSize);

  const canManageClientRecords = canManageClients(firm.role);

  return (
    <div>
      <PageHeader
        eyebrow="Clients"
        title={client.business_name}
        description="Client identity, GST setup, WhatsApp mapping, and audit history."
        meta={
          <StatusChip tone={statusTone(client.status)}>
            {client.status.replaceAll("_", " ")}
          </StatusChip>
        }
        actions={
          <>
          <ActionLink
            href={clientsHref}
          >
            Back to clients
          </ActionLink>
          {canManageClientRecords && (
            <ActionLink
              href={appendReturnContext(
                `/dashboard/clients/${client.id}/edit`,
                returnContext,
              )}
            >
              Edit
            </ActionLink>
          )}
          {canManageClientRecords && client.status !== "archived" && (
            <form action={archiveClientAction}>
              <input type="hidden" name="client_id" value={client.id} />
              {returnContext && (
                <input type="hidden" name="return_context" value={returnContext} />
              )}
              <PendingSubmitButton
                variant="danger"
                size="sm"
                pendingLabel="Archiving..."
              >
                Archive
              </PendingSubmitButton>
            </form>
          )}
          </>
        }
      />

      <PageBody>
        {!canManageClientRecords && (
          <SectionCard title="Read-only access">
            <PermissionNotice message={readOnlyRoleMessage} />
          </SectionCard>
        )}

        <DeferredSection
          title="Client summary"
          load={() => Promise.all([documentsCountPromise, reviewCountPromise, approvedCountPromise])}
          errorMessage="Client summary could not be loaded. Refresh to retry."
          fallback={<div className="grid gap-3 md:grid-cols-3" aria-busy="true" aria-label="Loading client summary">
            {["Pending review", "Approved records", "Documents received"].map((label) => (
              <StatTile key={label} label={label} value="Loading..." />
            ))}
          </div>}
        >
          {([documentsCountResult, reviewCountResult, approvedCountResult]) => {
            const documentsCount = countOrUnavailable(documentsCountResult);
            const reviewCount = countOrUnavailable(reviewCountResult);
            const approvedCount = countOrUnavailable(approvedCountResult);
            return (
              <div className="grid gap-3 md:grid-cols-3">
                <StatTile
                  label="Pending review"
                  value={displayCount(reviewCount)}
                  tone={attentionToneForCount(reviewCount)}
                  hint={countHint(reviewCount, "Draft, needs-review, and duplicate-risk records.")}
                />
                <StatTile
                  label="Approved records"
                  value={displayCount(approvedCount)}
                  tone={approvedCount === null ? "danger" : approvedCount > 0 ? "success" : "neutral"}
                  hint={countHint(approvedCount, "Approved transaction records.")}
                />
                <StatTile
                  label="Documents received"
                  value={displayCount(documentsCount)}
                  tone={documentsCount === null ? "danger" : documentsCount > 0 ? "brand" : "neutral"}
                  hint={countHint(documentsCount, "Linked document records for this client.")}
                />
              </div>
            );
          }}
        </DeferredSection>

        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Client profile">
          <DetailList
            labelWidth="130px"
            items={[
              { label: "Contact", value: client.contact_name || "Not provided" },
              { label: "Phone", value: client.phone || "Not provided", mono: true },
              { label: "WhatsApp", value: client.whatsapp_phone || "Not linked", mono: true },
              { label: "Email", value: client.email || "Not provided" },
              { label: "GSTIN", value: client.gstin || "Not provided", mono: true },
              { label: "State code", value: client.state_code || "Not provided", mono: true },
              { label: "Filing", value: client.filing_frequency },
            ]}
          />
        </SectionCard>

        <DeferredSection title="Recent documents" load={() => documentsPromise} errorMessage="Recent documents could not be loaded. Refresh to retry.">
          {(documentsResult) => {
            const recentDocuments = documentsResult.data ?? [];
            return (
              <SectionCard bodyClassName="p-0">
                <TableToolbar
                  title="Recent documents"
                  meta={<RecordCount value={recentDocuments.length} label="shown" />}
                />
                {documentsResult.error ? (
                  <QueryError message="Recent documents could not be loaded. Refresh to retry." />
                ) : recentDocuments.length === 0 ? (
                  <>
                  <EmptyState
                    title={documentsPage > 1 ? "No documents on this page" : "No documents received"}
                    message={documentsPage > 1 ? "Go back to an earlier page." : "Recent WhatsApp documents and text notes for this client will appear here."}
                  />
                  {documentsPage > 1 && <PaginationControls basePath={basePath} pageKey="documents_page" page={documentsPage} hasNext={false} searchParams={filters} label="documents" />}
                  </>
                ) : (
                  <>
                  <DataTable minWidth={680} ariaLabel="Recent client documents">
                    <thead className={tableHeaderClass}>
                      <tr>
                        <th className={tableHeadCellClass}>Document</th>
                        <th className={tableHeadCellClass}>Status</th>
                        <th className={tableNumericHeadCellClass}>Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDocuments.map((document) => (
                        <tr key={document.id} className={tableRowClass}>
                          <td className={tableCellClass}>
                            <p className={tablePrimaryTextClass}>
                              {document.file_name ?? document.document_type}
                            </p>
                            <p className={`${tableSecondaryTextClass} capitalize`}>
                              {document.document_type.replaceAll("_", " ")}
                            </p>
                          </td>
                          <td className={tableCellClass}>
                            <StatusChip tone={statusTone(document.status)}>
                              {document.status.replaceAll("_", " ")}
                            </StatusChip>
                          </td>
                          <td className={`${tableNumericCellClass} text-xs`}>
                            {formatDisplayDateTime(
                              document.received_at ?? document.created_at,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                  <PaginationControls basePath={basePath} pageKey="documents_page" page={documentsPage} hasNext={(documentsResult.data?.length ?? 0) > dashboardPageSize} searchParams={filters} label="documents" />
                  </>
                )}
              </SectionCard>
            );
          }}
        </DeferredSection>

        <DeferredSection title="GST readiness" load={() => gstPeriodsPromise} errorMessage="GST readiness periods could not be loaded. Refresh to retry.">
          {(gstPeriodsResult) => {
            const gstPeriods = (gstPeriodsResult.data ?? []).slice(0, dashboardPageSize);
            return (
              <SectionCard bodyClassName="p-0">
                <TableToolbar
                  title="GST readiness"
                  meta={
                    <RecordCount
                      value={gstPeriodsResult.error ? 0 : gstPeriods.length}
                      label="periods"
                      singularLabel="period"
                    />
                  }
                />
                {gstPeriodsResult.error ? (
                  <QueryError message="GST readiness periods could not be loaded. Refresh to retry." />
                ) : gstPeriods.length === 0 ? (
                  <>
                  <EmptyState
                    title={gstPage > 1 ? "No GST periods on this page" : "No GST periods generated"}
                    message={gstPage > 1 ? "Go back to an earlier page." : "Generate a GST summary after transactions are approved for this client."}
                  />
                  {gstPage > 1 && <PaginationControls basePath={basePath} pageKey="gst_page" page={gstPage} hasNext={false} searchParams={filters} label="GST periods" />}
                  </>
                ) : (
                  <>
                  <DataTable minWidth={760} ariaLabel="Client GST readiness">
                    <thead className={tableHeaderClass}>
                      <tr>
                        <th className={tableHeadCellClass}>Period</th>
                        <th className={tableHeadCellClass}>Readiness</th>
                        <th className={tableNumericHeadCellClass}>Issues</th>
                        <th className={tableNumericHeadCellClass}>Net tax</th>
                        <th className={tableActionHeadCellClass}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstPeriods.map((period) => {
                        const summary = Array.isArray(period.gst_summaries)
                          ? period.gst_summaries[0]
                          : period.gst_summaries;
                        const issueCount = summary
                          ? Number(summary.mismatch_count ?? 0) +
                            Number(summary.missing_document_count ?? 0)
                          : null;

                        return (
                          <tr key={period.id} className={tableRowClass}>
                            <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                              {formatDisplayDateRange(
                                period.period_start,
                                period.period_end,
                              )}
                              <p className={`${tableSecondaryTextClass} capitalize`}>
                                {period.filing_type}
                              </p>
                            </td>
                            <td className={tableCellClass}>
                              <StatusChip tone={statusTone(period.status)}>
                                {period.status.replaceAll("_", " ")}
                              </StatusChip>
                            </td>
                            <td className={tableNumericCellClass}>
                              {issueCount ?? "Unavailable"}
                            </td>
                            <td className={tableNumericCellClass}>
                              {formatNullableCurrency(summary?.net_tax_payable)}
                            </td>
                            <td className={tableActionCellClass}>
                              <TextLink
                                href={`/dashboard/gst-summary/${period.id}`}
                                aria-label={`Open GST period for ${client.business_name}`}
                              >
                                Open
                              </TextLink>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </DataTable>
                  <PaginationControls basePath={basePath} pageKey="gst_page" page={gstPage} hasNext={(gstPeriodsResult.data?.length ?? 0) > dashboardPageSize} searchParams={filters} label="GST periods" />
                  </>
                )}
              </SectionCard>
            );
          }}
        </DeferredSection>

        <DeferredSection title="Audit history" load={() => auditsPromise} errorMessage="Client audit history could not be loaded. Refresh to retry.">
          {(auditsResult) => {
            const audits = (auditsResult.data ?? []).slice(0, dashboardPageSize);
            return (
              <SectionCard bodyClassName="p-0">
                <TableToolbar title="Audit history" />
                {auditsResult.error ? (
                  <QueryError message="Client audit history could not be loaded. Refresh to retry." />
                ) : !audits || audits.length === 0 ? (
                  <>
                  <EmptyState
                    title={auditPage > 1 ? "No audit entries on this page" : "No audit entries yet"}
                    message={auditPage > 1 ? "Go back to an earlier page." : "Client changes and sensitive workflow actions will appear here."}
                  />
                  {auditPage > 1 && <PaginationControls basePath={basePath} pageKey="audit_page" page={auditPage} hasNext={false} searchParams={filters} label="audit entries" />}
                  </>
                ) : (
                  <>
                  <DataTable minWidth={520} ariaLabel="Client audit history">
                      <thead className={tableHeaderClass}>
                        <tr>
                          <th className={tableHeadCellClass}>Action</th>
                          <th className={tableHeadCellClass}>Actor</th>
                          <th className={tableNumericHeadCellClass}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audits.map((audit) => (
                          <tr key={audit.id} className={tableRowClass}>
                            <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>{audit.action}</td>
                            <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                              {audit.actor_user_id || "system"}
                            </td>
                            <td className={`${tableNumericCellClass} text-xs`}>
                              {formatDisplayDateTime(audit.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </DataTable>
                  <PaginationControls basePath={basePath} pageKey="audit_page" page={auditPage} hasNext={(auditsResult.data?.length ?? 0) > dashboardPageSize} searchParams={filters} label="audit entries" />
                  </>
                )}
              </SectionCard>
            );
          }}
        </DeferredSection>
        </div>
      </PageBody>
    </div>
  );
}
