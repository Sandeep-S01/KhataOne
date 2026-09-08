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
  SectionCard,
  SetupRequired,
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

export default async function EditLedgerEntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;

  if (!hasSupabaseConfig()) {
    return (
      <SetupRequired message="Connect Supabase environment variables and migrations before correcting ledger entries." />
    );
  }

  const firm = await getActiveFirm();
  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("id", entryId)
    .eq("firm_id", firm!.id)
    .single();

  if (!entry) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Ledger correction"
        title="Correct handoff entry"
        description="Corrections update the ledger handoff entry only. The source transaction and AI extraction history remain traceable."
        actions={
          <ActionLink href={`/dashboard/ledger/${entry.id}`}>
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
              { label: "Date", value: entry.entry_date ?? "Pending", mono: true },
              { label: "Account", value: entry.account_name },
              { label: "Debit", value: formatCurrency(entry.debit_amount), mono: true },
              { label: "Credit", value: formatCurrency(entry.credit_amount), mono: true },
              { label: "Narration", value: entry.narration ?? "No narration" },
            ]}
          />
        </SectionCard>
        <LedgerEntryForm entry={entry as LedgerEntryValues} />
      </PageBody>
    </div>
  );
}
