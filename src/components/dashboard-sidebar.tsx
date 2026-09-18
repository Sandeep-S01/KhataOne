"use client";

import { useEffect, useSyncExternalStore } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav, DashboardUtilityNav } from "@/components/dashboard-nav";
import { FirmSwitcher } from "@/components/firm-switcher";
import {
  functionalIconClassName,
  functionalIconStrokeWidth,
} from "@/components/design-system";
import { cn } from "@/lib/utils";
import type { ActiveFirm } from "@/lib/firms";

const SIDEBAR_STORAGE_KEY = "khataone_sidebar_collapsed";
const SIDEBAR_STORAGE_EVENT = "khataone-sidebar-collapsed-change";

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribeToSidebarCollapsed(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SIDEBAR_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SIDEBAR_STORAGE_EVENT, onStoreChange);
  };
}

function getServerSidebarCollapsed() {
  return false;
}

function writeSidebarCollapsed(value: boolean) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
  } catch {
    // Keep the control usable when storage is unavailable.
  }

  window.dispatchEvent(new Event(SIDEBAR_STORAGE_EVENT));
}

export type DashboardSidebarCounts = {
  inbox: number | null;
  reviewQueue: number | null;
};

export function DashboardSidebar({
  activeFirm,
  availableFirms,
  counts,
}: {
  activeFirm: ActiveFirm;
  availableFirms: ActiveFirm[];
  counts?: DashboardSidebarCounts | Promise<DashboardSidebarCounts>;
}) {
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebarCollapsed,
    readSidebarCollapsed,
    getServerSidebarCollapsed,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        writeSidebarCollapsed(!readSidebarCollapsed());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    writeSidebarCollapsed(!isCollapsed);
  };

  const firmName = activeFirm.name ?? "Firm Workspace";
  const firmInitial = firmName.trim().charAt(0).toUpperCase() || "F";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 select-none overflow-hidden border-r border-khata-border bg-white shadow-sm transition-[width] duration-200 ease-in-out lg:flex lg:flex-col",
        isCollapsed ? "w-16" : "w-[240px]",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-khata-border/80",
          isCollapsed
            ? "h-24 flex-col justify-center gap-2 px-2"
            : "h-14 justify-between px-4",
        )}
      >
        {isCollapsed ? (
          <Link
            href="/dashboard"
            prefetch={process.env.NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT === "1" ? false : undefined}
            className="flex size-10 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            aria-label="KhataOne dashboard"
          >
            <BrandLogo compact />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            prefetch={process.env.NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT === "1" ? false : undefined}
            className="flex h-10 min-w-0 flex-1 items-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            aria-label="KhataOne dashboard"
          >
            <BrandLogo />
          </Link>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green",
            isCollapsed && "mx-auto",
          )}
        >
          {isCollapsed ? (
            <PanelLeft
              className={functionalIconClassName}
              strokeWidth={functionalIconStrokeWidth}
              aria-hidden="true"
            />
          ) : (
            <PanelLeftClose
              className={functionalIconClassName}
              strokeWidth={functionalIconStrokeWidth}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      <div className="border-b border-khata-border p-2.5">
        {!isCollapsed ? (
          <FirmSwitcher activeFirm={activeFirm} availableFirms={availableFirms} />
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="mx-auto flex size-9 items-center justify-center rounded-full bg-khata-ink text-sm font-bold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            aria-label={`Expand sidebar to switch firm. Current firm: ${firmName}`}
            title={`${firmName} — expand to switch firm`}
          >
            {firmInitial}
          </button>
        )}
      </div>

      <DashboardNav collapsed={isCollapsed} counts={counts} />
      <DashboardUtilityNav collapsed={isCollapsed} />
    </aside>
  );
}
