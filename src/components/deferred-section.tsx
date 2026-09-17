import { Suspense, type ReactNode } from "react";

import { QueryError, SectionCard, TableSkeleton } from "@/components/design-system";

type DeferredSectionProps<T> = {
  title: string;
  load: () => PromiseLike<T>;
  children: (result: T) => ReactNode;
  errorMessage: string;
  fallback?: ReactNode;
};

async function ResolvedSection<T>({ load, children, title, errorMessage }: DeferredSectionProps<T>) {
  let result: T;
  try {
    result = await load();
  } catch {
    return <SectionCard title={title}><QueryError message={errorMessage} /></SectionCard>;
  }
  return children(result);
}

// Invoke secondary reads only after the page verifies its primary record.
// Keep failures/loading local to the affected section.
export function DeferredSection<T>(props: DeferredSectionProps<T>) {
  return (
    <Suspense fallback={props.fallback ?? (
      <SectionCard title={props.title} bodyClassName="p-0">
        <div aria-busy="true" aria-label={`Loading ${props.title.toLowerCase()}`}>
          <TableSkeleton rows={3} cols={3} />
        </div>
      </SectionCard>
    )}>
      <ResolvedSection {...props} />
    </Suspense>
  );
}
