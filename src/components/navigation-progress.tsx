"use client";

import { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";

// Render outside drawers and overflow containers so feedback remains visible
// when mobile navigation or the search dialog closes during a transition.
export function NavigationProgress({
  pending,
  label = "Loading page…",
}: {
  pending: boolean;
  label?: string;
}) {
  if (!pending) return null;

  return createPortal(
    <div role="status" className="pointer-events-none fixed inset-x-0 top-0 z-[100]">
      <div className="h-1 bg-khata-green motion-safe:animate-pulse" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>,
    document.body,
  );
}

export function LinkNavigationProgress() {
  const { pending } = useLinkStatus();
  return <NavigationProgress pending={pending} />;
}
