"use client";

import { useEffect, useSyncExternalStore } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav, DashboardUtilityNav } from "@/components/dashboard-nav";
import { cn } from "@/lib/utils";

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

export function DashboardSidebar({
  firmName,
  roleLabel,
}: {
  firmName: string;
  roleLabel: string;
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

  const firmInitial = firmName.trim().charAt(0).toUpperCase() || "F";

  return (
    <aside
      className={cn(
        "sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 select-none overflow-hidden rounded-[1.375rem] border border-khata-border/80 bg-white shadow-lg transition-[width] duration-200 ease-in-out lg:flex lg:flex-col",
        isCollapsed ? "w-[76px]" : "w-[280px]",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-khata-border/80",
          isCollapsed
            ? "h-[116px] flex-col justify-center gap-2 px-3"
            : "h-[76px] justify-between px-5",
        )}
      >
        {isCollapsed ? (
          <Link
            href="/dashboard"
            prefetch={process.env.NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT === "1" ? false : undefined}
            className="flex size-11 items-center justify-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            aria-label="KhataOne dashboard"
          >
            <BrandLogo compact />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            prefetch={process.env.NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT === "1" ? false : undefined}
            className="min-w-0 flex-1 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
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
            "flex size-9 shrink-0 items-center justify-center rounded-xl text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green",
            isCollapsed && "mx-auto",
          )}
        >
          {isCollapsed ? (
            <PanelLeft className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="border-b border-khata-border/80 p-3">
        {!isCollapsed ? (
          <div
            className="flex cursor-default items-center gap-3 rounded-xl border border-khata-saffron/20 bg-khata-saffron/20 p-2.5"
            title={`${firmName} (${roleLabel})`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-khata-ink text-xs font-bold text-white shadow-sm">
                {firmInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight text-khata-ink">
                  {firmName}
                </p>
                <p className="mt-0.5 truncate text-xs capitalize text-khata-muted">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="mx-auto flex size-11 cursor-default items-center justify-center rounded-xl bg-khata-ink text-xs font-bold text-white shadow-sm"
            title={`${firmName} (${roleLabel})`}
          >
            {firmInitial}
          </div>
        )}
      </div>

      <DashboardNav collapsed={isCollapsed} />
      <DashboardUtilityNav collapsed={isCollapsed} />
    </aside>
  );
}
