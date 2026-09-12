"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ChevronRight, PanelLeft, PanelLeftClose } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav } from "@/components/dashboard-nav";
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
        "sticky top-0 hidden h-screen shrink-0 border-r border-khata-border bg-white transition-[width] duration-200 ease-in-out lg:flex lg:flex-col select-none",
        isCollapsed ? "w-[68px]" : "w-64",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-khata-border px-3.5">
        {!isCollapsed ? (
          <Link
            href="/dashboard"
            prefetch={process.env.NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT === "1" ? false : undefined}
            className="min-w-0 flex-1 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            aria-label="KhataOne dashboard"
          >
            <BrandLogo />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            prefetch={process.env.NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT === "1" ? false : undefined}
            className="mx-auto flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            title="KhataOne Home"
            aria-label="KhataOne dashboard"
          >
            <Image
              src="/khataone-mark-light-transparent.png"
              alt="KhataOne mark"
              width={32}
              height={32}
              className="size-7 object-contain drop-shadow-sm"
            />
          </Link>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green",
            isCollapsed && "mx-auto mt-2 hidden",
          )}
        >
          {isCollapsed ? (
            <PanelLeft className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="border-b border-khata-border p-2.5">
        {!isCollapsed ? (
          <div
            className="group flex items-center justify-between rounded-xl border border-khata-border bg-khata-paper p-2 transition-all hover:bg-khata-paperMuted cursor-default"
            title={`${firmName} (${roleLabel})`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-khata-ink text-xs font-bold text-white shadow-sm">
                {firmInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-khata-ink leading-tight">
                  {firmName}
                </p>
                <p className="mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium capitalize bg-khata-green/10 text-khata-green">
                  {roleLabel}
                </p>
              </div>
            </div>
            <ChevronRight className="size-3.5 shrink-0 text-khata-muted opacity-60" aria-hidden="true" />
          </div>
        ) : (
          <div
            className="flex size-9 mx-auto items-center justify-center rounded-xl bg-khata-ink text-xs font-bold text-white shadow-sm cursor-default"
            title={`${firmName} (${roleLabel})`}
          >
            {firmInitial}
          </div>
        )}
      </div>

      <DashboardNav collapsed={isCollapsed} />

      {isCollapsed && (
        <div className="border-t border-khata-border p-2">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Expand sidebar (Ctrl+B)"
            title="Expand sidebar (Ctrl+B)"
            className="flex size-9 mx-auto items-center justify-center rounded-lg text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
          >
            <PanelLeft className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
}
