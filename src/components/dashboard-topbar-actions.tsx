"use client";

import { Bell, Inbox, ListChecks, Search, Settings, X, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";

import {
  CommandOption,
  IconBadge,
  ProfilePill,
  TopbarIconButton,
  commandDialogPanelClassName,
  commandInputClassName,
} from "@/components/design-system";

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
        <TopbarIconButton
          onClick={() => {
            setSearchOpen(true);
            setActivityOpen(false);
          }}
          aria-label="Search workspace"
          aria-haspopup="dialog"
          aria-controls={searchDialogId}
          title="Search workspace"
        >
          <Search className="size-5 stroke-[1.8]" aria-hidden="true" />
        </TopbarIconButton>

        <div ref={activityRef} className="relative">
          <TopbarIconButton
            onClick={() => {
              setActivityOpen((value) => !value);
              setSearchOpen(false);
            }}
            className="relative"
            aria-label="Open activity center"
            aria-haspopup="menu"
            aria-expanded={activityOpen}
            aria-controls={activityPanelId}
            title="Activity center"
          >
            <Bell className="size-5 stroke-[1.8]" aria-hidden="true" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-khata-green ring-2 ring-white" aria-hidden="true" />
          </TopbarIconButton>

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
                      <IconBadge icon={Icon} />
                      <span className="min-w-0">
                        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-khata-ink">
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

        <ProfilePill
          email={userEmail}
          roleLabel={roleLabel}
          initial={profileInitial}
        />
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-khata-ink/20 px-3 pt-[76px] sm:px-4"
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
            className={commandDialogPanelClassName}
          >
            <form onSubmit={submitSearch}>
              <div className="flex items-center gap-3 border-b border-khata-border px-4 py-2.5">
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
                    className={commandInputClassName}
                    placeholder="Search clients, inbox, or review queue"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="inline-flex size-8 items-center justify-center rounded-md text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                  aria-label="Close search"
                  title="Close search"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-1.5 p-2">
                {searchTargets.map((target) => (
                  <CommandOption
                    key={target.href}
                    onClick={() => setTargetHref(target.href)}
                    selected={targetHref === target.href}
                    title={target.label}
                    description={target.helper}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-khata-border bg-khata-paperMuted/45 px-4 py-2.5">
                <p className="text-xs text-khata-muted">
                  Press Enter to search the selected workspace area.
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
