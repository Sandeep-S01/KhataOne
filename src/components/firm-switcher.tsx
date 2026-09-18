"use client";

import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { switchFirm } from "@/app/actions/firms";
import {
  functionalIconClassName,
  functionalIconStrokeWidth,
} from "@/components/design-system";
import type { ActiveFirm } from "@/lib/firms";

function FirmOption({ firm, isActive }: { firm: ActiveFirm; isActive: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="firm_id"
      value={firm.id}
      disabled={isActive || pending}
      aria-current={isActive ? "true" : undefined}
      className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-khata-ink transition-colors hover:bg-khata-paperMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-khata-green disabled:cursor-default disabled:bg-khata-paperMuted/60"
    >
      <span className="min-w-0 flex-1 truncate">{firm.name ?? "Firm Workspace"}</span>
      <span className="shrink-0 text-xs capitalize text-khata-muted">
        {pending ? "Switching…" : firm.role.replaceAll("_", " ")}
      </span>
      {pending ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-khata-green" aria-hidden="true" />
      ) : isActive ? (
        <Check className="size-4 shrink-0 text-khata-green" aria-hidden="true" />
      ) : null}
    </button>
  );
}

export function FirmSwitcher({
  activeFirm,
  availableFirms,
}: {
  activeFirm: ActiveFirm;
  availableFirms: ActiveFirm[];
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const firmName = activeFirm.name ?? "Firm Workspace";
  const firmInitial = firmName.trim().charAt(0).toUpperCase() || "F";

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (detailsRef.current?.open && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && detailsRef.current?.open) {
        event.preventDefault();
        detailsRef.current.open = false;
        detailsRef.current.querySelector<HTMLElement>("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        className="flex min-h-14 cursor-pointer list-none items-center gap-2.5 rounded-xl border border-warning/25 bg-warning/10 p-2 transition-colors hover:bg-warning/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green [&::-webkit-details-marker]:hidden"
        aria-label={`Switch firm workspace. Current firm: ${firmName}`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-khata-ink text-sm font-bold text-white shadow-sm">
          {firmInitial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold leading-tight text-khata-ink">
            {firmName}
          </span>
          <span className="mt-0.5 block truncate text-xs capitalize text-khata-muted">
            {activeFirm.role.replaceAll("_", " ")}
          </span>
        </span>
        <ChevronsUpDown
          className={`${functionalIconClassName} shrink-0 text-khata-muted`}
          strokeWidth={functionalIconStrokeWidth}
          aria-hidden="true"
        />
      </summary>

      <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-khata-border bg-white p-1 shadow-lg">
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-khata-muted">
          Your firms
        </p>
        {availableFirms.map((firm) => (
          <form action={switchFirm} key={firm.id}>
            <FirmOption firm={firm} isActive={firm.id === activeFirm.id} />
          </form>
        ))}
        {availableFirms.length === 1 ? (
          <p className="px-2 py-2 text-xs text-khata-muted">No other firms available.</p>
        ) : null}
      </div>
    </details>
  );
}
