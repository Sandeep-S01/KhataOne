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
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";

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

function extractionSource(model?: string | null) {
  return model === "rule_based_text_v1" ? "Rule-based extraction" : "AI extraction";
}

function normalizeSearch(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Date(value).toLocaleDateString("en-IN");
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
  const rangeTo = rangeFrom + pageSize;
  const clientsPromise = supabase
    .from("clients")
    .select("id, business_name")
    .eq("firm_id", firm.id)
    .neq("status", "archived")
    .order("business_name");
  let query = supabase
    .from("transactions")
    .select(
      "id, client_id, transaction_type, status, transaction_date, party_name, invoice_number, total_amount, confidence_score, created_at, clients(business_name), documents(document_type, file_name), ai_extractions(risk_flags, model)",
    )
    .eq("firm_id", firm.id)
    .in("status", ["draft", "needs_review", "duplicate"])
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (filters.client) {
    query = query.eq("client_id", filters.client);
  }

  if (selectedStatus !== "all") {
    query = query.eq("status", selectedStatus);
  }

  if (filters.from) {
    query = query.gte("transaction_date", filters.from);
  }

  if (filters.to) {
    query = query.lte("transaction_date", filters.to);
  }

  const [transactionsResult, clientsResult] = await Promise.all([
    query,
    clientsPromise,
  ]);
  const { data: transactions, error } = transactionsResult;
  const clients = clientsResult.data ?? [];
  const pageTransactions = (transactions ?? []).slice(0, pageSize);
  const hasNextPage = (transactions?.length ?? 0) > pageSize;
  const filteredTransactions = pageTransactions.filter((transaction) => {
    const client = Array.isArray(transaction.clients)
      ? transaction.clients[0]
      : transaction.clients;
    const document = Array.isArray(transaction.documents)
      ? transaction.documents[0]
      : transaction.documents;
    const extraction = Array.isArray(transaction.ai_extractions)
      ? transaction.ai_extractions[0]
      : transaction.ai_extractions;
    const riskCount = extraction?.risk_flags?.length ?? 0;
    const matchesRisk =
      selectedRisk === "all" ||
      (selectedRisk === "risk" && riskCount > 0) ||
      (selectedRisk === "low_confidence" &&
        Number(transaction.confidence_score ?? 0) < 0.7);
    const matchesDocumentType =
      selectedDocumentType === "all" ||
      document?.document_type === selectedDocumentType;
    const matchesSearch =
      !search ||
      [
        client?.business_name,
        document?.file_name,
        document?.document_type,
        transaction.party_name,
        transaction.invoice_number,
        transaction.transaction_type,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search));

    return matchesRisk && matchesDocumentType && matchesSearch;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Review Queue"
        title="AI extraction review"
        description="AI-created transactions stay draft or needs-review until a CA approves them in the next workflow phase."
      />

      <PageBody>
        <FilterBar action="/dashboard/review-queue">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px_170px] xl:grid-cols-[minmax(0,1fr)_190px_160px_160px_150px_150px_auto] xl:items-end">
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
            <div className="flex flex-wrap gap-2">
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
          actions={<RecordCount value={filteredTransactions.length} label="shown" />}
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
          filteredTransactions.length === 0 && (
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

        {!error && filteredTransactions.length > 0 && (
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
                {filteredTransactions.map((transaction) => {
                  const client = Array.isArray(transaction.clients)
                    ? transaction.clients[0]
                    : transaction.clients;
                  const extraction = Array.isArray(transaction.ai_extractions)
                    ? transaction.ai_extractions[0]
                    : transaction.ai_extractions;
                  const document = Array.isArray(transaction.documents)
                    ? transaction.documents[0]
                    : transaction.documents;
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
                        <p className={`mt-1 ${tableSecondaryTextClass}`}>
                          {extractionSource(extraction?.model)}
                        </p>
                      </td>
                      <td className={tableCellClass}>
                        <p className={`${tableSecondaryTextClass} capitalize`}>
                          {document?.document_type?.replaceAll("_", " ") ??
                            "Unknown"}
                        </p>
                        <p className={`${tableMonoTextClass} text-khata-muted`}>
                          {document?.file_name ?? "No file"}
                        </p>
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {transaction.invoice_number ?? "Pending"}
                      </td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {formatDate(transaction.transaction_date)}
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
