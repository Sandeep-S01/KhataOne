import { StatusChip } from "@/components/status-chip";
import {
  ActionLink,
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  InlineAlert,
  Input,
  PageBody,
  PageHeader,
  PaginationControls,
  QueryError,
  RecordCount,
  SectionCard,
  Select,
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
import { normalizePage, normalizeSearch } from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { formatDisplayDate } from "@/lib/format";
import { withServerTiming } from "@/lib/request-performance";
import {
  appendReturnContext,
  buildReturnContext,
  reviewQueueReturnKeys,
} from "@/lib/return-context";

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
    return "Not provided";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

const reviewStatusOptions = ["all", "draft", "needs_review", "duplicate"];
const reviewRiskOptions = ["all", "risk", "low_confidence"];
const pageSize = 50;
const documentTypeOptions = [
  "all",
  "purchase_invoice",
  "sales_invoice",
  "receipt",
  "bank_statement",
  "payment_proof",
  "audio_note",
  "text_note",
  "unclear",
];

type ReviewQueueRow = {
  id: string;
  client_id: string;
  transaction_type: string;
  status: string;
  transaction_date: string | null;
  party_name: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  confidence_score: number;
  created_at: string;
  client_business_name: string | null;
  document_type: string | null;
  document_file_name: string | null;
  risk_flags: string[] | null;
  extraction_model: string | null;
};

function extractionSource(model?: string | null) {
  return model === "rule_based_text_v1" ? "Rule-based extraction" : "AI extraction";
}

function formatAge(value: string) {
  const created = new Date(value).getTime();
  const diffHours = Math.max(0, Math.floor((Date.now() - created) / 36e5));

  if (diffHours < 1) {
    return "<1h";
  }

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  return `${Math.floor(diffHours / 24)}d`;
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    document_type?: string;
    from?: string;
    risk?: string;
    q?: string;
    page?: string;
    status?: string;
    to?: string;
  }>;
}) {
  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before reviewing extracted transactions." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const filters = await searchParams;
  const selectedStatus = reviewStatusOptions.includes(filters.status ?? "")
    ? filters.status ?? "all"
    : "all";
  const selectedRisk = reviewRiskOptions.includes(filters.risk ?? "")
    ? filters.risk ?? "all"
    : "all";
  const selectedDocumentType = documentTypeOptions.includes(
    filters.document_type ?? "",
  )
    ? filters.document_type ?? "all"
    : "all";
  const search = normalizeSearch(filters.q);
  const page = normalizePage(filters.page);
  const rangeFrom = (page - 1) * pageSize;
  const clientsPromise = supabase
    .from("clients")
    .select("id, business_name")
    .eq("firm_id", firm.id)
    .neq("status", "archived")
    .order("business_name");
  const query = supabase.rpc("search_review_queue", {
    target_firm_id: firm.id,
    target_client_id: filters.client || null,
    target_status: selectedStatus === "all" ? null : selectedStatus,
    target_risk: selectedRisk === "all" ? null : selectedRisk,
    target_document_type:
      selectedDocumentType === "all" ? null : selectedDocumentType,
    target_from: filters.from || null,
    target_to: filters.to || null,
    target_search: search || null,
    page_limit: pageSize + 1,
    page_offset: rangeFrom,
  });

  const [transactionsResult, clientsResult] = await Promise.all([
    withServerTiming("dashboard.review_queue.query", () => query, {
      page,
      has_client_filter: Boolean(filters.client),
      has_status_filter: selectedStatus !== "all",
      has_date_filter: Boolean(filters.from || filters.to),
      has_search_filter: Boolean(search),
      has_document_filter: selectedDocumentType !== "all",
      has_low_confidence_filter: selectedRisk === "low_confidence",
      filters_applied_before_page: true,
    }),
    withServerTiming("dashboard.review_queue.clients_query", () => clientsPromise, {
      page,
    }),
  ]);
  const { data: transactions, error } = transactionsResult;
  const clients = clientsResult.data ?? [];
  const pageTransactions = ((transactions ?? []) as ReviewQueueRow[]).slice(
    0,
    pageSize,
  );
  const hasNextPage = (transactions?.length ?? 0) > pageSize;
  const returnContext = buildReturnContext(filters, reviewQueueReturnKeys);

  return (
    <div>
      <PageHeader
        eyebrow="Review Queue"
        title="AI extraction review"
        description="Review AI-created draft and needs-review transactions before approval."
      />

      <PageBody>
        {clientsResult.error && <QueryError message="Client filters could not be loaded. Please retry." />}
        <FilterBar action="/dashboard/review-queue">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px_170px] 2xl:grid-cols-[minmax(0,1fr)_190px_160px_160px_150px_150px_auto] 2xl:items-end">
            <div className="grid gap-1.5">
              <label
                htmlFor="review-search"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Search
              </label>
              <Input
                id="review-search"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Client, party, invoice"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="review-client"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Client
              </label>
              <Select
                id="review-client"
                name="client"
                defaultValue={filters.client ?? ""}
              >
                <option value="">All clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.business_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="review-status"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Status
              </label>
              <Select
                id="review-status"
                name="status"
                defaultValue={selectedStatus}
              >
                {reviewStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="review-risk"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Risk
              </label>
              <Select
                id="review-risk"
                name="risk"
                defaultValue={selectedRisk}
              >
                <option value="all">All</option>
                <option value="risk">Risk flags</option>
                <option value="low_confidence">Low confidence</option>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="review-document-type"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                Document
              </label>
              <Select
                id="review-document-type"
                name="document_type"
                defaultValue={selectedDocumentType}
              >
                {documentTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="review-from"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                From
              </label>
              <Input
                id="review-from"
                name="from"
                type="date"
                defaultValue={filters.from ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="review-to"
                className="text-xs font-semibold uppercase tracking-wider text-khata-muted"
              >
                To
              </label>
              <Input
                id="review-to"
                name="to"
                type="date"
                defaultValue={filters.to ?? ""}
              />
            </div>
            <div className="flex flex-wrap gap-2 lg:col-span-4 2xl:col-span-1">
              <Button type="submit" size="sm">
                Apply
              </Button>
              <ActionLink href="/dashboard/review-queue" size="sm">
                Clear
              </ActionLink>
            </div>
          </div>
        </FilterBar>

        <SectionCard
          title="Extracted transactions"
          actions={<RecordCount value={pageTransactions.length} label="shown" />}
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

        {!error &&
          transactions &&
          transactions.length > 0 &&
          pageTransactions.length === 0 && (
            <EmptyState
              title="No review items match these filters"
              message="Adjust search, status, or risk filters to return extracted transactions."
              action={
                <ActionLink href="/dashboard/review-queue">
                  Clear filters
                </ActionLink>
              }
            />
          )}

        {!error && pageTransactions.length > 0 && (
          <>
            <DataTable minWidth={1080} ariaLabel="Review queue transactions">
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Client</th>
                  <th className={tableHeadCellClass}>Party</th>
                  <th className={tableHeadCellClass}>Source</th>
                  <th className={tableHeadCellClass}>Invoice</th>
                  <th className={tableHeadCellClass}>Date</th>
                  <th className={tableHeadCellClass}>Type</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableHeadCellClass}>Risk</th>
                  <th className={tableNumericHeadCellClass}>
                    Confidence
                  </th>
                  <th className={tableNumericHeadCellClass}>Amount</th>
                  <th className={tableNumericHeadCellClass}>Age</th>
                  <th className={tableActionHeadCellClass}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageTransactions.map((transaction) => {
                  const riskCount = transaction.risk_flags?.length ?? 0;

                  return (
                    <tr
                      key={transaction.id}
                      className={tableRowClass}
                    >
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>
                        {transaction.client_business_name ?? "Unknown client"}
                      </td>
                      <td className={tableCellClass}>
                        {transaction.party_name ?? "Not provided"}
                        <p className={`mt-1 ${tableSecondaryTextClass}`}>
                          {extractionSource(transaction.extraction_model)}
                        </p>
                      </td>
                      <td className={tableCellClass}>
                        <p className={`${tableSecondaryTextClass} capitalize`}>
                          {transaction.document_type?.replaceAll("_", " ") ??
                            "Not provided"}
                        </p>
                        <p className={`${tableMonoTextClass} text-khata-muted`}>
                          {transaction.document_file_name ?? "No file"}
                        </p>
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {transaction.invoice_number ?? "Not provided"}
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {formatDisplayDate(transaction.transaction_date)}
                      </td>
                      <td className={`${tableCellClass} capitalize`}>
                        {transaction.transaction_type}
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip tone={statusTone(transaction.status)}>
                          {transaction.status.replaceAll("_", " ")}
                        </StatusChip>
                      </td>
                      <td className={tableCellClass}>
                        {riskCount > 0 ? (
                          <InlineAlert tone="warning">
                            {riskCount} flag{riskCount === 1 ? "" : "s"}
                          </InlineAlert>
                        ) : (
                          <span className={tableSecondaryTextClass}>None</span>
                        )}
                      </td>
                      <td className={tableNumericCellClass}>
                        {Math.round(transaction.confidence_score * 100)}%
                      </td>
                      <td className={tableNumericCellClass}>
                        {formatCurrency(transaction.total_amount)}
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {formatAge(transaction.created_at)}
                      </td>
                      <td className={tableActionCellClass}>
                        <TextLink
                          href={appendReturnContext(
                            `/dashboard/review-queue/${transaction.id}`,
                            returnContext,
                          )}
                          aria-label={`Review ${transaction.invoice_number ?? transaction.party_name ?? "transaction"}`}
                        >
                          Review
                        </TextLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            <PaginationControls
              basePath="/dashboard/review-queue"
              page={page}
              hasNext={hasNextPage}
              searchParams={filters}
              label="review records"
            />
          </>
        )}
        </SectionCard>
      </PageBody>
    </div>
  );
}
