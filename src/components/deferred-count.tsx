import { Suspense } from "react";

async function CountValue({ value }: { value: Promise<number | null> }) {
  const count = await value;
  return count === null ? <span aria-label="Count unavailable">n/a</span> : <>{count}</>;
}

// Keep the link/control usable while its optional server count is loading.
export function DeferredCount({ value }: { value: Promise<number | null> }) {
  return (
    <Suspense fallback={<span aria-label="Count loading">…</span>}>
      <CountValue value={value} />
    </Suspense>
  );
}
