import { notFound } from "next/navigation";

import { archiveClientAction } from "@/app/actions/clients";
import {
  ActionLink,
  Button,
  DataTable,
  DetailList,
  EmptyState,
  PageBody,
  PageHeader,
  RecordCount,
  SectionCard,
  SetupRequired,
  StatTile,
  TextLink,
  tableActionCellClass,
  tableActionHeadCellClass,
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
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import {
  formatDisplayDateRange,
  formatDisplayDateTime,
} from "@/lib/format";

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

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

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
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("firm_id", firm.id)
    .single();

  if (!client) {
    notFound();
  }

  const documentsPromise = supabase
    .from("documents")
    .select("id, document_type, file_name, status, received_at, created_at")
    .eq("client_id", client.id)
    .eq("firm_id", firm.id)
    .order("received_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(6);
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
    .limit(3);
  const auditsPromise = supabase
    .from("audit_logs")
    .select("id, action, created_at, actor_user_id")
    .eq("client_id", client.id)
    .eq("firm_id", firm.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const [
    documentsResult,
    reviewCountResult,
    approvedCountResult,
    gstPeriodsResult,
    auditsResult,
  ] = await Promise.all([
    documentsPromise,
    reviewCountPromise,
    approvedCountPromise,
    gstPeriodsPromise,
    auditsPromise,
  ]);
  const recentDocuments = documentsResult.data ?? [];
  const gstPeriods = gstPeriodsResult.data ?? [];
  const audits = auditsResult.data ?? [];

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
            href="/dashboard/clients"
          >
            Back to clients
          </ActionLink>
          <ActionLink
            href={`/dashboard/clients/${client.id}/edit`}
          >
            Edit
          </ActionLink>
          {client.status !== "archived" && (
            <form action={archiveClientAction}>
              <input type="hidden" name="client_id" value={client.id} />
              <Button type="submit" variant="danger" size="sm">
                Archive
              </Button>
            </form>
          )}
          </>
        }
      />

      <PageBody>
        <div className="grid gap-3 md:grid-cols-3">
          <StatTile
            label="Pending review"
            value={reviewCountResult.count ?? 0}
            tone={(reviewCountResult.count ?? 0) > 0 ? "warning" : "success"}
          />
          <StatTile
            label="Approved records"
            value={approvedCountResult.count ?? 0}
            tone="success"
          />
          <StatTile
            label="Recent documents"
            value={recentDocuments.length}
            tone="brand"
          />
        </div>

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

        <SectionCard
          title="Recent documents"
          actions={<RecordCount value={recentDocuments.length} label="latest" />}
          bodyClassName="p-0"
        >
          {recentDocuments.length === 0 ? (
            <EmptyState
              title="No documents received"
              message="Recent WhatsApp documents and text notes for this client will appear here."
            />
          ) : (
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
          )}
        </SectionCard>

        <SectionCard
          title="GST readiness"
          actions={
            <RecordCount
              value={gstPeriods.length}
              label="periods"
              singularLabel="period"
            />
          }
          bodyClassName="p-0"
        >
          {gstPeriods.length === 0 ? (
            <EmptyState
              title="No GST periods generated"
              message="Generate a GST summary after transactions are approved for this client."
            />
          ) : (
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
                  const issueCount =
                    Number(summary?.mismatch_count ?? 0) +
                    Number(summary?.missing_document_count ?? 0);

                  return (
                    <tr key={period.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
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
                      <td className={tableNumericCellClass}>{issueCount}</td>
                      <td className={tableNumericCellClass}>
                        {formatCurrency(summary?.net_tax_payable ?? 0)}
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
          )}
        </SectionCard>

        <SectionCard title="Audit history" bodyClassName="p-0">
          {!audits || audits.length === 0 ? (
            <EmptyState
              title="No audit entries yet"
              message="Client changes and sensitive workflow actions will appear here."
            />
          ) : (
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
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {audit.actor_user_id || "system"}
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {formatDisplayDateTime(audit.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
            </DataTable>
          )}
        </SectionCard>
        </div>
      </PageBody>
    </div>
  );
}
