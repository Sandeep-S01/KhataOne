"use client";

import { Bell, Inbox, ListChecks, Search, Wrench, X, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  CommandOption,
  IconBadge,
  ProfilePill,
  TopbarIconButton,
  commandDialogPanelClassName,
  commandInputClassName,
  functionalIconClassName,
  functionalIconStrokeWidth,
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
    icon: Wrench,
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
  const activityButtonId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchReturnFocusRef = useRef<HTMLElement | null>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const activityItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [targetHref, setTargetHref] = useState<Route>("/dashboard/review-queue");

  const activityButton = useCallback(
    () => document.getElementById(activityButtonId),
    [activityButtonId],
  );

  const openSearch = useCallback(() => {
    const activeElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    searchReturnFocusRef.current =
      activeElement && activityRef.current?.contains(activeElement)
        ? activityButton()
        : activeElement;
    setSearchOpen(true);
    setActivityOpen(false);
  }, [activityButton]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    requestAnimationFrame(() => searchReturnFocusRef.current?.focus());
  }, []);

  const activityItems = useCallback(
    () =>
      activityItemRefs.current.filter(
        (item): item is HTMLAnchorElement => Boolean(item),
      ),
    [],
  );

  const focusActivityItem = useCallback(
    (index: number) => {
      const items = activityItems();

      if (items.length === 0) {
        return;
      }

      const nextIndex = (index + items.length) % items.length;
      items[nextIndex]?.focus();
    },
    [activityItems],
  );

  const closeActivity = useCallback((restoreFocus = true) => {
    setActivityOpen(false);

    if (restoreFocus) {
      requestAnimationFrame(() => activityButton()?.focus());
    }
  }, [activityButton]);

  const openActivity = useCallback(
    (focusFirstItem = false) => {
      setActivityOpen(true);
      setSearchOpen(false);

      if (focusFirstItem) {
        requestAnimationFrame(() => focusActivityItem(0));
      }
    },
    [focusActivityItem],
  );

  const toggleActivity = useCallback(() => {
    setActivityOpen((value) => {
      const nextValue = !value;

      if (nextValue) {
        setSearchOpen(false);
      }

      return nextValue;
    });
  }, []);

  const handleActivityButtonKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        openActivity(true);
      }
    },
    [openActivity],
  );

  const handleActivityMenuKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const items = activityItems();
      const currentIndex = items.findIndex((item) => item === document.activeElement);

      if (event.key === "Escape") {
        event.preventDefault();
        closeActivity();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusActivityItem(currentIndex + 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusActivityItem(currentIndex - 1);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        focusActivityItem(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        focusActivityItem(items.length - 1);
      }
    },
    [activityItems, closeActivity, focusActivityItem],
  );

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [closeSearch, openSearch, searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusable = searchPanelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable?.[0];
      const last = focusable?.[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
        searchPanelRef.current?.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSearch, openSearch, searchOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (searchOpen) {
          closeSearch();
        }
        if (activityOpen) {
          closeActivity();
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activityOpen, closeActivity, closeSearch, openSearch, searchOpen]);

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
        closeActivity(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activityOpen, closeActivity]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeSearch();
    router.push(buildSearchHref(targetHref, query));
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <TopbarIconButton
          onClick={() => {
            openSearch();
          }}
          aria-label="Search workspace"
          aria-haspopup="dialog"
          aria-controls={searchDialogId}
          title="Search workspace"
        >
          <Search
            className={functionalIconClassName}
            strokeWidth={functionalIconStrokeWidth}
            aria-hidden="true"
          />
        </TopbarIconButton>

        <div ref={activityRef} className="relative">
          <TopbarIconButton
            id={activityButtonId}
            onClick={toggleActivity}
            onKeyDown={handleActivityButtonKeyDown}
            className="relative"
            aria-label="Open activity center"
            aria-haspopup="menu"
            aria-expanded={activityOpen}
            aria-controls={activityPanelId}
            title="Activity center"
          >
            <Bell
              className={functionalIconClassName}
              strokeWidth={functionalIconStrokeWidth}
              aria-hidden="true"
            />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-khata-green ring-2 ring-white" aria-hidden="true" />
          </TopbarIconButton>

          {activityOpen && (
            <div
              id={activityPanelId}
              role="menu"
              aria-labelledby={activityButtonId}
              onKeyDown={handleActivityMenuKeyDown}
              className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-khata-border/90 bg-khata-surface shadow-lg"
            >
              <div className="border-b border-khata-border bg-khata-paperMuted/50 px-4 py-3">
                <p className="text-sm font-semibold text-khata-ink">Activity center</p>
                <p className="mt-0.5 text-xs text-khata-muted">
                  Jump to queues that may need attention.
                </p>
              </div>
              <div className="p-2">
                {activityLinks.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      ref={(node) => {
                        activityItemRefs.current[index] = node;
                      }}
                      href={item.href}
                      role="menuitem"
                      onClick={() => closeActivity(false)}
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
              closeSearch();
            }
          }}
        >
          <div
            ref={searchPanelRef}
            id={searchDialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${searchDialogId}-title`}
            className={commandDialogPanelClassName}
            tabIndex={-1}
          >
            <form onSubmit={submitSearch}>
              <div className="flex items-center gap-3 border-b border-khata-border px-4 py-2.5">
                <Search
                  className={`${functionalIconClassName} text-khata-muted`}
                  strokeWidth={functionalIconStrokeWidth}
                  aria-hidden="true"
                />
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
                  onClick={closeSearch}
                  className="inline-flex size-8 items-center justify-center rounded-md text-khata-muted transition-colors hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
                  aria-label="Close search"
                  title="Close search"
                >
                  <X
                    className={functionalIconClassName}
                    strokeWidth={functionalIconStrokeWidth}
                    aria-hidden="true"
                  />
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
