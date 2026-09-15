import { FileDown, Filter, List, SlidersHorizontal } from "lucide-react";

import { StatusChip } from "@/components/status-chip";
import {
  ActionLink,
  Button,
  DataTable,
  EmptyState,
  FilterActions,
  FilterBar,
  FilterField,
  FilterGrid,
  FilterPresetLink,
  InlineAlert,
  Input,
  InputWithIcon,
  PageBody,
  PageHeader,
  PaginationControls,
  QueryError,
  RecordCount,
  SectionCard,
  Select,
  SetupRequired,
  TableToolbar,
  TextLink,
  functionalIconClassName,
  functionalIconStrokeWidth,
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
import { normalizePage, normalizeSearch } from "@/lib/dashboard-query";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { currentMonthDateRange, formatDisplayDate } from "@/lib/format";
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
const fy27Q2DateRange = {
  start: "2026-07-01",
  end: "2026-09-30",
};
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

type ReviewQueueFallbackRow = Omit<
  ReviewQueueRow,
  "client_business_name" | "document_file_name" | "document_type" | "extraction_model" | "risk_flags"
> & {
  clients:
    | { business_name: string | null }
    | Array<{ business_name: string | null }>
    | null;
  documents:
    | { document_type: string | null; file_name: string | null }
    | Array<{ document_type: string | null; file_name: string | null }>
    | null;
  ai_extractions:
    | { risk_flags: string[] | null; model: string | null }
    | Array<{ risk_flags: string[] | null; model: string | null }>
    | null;
};

type ReviewQueueSearchParams = {
  client?: string;
  document_type?: string;
  from?: string;
  risk?: string;
  q?: string;
  page?: string;
  status?: string;
  to?: string;
};

function isMissingRpcError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST202" ||
    /schema cache|search_review_queue/i.test(error?.message ?? "")
  );
}

async function fallbackReviewQueueQuery({
  firmId,
  filters,
  page,
  search,
  selectedDocumentType,
  selectedRisk,
  selectedStatus,
  supabase,
}: {
  firmId: string;
  filters: {
    client?: string;
    from?: string;
    to?: string;
  };
  page: number;
  search: string;
  selectedDocumentType: string;
  selectedRisk: string;
  selectedStatus: string;
  supabase: NonNullable<Awaited<ReturnType<typeof getFirmContext>>>["supabase"];
}) {
  const rangeFrom = (page - 1) * pageSize;
  let fallbackQuery = supabase
    .from("transactions")
    .select(
      [
        "id",
        "client_id",
        "transaction_type",
        "status",
        "transaction_date",
        "party_name",
        "invoice_number",
        "total_amount",
        "confidence_score",
        "created_at",
        "clients!inner(business_name)",
        "documents(document_type, file_name)",
        "ai_extractions(risk_flags, model)",
      ].join(", "),
    )
    .eq("firm_id", firmId)
    .in("status", ["draft", "needs_review", "duplicate"])
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(rangeFrom, rangeFrom + pageSize);

  if (filters.client) {
    fallbackQuery = fallbackQuery.eq("client_id", filters.client);
  }

  if (selectedStatus !== "all") {
    fallbackQuery = fallbackQuery.eq("status", selectedStatus);
  }

  if (filters.from) {
    fallbackQuery = fallbackQuery.gte("transaction_date", filters.from);
  }

  if (filters.to) {
    fallbackQuery = fallbackQuery.lte("transaction_date", filters.to);
  }

  if (selectedDocumentType !== "all") {
    fallbackQuery = fallbackQuery.eq("documents.document_type", selectedDocumentType);
  }

  if (selectedRisk === "low_confidence") {
    fallbackQuery = fallbackQuery.lt("confidence_score", 0.7);
  } else if (selectedRisk === "risk") {
    fallbackQuery = fallbackQuery.not("ai_extractions.risk_flags", "eq", "{}");
  }

  if (search) {
    const escapedSearch = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
    fallbackQuery = fallbackQuery.or(
      `party_name.ilike.%${escapedSearch}%,invoice_number.ilike.%${escapedSearch}%,transaction_type.ilike.%${escapedSearch}%`,
    );
  }

  const result = await fallbackQuery;

  return {
    data:
      ((result.data ?? []) as unknown as ReviewQueueFallbackRow[]).map((transaction) => {
        const client = Array.isArray(transaction.clients)
          ? transaction.clients[0]
          : transaction.clients;
        const document = Array.isArray(transaction.documents)
          ? transaction.documents[0]
          : transaction.documents;
        const extraction = Array.isArray(transaction.ai_extractions)
          ? transaction.ai_extractions[0]
          : transaction.ai_extractions;

        return {
          id: transaction.id,
          client_id: transaction.client_id,
          transaction_type: transaction.transaction_type,
          status: transaction.status,
          transaction_date: transaction.transaction_date,
          party_name: transaction.party_name,
          invoice_number: transaction.invoice_number,
          total_amount: transaction.total_amount,
          confidence_score: transaction.confidence_score,
          created_at: transaction.created_at,
          client_business_name: client?.business_name ?? null,
          document_type: document?.document_type ?? null,
          document_file_name: document?.file_name ?? null,
          risk_flags: extraction?.risk_flags ?? null,
          extraction_model: extraction?.model ?? null,
        };
      }),
    error: result.error,
  };
}

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

const indiaDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Kolkata",
  year: "numeric",
});

function currentIndiaDateOnly(now = new Date()) {
  const parts = Object.fromEntries(
    indiaDatePartsFormatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function reviewQueueHref(
  filters: ReviewQueueSearchParams,
  overrides: Partial<Record<keyof ReviewQueueSearchParams, string | null>> = {},
) {
  const params = new URLSearchParams();
  const keys: Array<keyof ReviewQueueSearchParams> = [
    "q",
    "client",
    "document_type",
    "from",
    "risk",
    "status",
    "to",
  ];

  for (const key of keys) {
    const value = Object.prototype.hasOwnProperty.call(overrides, key)
      ? overrides[key]
      : filters[key];

    if (!value || value === "all") {
      continue;
    }

    params.set(key, value);
  }

  const query = params.toString();
  return query ? `/dashboard/review-queue?${query}` : "/dashboard/review-queue";
}

function datePresetIsActive(
  filters: ReviewQueueSearchParams,
  range: { start: string; end: string },
) {
  return filters.from === range.start && filters.to === range.end;
}

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<ReviewQueueSearchParams>;
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
  const reviewCountQuery = (status?: string) => {
    let countQuery = supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firm.id)
      .in("status", ["draft", "needs_review", "duplicate"]);

    if (status) {
      countQuery = countQuery.eq("status", status);
    }

    return countQuery;
  };
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

  const [
    transactionsResult,
    clientsResult,
    allCountResult,
    needsReviewCountResult,
    duplicateCountResult,
    draftCountResult,
  ] = await Promise.all([
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
    withServerTiming("dashboard.review_queue.count.all", () => reviewCountQuery(), {
      page,
    }),
    withServerTiming(
      "dashboard.review_queue.count.needs_review",
      () => reviewCountQuery("needs_review"),
      { page },
    ),
    withServerTiming(
      "dashboard.review_queue.count.duplicate",
      () => reviewCountQuery("duplicate"),
      { page },
    ),
    withServerTiming(
      "dashboard.review_queue.count.draft",
      () => reviewCountQuery("draft"),
      { page },
    ),
  ]);
  let { data: transactions, error } = transactionsResult;

  if (isMissingRpcError(error)) {
    const fallbackResult = await withServerTiming(
      "dashboard.review_queue.compat_query",
      () =>
        fallbackReviewQueueQuery({
          firmId: firm.id,
          filters,
          page,
          search,
          selectedDocumentType,
          selectedRisk,
          selectedStatus,
          supabase,
        }),
      {
        page,
        has_client_filter: Boolean(filters.client),
        has_status_filter: selectedStatus !== "all",
        has_date_filter: Boolean(filters.from || filters.to),
        has_search_filter: Boolean(search),
        has_document_filter: selectedDocumentType !== "all",
        has_low_confidence_filter: selectedRisk === "low_confidence",
        compatibility_fallback: true,
      },
    );
    transactions = fallbackResult.data;
    error = fallbackResult.error;
  }

  const clients = clientsResult.data ?? [];
  const pageTransactions = ((transactions ?? []) as ReviewQueueRow[]).slice(
    0,
    pageSize,
  );
  const hasNextPage = (transactions?.length ?? 0) > pageSize;
  const returnContext = buildReturnContext(filters, reviewQueueReturnKeys);
  const todayDate = currentIndiaDateOnly();
  const todayRange = {
    start: todayDate,
    end: todayDate,
  };
  const monthRange = currentMonthDateRange();
  const reviewCounts = {
    all: allCountResult.error ? null : allCountResult.count ?? 0,
    needsReview: needsReviewCountResult.error
      ? null
      : needsReviewCountResult.count ?? 0,
    duplicate: duplicateCountResult.error ? null : duplicateCountResult.count ?? 0,
    draft: draftCountResult.error ? null : draftCountResult.count ?? 0,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Review Queue"
        title="AI extraction review"
        description="Review AI-created draft and needs-review transactions before approval."
        actions={
          <ActionLink href="/dashboard/exports" size="md" className="min-w-36">
            <FileDown aria-hidden="true" />
            Open exports
          </ActionLink>
        }
      />

      <PageBody>
        {clientsResult.error && <QueryError message="Client filters could not be loaded. Please retry." />}
        <FilterBar action="/dashboard/review-queue" className="gap-0 overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-khata-border bg-khata-paperMuted/40 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <FilterPresetLink
                href={reviewQueueHref(filters, { risk: null, status: null })}
                active={selectedStatus === "all" && selectedRisk === "all"}
                count={reviewCounts.all}
              >
                All
              </FilterPresetLink>
              <FilterPresetLink
                href={reviewQueueHref(filters, {
                  risk: null,
                  status: "needs_review",
                })}
                active={selectedStatus === "needs_review"}
                count={reviewCounts.needsReview}
                dotTone="warning"
              >
                Needs Review
              </FilterPresetLink>
              <FilterPresetLink
                href={reviewQueueHref(filters, {
                  risk: null,
                  status: "duplicate",
                })}
                active={selectedStatus === "duplicate"}
                count={reviewCounts.duplicate}
                dotTone="danger"
              >
                Duplicate Risk
              </FilterPresetLink>
              <FilterPresetLink
                href={reviewQueueHref(filters, {
                  risk: null,
                  status: "draft",
                })}
                active={selectedStatus === "draft"}
                count={reviewCounts.draft}
                dotTone="brand"
              >
                AI Draft
              </FilterPresetLink>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterPresetLink
                href={reviewQueueHref(filters, {
                  from: todayRange.start,
                  to: todayRange.end,
                })}
                active={datePresetIsActive(filters, todayRange)}
              >
                Today
              </FilterPresetLink>
              <FilterPresetLink
                href={reviewQueueHref(filters, {
                  from: monthRange.start,
                  to: monthRange.end,
                })}
                active={datePresetIsActive(filters, monthRange)}
              >
                This Month
              </FilterPresetLink>
              <FilterPresetLink
                href={reviewQueueHref(filters, {
                  from: fy27Q2DateRange.start,
                  to: fy27Q2DateRange.end,
                })}
                active={datePresetIsActive(filters, fy27Q2DateRange)}
              >
                Q2 FY27
              </FilterPresetLink>
              <ActionLink
                href="/dashboard/review-queue"
                size="md"
                variant="ghost"
                className="rounded-full px-3 text-khata-muted"
              >
                Reset all
              </ActionLink>
            </div>
          </div>

          <div className="grid gap-4 p-4">
            {selectedStatus !== "all" && (
              <input type="hidden" name="status" value={selectedStatus} />
            )}
            <FilterField label="Search" htmlFor="review-search">
              <InputWithIcon
                id="review-search"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Search client, party, invoice, file, or type"
              />
            </FilterField>

            <FilterGrid className="md:grid-cols-2 xl:grid-cols-[220px_220px_200px_160px_160px_auto]">
              <FilterField label="Client" htmlFor="review-client">
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
              </FilterField>

              <FilterField label="Document" htmlFor="review-document-type">
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
              </FilterField>
              <FilterField label="Risk" htmlFor="review-risk">
                <Select
                  id="review-risk"
                  name="risk"
                  defaultValue={selectedRisk}
                >
                  <option value="all">All</option>
                  <option value="risk">Risk flags</option>
                  <option value="low_confidence">Low confidence</option>
                </Select>
              </FilterField>
              <FilterField label="From" htmlFor="review-from">
                <Input
                  id="review-from"
                  name="from"
                  type="date"
                  defaultValue={filters.from ?? ""}
                />
              </FilterField>
              <FilterField label="To" htmlFor="review-to">
                <Input
                  id="review-to"
                  name="to"
                  type="date"
                  defaultValue={filters.to ?? ""}
                />
              </FilterField>

              <FilterActions className="xl:justify-end">
                <Button type="submit" size="md" className="min-w-24">
                  <Filter aria-hidden="true" />
                  Apply
                </Button>
                <ActionLink href="/dashboard/review-queue" size="md" className="min-w-20">
                  Clear
                </ActionLink>
              </FilterActions>
            </FilterGrid>
          </div>
        </FilterBar>

        <SectionCard
          bodyClassName="p-0"
        >
        <TableToolbar
          title="Extracted transactions"
          meta={<RecordCount value={pageTransactions.length} label="shown" />}
          actions={
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-khata-muted">
              <span className="inline-flex items-center gap-1.5">
                <List
                  className={functionalIconClassName}
                  strokeWidth={functionalIconStrokeWidth}
                  aria-hidden="true"
                />
                Compact rows
              </span>
              <span className="size-1 rounded-full bg-khata-border" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal
                  className={functionalIconClassName}
                  strokeWidth={functionalIconStrokeWidth}
                  aria-hidden="true"
                />
                Fixed columns
              </span>
            </div>
          }
        />

        {error && (
          <QueryError message="Review queue records could not be loaded. Please retry." />
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
                        <p className={`${tableNumericTextClass} text-khata-muted`}>
                          {transaction.document_file_name ?? "No file"}
                        </p>
                      </td>
                      <td className={`${tableCellClass} ${tableNumericTextClass}`}>
                        {transaction.invoice_number ?? "Not provided"}
                      </td>
                      <td className={`${tableCellClass} ${tableNumericTextClass}`}>
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
