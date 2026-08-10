import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LedgerEntryForm,
  type LedgerEntryValues,
} from "@/components/ledger-entry-form";
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
      <div className="p-5">
        <section className="rounded-lg border border-khata-border bg-white p-5 shadow-ledger">
          <h1 className="text-2xl font-semibold">Supabase setup required</h1>
          <p className="mt-3 text-sm leading-6 text-khata-muted">
            Ledger correction needs Supabase environment variables and
            migrations.
          </p>
        </section>
      </div>
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
    <div className="p-5">
      <div className="mb-5">
        <Link
          href={`/dashboard/ledger/${entry.id}`}
          className="text-sm font-semibold text-khata-green"
        >
          Back to ledger entry
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase text-khata-green">
          Ledger correction
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Correct handoff entry</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-khata-muted">
          Corrections update the ledger handoff entry only. The source
          transaction and AI extraction history remain traceable.
        </p>
      </div>
      <LedgerEntryForm entry={entry as LedgerEntryValues} />
    </div>
  );
}
