"use client";

import { Bell, Inbox, ListChecks, Search, Settings, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";

const searchTargets: Array<{ label: string; href: Route; helper: string }> = [
  {
    label: "Review queue",
    href: "/dashboard/review-queue",
    helper: "Transactions, parties, invoices",
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    helper: "Client names, GSTINs, status",
  },
  {
    label: "WhatsApp inbox",
    href: "/dashboard/inbox",
    helper: "Senders and message types",
  },
];

const activityLinks: Array<{
  label: string;
  href: Route;
  description: string;
  icon: LucideIcon;
}> = [
  {
    label: "Review queue",
    href: "/dashboard/review-queue",
    description: "Check draft and needs-review transactions.",
    icon: ListChecks,
  },
  {
    label: "WhatsApp inbox",
    href: "/dashboard/inbox",
    description: "Triage unmatched or failed intake records.",
    icon: Inbox,
  },
  {
    label: "Operations",
    href: "/dashboard/operations",
    description: "Review processing health and job status.",
    icon: Settings,
  },
];

function buildSearchHref(href: Route, query: string) {
  const trimmed = query.trim();

  if (!trimmed) {
    return href;
  }

  return `${href}?q=${encodeURIComponent(trimmed)}` as Route;
}

export function DashboardTopbarActions({
  userEmail,
  roleLabel,
  profileInitial,
}: {
  userEmail: string;
  roleLabel: string;
  profileInitial: string;
}) {
  const router = useRouter();
  const searchDialogId = useId();
  const activityPanelId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [targetHref, setTargetHref] = useState<Route>("/dashboard/review-queue");

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setActivityOpen(false);
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setActivityOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!activityOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        activityRef.current &&
        event.target instanceof Node &&
        !activityRef.current.contains(event.target)
      ) {
        setActivityOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activityOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchOpen(false);
    router.push(buildSearchHref(targetHref, query));
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={() => {
            setSearchOpen(true);
            setActivityOpen(false);
          }}
          className="inline-flex size-9 items-center justify-center rounded-md text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
          aria-label="Search workspace"
          aria-haspopup="dialog"
          aria-controls={searchDialogId}
          title="Search workspace"
        >
          <Search className="size-5 stroke-[1.8]" aria-hidden="true" />
        </button>

        <div ref={activityRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setActivityOpen((value) => !value);
              setSearchOpen(false);
            }}
            className="relative inline-flex size-9 items-center justify-center rounded-md text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            aria-label="Open activity center"
            aria-haspopup="menu"
            aria-expanded={activityOpen}
            aria-controls={activityPanelId}
            title="Activity center"
          >
            <Bell className="size-5 stroke-[1.8]" aria-hidden="true" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-khata-green ring-2 ring-white" aria-hidden="true" />
          </button>

          {activityOpen && (
            <div
              id={activityPanelId}
              role="menu"
              aria-label="Activity center"
              className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-khata-border bg-white shadow-lg"
            >
              <div className="border-b border-khata-border bg-khata-paperMuted/50 px-4 py-3">
                <p className="text-sm font-semibold text-khata-ink">Activity center</p>
                <p className="mt-0.5 text-xs text-khata-muted">
                  Jump to queues that may need attention.
                </p>
              </div>
              <div className="p-2">
                {activityLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setActivityOpen(false)}
                      className="flex gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-khata-paperMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-khata-green/10 text-khata-green">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-khata-ink">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-khata-muted">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="hidden h-9 min-w-0 items-center gap-2 rounded-full bg-khata-paperMuted/70 px-2 py-1 sm:flex"
          title={userEmail}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-khata-ink text-[11px] font-semibold text-white shadow-sm">
            {profileInitial}
          </span>
          <span className="hidden min-w-0 items-baseline gap-1.5 lg:flex">
            <span className="max-w-32 truncate text-sm font-semibold text-khata-ink">
              {userEmail}
            </span>
            <span className="max-w-20 truncate text-xs capitalize text-khata-muted">
              {roleLabel}
            </span>
          </span>
        </div>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-khata-ink/30 px-4 pt-20 backdrop-blur-sm sm:pt-24"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSearchOpen(false);
            }
          }}
        >
          <div
            id={searchDialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${searchDialogId}-title`}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-khata-border bg-white shadow-2xl"
          >
            <form onSubmit={submitSearch}>
              <div className="flex items-center gap-3 border-b border-khata-border px-4 py-3">
                <Search className="size-5 shrink-0 text-khata-muted" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <label id={`${searchDialogId}-title`} htmlFor={`${searchDialogId}-input`} className="sr-only">
                    Search workspace
                  </label>
                  <input
                    ref={searchInputRef}
                    id={`${searchDialogId}-input`}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-10 w-full border-0 bg-transparent text-base text-khata-ink outline-none placeholder:text-khata-muted/70"
                    placeholder="Search clients, inbox, or review queue"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                >
                  Esc
                </button>
              </div>

              <div className="grid gap-2 p-3">
                {searchTargets.map((target) => (
                  <button
                    key={target.href}
                    type="button"
                    onClick={() => setTargetHref(target.href)}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green ${
                      targetHref === target.href
                        ? "border-khata-green/40 bg-khata-green/10"
                        : "border-transparent hover:bg-khata-paperMuted"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-khata-ink">
                      {target.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-khata-muted">
                      {target.helper}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-khata-border bg-khata-paperMuted/50 px-4 py-3">
                <p className="text-xs text-khata-muted">
                  Searches open existing filtered dashboard pages.
                </p>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-khata-green px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-khata-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}