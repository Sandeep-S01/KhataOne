import { notFound } from "next/navigation";

import {
  LedgerEntryForm,
  type LedgerEntryValues,
} from "@/components/ledger-entry-form";
import {
  ActionLink,
  DetailList,
  PageBody,
  PageHeader,
  PermissionNotice,
  SectionCard,
  SetupRequired,
} from "@/components/design-system";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { formatDisplayDate } from "@/lib/format";
import { canCorrectLedgerEntries, readOnlyRoleMessage } from "@/lib/permissions";
import {
  appendReturnContext,
  ledgerReturnKeys,
  sanitizeReturnContext,
} from "@/lib/return-context";

export const dynamic = "force-dynamic";

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default async function EditLedgerEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ entryId: string }>;
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { entryId } = await params;
  const { return_to: rawReturnContext } = await searchParams;
  const returnContext = sanitizeReturnContext(rawReturnContext, ledgerReturnKeys);

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before correcting ledger entries." />
    );
  }

  const context = await getFirmContext();

  if (!context) {
    return null;
  }

  const { firm, supabase } = context;
  const { data: entry } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("id", entryId)
    .eq("firm_id", firm.id)
    .single();

  if (!entry) {
    notFound();
  }

  const canCorrectEntry = canCorrectLedgerEntries(firm.role);

  return (
    <div>
      <PageHeader
        eyebrow="Ledger correction"
        title="Correct handoff entry"
        description="Corrections update the ledger handoff entry only. The source transaction and AI extraction history remain traceable."
        actions={
          <ActionLink
            href={appendReturnContext(
              `/dashboard/ledger/${entry.id}`,
              returnContext,
            )}
          >
            Back to ledger entry
          </ActionLink>
        }
      />
      <PageBody className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr] xl:items-start">
        <SectionCard
          title="Current handoff values"
          description="Use these values as the before-state while entering the correction note."
        >
          <DetailList
            items={[
              { label: "Date", value: formatDisplayDate(entry.entry_date), mono: true },
              { label: "Account", value: entry.account_name },
              { label: "Debit", value: formatCurrency(entry.debit_amount), mono: true },
              { label: "Credit", value: formatCurrency(entry.credit_amount), mono: true },
              { label: "Narration", value: entry.narration ?? "No narration" },
            ]}
          />
        </SectionCard>
        {canCorrectEntry ? (
          <LedgerEntryForm
            entry={entry as LedgerEntryValues}
            returnContext={returnContext}
          />
        ) : (
          <SectionCard title="Read-only access">
            <PermissionNotice message={readOnlyRoleMessage} />
          </SectionCard>
        )}
      </PageBody>
    </div>
  );
}
