import type { Metadata } from "next";

import { SupportRequestForm } from "@/components/support-request-form";
import { EmptyState, FormMessage, PageBody, PageHeader, SectionCard, SetupRequired } from "@/components/design-system";
import { StatusChip } from "@/components/status-chip";
import { hasSupabaseConfig } from "@/lib/env";
import { getFirmContext } from "@/lib/firms";
import { formatDisplayDateTime } from "@/lib/format";
import { supportCategoryLabel } from "@/lib/support-requests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Help | KhataOne",
  description: "Report and track issues with your KhataOne workspace.",
};

export default async function HelpPage() {
  if (!hasSupabaseConfig()) {
    return <SetupRequired message="Help requests are temporarily unavailable. Please try again later." />;
  }

  const context = await getFirmContext();
  if (!context) return null;

  const { data: requests, error } = await context.supabase
    .from("support_requests")
    .select("id, category, subject, status, created_at")
    .eq("firm_id", context.firm.id)
    .eq("created_by", context.userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <PageHeader
        eyebrow="Help"
        title="Get help with KhataOne"
        description="Report an issue with your firm workspace and track the requests you submitted."
      />
      <PageBody>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <SectionCard title="Raise a support request" description="Choose the area affected and describe the issue clearly.">
            <SupportRequestForm />
          </SectionCard>

          <SectionCard title="Your recent requests" description="Only requests you submitted are shown here.">
            {error ? (
              <FormMessage message="Requests could not be loaded. Refresh this page to try again." />
            ) : !requests?.length ? (
              <EmptyState title="No requests yet" message="When you report an issue, its status will appear here." />
            ) : (
              <ul className="divide-y divide-khata-border">
                {requests.map((request) => (
                  <li key={request.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 break-words text-sm font-semibold text-khata-ink">{request.subject}</p>
                      <StatusChip tone={request.status === "resolved" || request.status === "closed" ? "success" : request.status === "in_progress" ? "info" : "warning"}>
                        {request.status.replaceAll("_", " ")}
                      </StatusChip>
                    </div>
                    <p className="mt-1 text-xs text-khata-muted">
                      {supportCategoryLabel(request.category)} · {formatDisplayDateTime(request.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
        <p className="text-xs leading-5 text-khata-muted">
          Your requests are saved here. Replies are not available through this page yet.
        </p>
      </PageBody>
    </div>
  );
}
