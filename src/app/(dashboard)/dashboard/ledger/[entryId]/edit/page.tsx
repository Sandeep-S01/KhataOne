import { notFound } from "next/navigation";

import {
  LedgerEntryForm,
  type LedgerEntryValues,
} from "@/components/ledger-entry-form";
import {
  ActionLink,
  PageBody,
  PageHeader,
  SetupRequired,
} from "@/components/design-system";
import { hasSupabaseConfig } from "@/lib/env";
import { getActiveFirm } from "@/lib/firms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
      <PageBody>
        <LedgerEntryForm entry={entry as LedgerEntryValues} />
      </PageBody>
    </div>
  );
}
