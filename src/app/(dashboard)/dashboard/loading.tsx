import {
  PageBody,
  PageHeader,
  SectionCard,
  TableSkeleton,
} from "@/components/design-system";

function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-4 animate-pulse rounded bg-khata-paperMuted ${className}`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <PageHeader
        eyebrow="Loading"
        title="Preparing workspace"
        description="Fetching the latest firm records."
      />

      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="k-card p-4">
              <Bar className="w-24" />
              <Bar className="mt-4 h-7 w-16" />
              <Bar className="mt-3 w-40 max-w-full" />
            </div>
          ))}
        </div>

        <SectionCard title="Loading records" bodyClassName="p-0">
          <TableSkeleton rows={6} cols={6} />
        </SectionCard>
      </PageBody>
    </div>
  );
}
