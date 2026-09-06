import { StatusChip } from "@/components/status-chip";
import {
  DataTable,
  EmptyState,
  InlineAlert,
  PageBody,
  PageHeader,
  QueryError,
  RecordCount,
  SectionCard,
  SetupRequired,
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
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "draft":
      return "info";
    case "needs_review":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
    case "duplicate":
      return "danger";
    default:
      return "neutral";
  }
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function extractionSource(model?: string | null) {
  return model === "rule_based_text_v1" ? "Rule-based extraction" : "AI extraction";
}

export default async function ReviewQueuePage() {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before reviewing extracted transactions." />
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      "id, client_id, transaction_type, status, transaction_date, party_name, invoice_number, total_amount, confidence_score, clients(business_name), ai_extractions(risk_flags, model)",
    )
    .eq("firm_id", firm!.id)
    .in("status", ["draft", "needs_review", "duplicate"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        eyebrow="Review Queue"
        title="AI extraction review"
        description="AI-created transactions stay draft or needs-review until a CA approves them in the next workflow phase."
      />

      <PageBody>
        <SectionCard
          title="Extracted transactions"
          actions={<RecordCount value={transactions?.length ?? 0} />}
          bodyClassName="p-0"
        >

        {error && (
          <QueryError message={error.message} />
        )}

        {!error && (!transactions || transactions.length === 0) && (
          <EmptyState
            title="No review items yet"
            message="WhatsApp documents will appear here after text extraction and the AI extraction job creates draft transaction records."
          />
        )}

        {!error && transactions && transactions.length > 0 && (
          <DataTable minWidth={920}>
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Party</th>
                  <th className={tableHeadCellClass}>Invoice</th>
                  <th className={tableHeadCellClass}>Type</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableNumericHeadCellClass}>
                    Confidence
                  </th>
                  <th className={tableNumericHeadCellClass}>Amount</th>
                  <th className={tableActionHeadCellClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const client = Array.isArray(transaction.clients)
                    ? transaction.clients[0]
                    : transaction.clients;
                  const extraction = Array.isArray(transaction.ai_extractions)
                    ? transaction.ai_extractions[0]
                    : transaction.ai_extractions;
                  const riskCount = extraction?.risk_flags?.length ?? 0;

                  return (
                    <tr
                      key={transaction.id}
                      className={tableRowClass}
                    >
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {client?.business_name ?? "Unknown client"}
                      </td>
                      <td className={tableCellClass}>
                        {transaction.party_name ?? "Pending"}
                        {riskCount > 0 && (
                          <p className="mt-1">
                            <InlineAlert tone="warning">
                              {riskCount} risk flag{riskCount === 1 ? "" : "s"}
                            </InlineAlert>
                          </p>
                        )}
                        <p className={`mt-1 ${tableSecondaryTextClass}`}>
                          {extractionSource(extraction?.model)}
                        </p>
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {transaction.invoice_number ?? "Pending"}
                      </td>
                      <td className={`${tableCellClass} capitalize`}>
                        {transaction.transaction_type}
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip tone={statusTone(transaction.status)}>
                          {transaction.status.replaceAll("_", " ")}
                        </StatusChip>
                      </td>
                      <td className={tableNumericCellClass}>
                        {Math.round(transaction.confidence_score * 100)}%
                      </td>
                      <td className={tableNumericCellClass}>
                        {formatCurrency(transaction.total_amount)}
                      </td>
                      <td className={tableActionCellClass}>
                        <TextLink
                          href={`/dashboard/review-queue/${transaction.id}`}
                        >
                          Review
                        </TextLink>
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
