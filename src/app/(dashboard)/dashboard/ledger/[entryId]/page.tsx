import { notFound } from "next/navigation";

import {
  ActionLink,
  DataTable,
  DetailList,
  EmptyState,
  PageBody,
  PageHeader,
  SectionCard,
  SetupRequired,
  TextLink,
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

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default async function LedgerEntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before viewing ledger entry details." />
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("ledger_entries")
    .select(
      "*, clients(business_name), transactions(id, invoice_number, party_name, transaction_type, status, total_amount)",
    )
    .eq("id", entryId)
    .eq("firm_id", firm!.id)
    .single();

  if (!entry) {
    notFound();
  }

  const client = Array.isArray(entry.clients) ? entry.clients[0] : entry.clients;
  const transaction = Array.isArray(entry.transactions)
    ? entry.transactions[0]
    : entry.transactions;
  const { data: audits } = await supabase
    .from("audit_logs")
    .select("id, action, actor_user_id, metadata, created_at")
    .eq("firm_id", firm!.id)
    .eq("entity_type", "ledger_entry")
    .eq("entity_id", entry.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <PageHeader
        eyebrow="Ledger"
        title="Ledger entry"
        description="Inspect the approved handoff and its correction history."
        actions={
          <>
          <ActionLink
            href="/dashboard/ledger"
          >
            Back to ledger
          </ActionLink>
        <ActionLink
          href={`/dashboard/ledger/${entry.id}/edit`}
          variant="primary"
        >
          Correct entry
        </ActionLink>
          </>
        }
      />

      <PageBody className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Entry details">
          <DetailList
            items={[
              { label: "Client", value: client?.business_name ?? "Unknown client" },
              { label: "Date", value: entry.entry_date ?? "Pending", mono: true },
              { label: "Account", value: entry.account_name },
              { label: "Debit", value: formatCurrency(entry.debit_amount), mono: true },
              { label: "Credit", value: formatCurrency(entry.credit_amount), mono: true },
              { label: "Narration", value: entry.narration ?? "No narration" },
            ]}
          />
        </SectionCard>

        <SectionCard title="Source transaction">
          <DetailList
            items={[
              { label: "Invoice", value: transaction?.invoice_number ?? "Pending", mono: true },
              { label: "Party", value: transaction?.party_name ?? "Pending" },
              { label: "Type", value: transaction?.transaction_type ?? "Unknown" },
              { label: "Status", value: transaction?.status ?? "Unknown" },
              { label: "Amount", value: formatCurrency(transaction?.total_amount ?? null), mono: true },
            ]}
          />
          {transaction?.id && (
            <TextLink
              href={`/dashboard/review-queue/${transaction.id}`}
              className="mt-5"
            >
              Open review source
            </TextLink>
          )}
        </SectionCard>

      <div className="xl:col-span-2">
      <SectionCard title="Correction audit" bodyClassName="p-0">
        {!audits || audits.length === 0 ? (
          <EmptyState
            title="No corrections recorded"
            message="Correction notes and ledger-entry audit activity will appear here."
          />
        ) : (
          <DataTable minWidth={720}>
              <thead className={tableHeaderClass}>
                <tr>
                  <th className={tableHeadCellClass}>Action</th>
                  <th className={tableHeadCellClass}>Actor</th>
                  <th className={tableHeadCellClass}>Note</th>
                  <th className={tableNumericHeadCellClass}>Time</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => {
                  const metadata =
                    audit.metadata &&
                    typeof audit.metadata === "object" &&
                    "correction_note" in audit.metadata
                      ? audit.metadata
                      : null;

                  return (
                    <tr key={audit.id} className={tableRowClass}>
                      <td className={`${tableCellClass} ${tablePrimaryTextClass}`}>{audit.action}</td>
                      <td className={`${tableCellClass} ${tableMonoTextClass}`}>
                        {audit.actor_user_id ?? "system"}
                      </td>
                      <td className={`${tableCellClass} ${tableSecondaryTextClass}`}>
                        {metadata?.correction_note || "No note"}
                      </td>
                      <td className={`${tableNumericCellClass} text-xs`}>
                        {new Date(audit.created_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </DataTable>
        )}
      </SectionCard>
      </div>
      </PageBody>
    </div>
  );
}
