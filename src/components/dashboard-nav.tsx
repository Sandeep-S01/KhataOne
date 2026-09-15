"use client";

import {
  FileDown,
  FileText,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  PanelsTopLeft,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { dashboardNavItems } from "@/lib/dashboard/nav";
import {
  functionalIconClassName,
  functionalIconStrokeWidth,
  sidebarSectionLabelClassName,
} from "@/components/design-system";
import { cn } from "@/lib/utils";

const iconByHref: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/clients": Users,
  "/dashboard/inbox": Inbox,
  "/dashboard/review-queue": ListChecks,
  "/dashboard/ledger": Receipt,
  "/dashboard/gst-summary": ShieldCheck,
  "/dashboard/reports": FileText,
  "/dashboard/exports": FileDown,
  "/dashboard/audit-logs": ScrollText,
  "/dashboard/operations": Wrench,
  "/dashboard/platform": PanelsTopLeft,
  "/dashboard/settings": Settings,
  "/contact": LifeBuoy,
};

const groups = [
  {
    title: "Work",
    items: ["/dashboard", "/dashboard/inbox", "/dashboard/review-queue"],
  },
  {
    title: "Clients",
    items: ["/dashboard/clients"],
  },
  {
    title: "Accounting",
    items: ["/dashboard/ledger", "/dashboard/gst-summary"],
  },
  {
    title: "Output",
    items: ["/dashboard/reports", "/dashboard/exports"],
  },
  {
    title: "Administration",
    items: ["/dashboard/audit-logs", "/dashboard/operations"],
  },
  {
    title: "Planned",
    items: ["/dashboard/platform"],
  },
];

const utilityItems = [
  { label: "Settings", href: "/dashboard/settings" as Route },
  { label: "Help", href: "/contact" as Route },
];

type DashboardNavItem = (typeof dashboardNavItems)[number];

export type DashboardNavCounts = {
  inbox: number | null;
  reviewQueue: number | null;
};

type NavCountBadge = {
  value: number;
  tone: "neutral" | "warning";
};

function countBadgeForHref(href: string, counts?: DashboardNavCounts): NavCountBadge | null {
  if (href === "/dashboard/inbox" && typeof counts?.inbox === "number" && counts.inbox > 0) {
    return { value: counts.inbox, tone: "neutral" };
  }

  if (
    href === "/dashboard/review-queue" &&
    typeof counts?.reviewQueue === "number" &&
    counts.reviewQueue > 0
  ) {
    return { value: counts.reviewQueue, tone: "warning" };
  }

  return null;
}

function formatBadgeCount(value: number) {
  return value > 99 ? "99+" : String(value);
}

function DashboardNavLink({
  item,
  icon: Icon,
  isActive,
  collapsed,
  pathname,
  onNavigate,
  badge,
}: {
  item: DashboardNavItem;
  icon: LucideIcon;
  isActive: boolean;
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
  badge?: NavCountBadge | null;
}) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const tooltipId = useId();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!collapsed || !tooltipVisible) {
      return;
    }

    const updatePosition = () => {
      const rect = linkRef.current?.getBoundingClientRect();

      if (rect) {
        setTooltipPosition({
          left: rect.right + 8,
          top: rect.top + rect.height / 2,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [collapsed, tooltipVisible]);

  useEffect(() => {
    if (!collapsed || !tooltipVisible) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTooltipVisible(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, tooltipVisible]);

  const showTooltip = () => {
    if (collapsed) {
      setTooltipVisible(true);
    }
  };

  const hideTooltip = () => setTooltipVisible(false);
  const href = item.href as string;
  const badgeLabel = badge ? `${formatBadgeCount(badge.value)} open` : null;
  const collapsedLabel = badgeLabel ? `${item.label}, ${badgeLabel}` : item.label;

  return (
    <>
      <Link
        ref={linkRef}
        href={item.href}
        prefetch={process.env.NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT === "1" &&
          (pathname === href || href === "/dashboard") ? false : undefined}
        onClick={onNavigate}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setTooltipVisible(false);
          }
        }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-current={isActive ? "page" : undefined}
        aria-label={collapsed ? collapsedLabel : undefined}
        aria-describedby={collapsed && tooltipVisible ? tooltipId : undefined}
        className={cn(
          "relative flex items-center rounded-lg text-[13px] font-medium leading-[18px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green",
          collapsed
            ? "mx-auto size-10 justify-center"
            : "min-h-11 gap-3 px-3 py-2 lg:min-h-9 lg:py-1.5",
          isActive
            ? "bg-khata-green/10 font-semibold text-khata-green shadow-sm ring-1 ring-khata-green/10"
            : "text-khata-ink/75 hover:bg-khata-paperMuted hover:text-khata-ink",
        )}
      >
        <Icon
          className={functionalIconClassName}
          strokeWidth={functionalIconStrokeWidth}
          aria-hidden="true"
        />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {badge && (
              <span
                className={cn(
                  "ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none tabular-nums",
                  badge.tone === "warning"
                    ? "bg-warning/15 text-warning"
                    : "bg-khata-paperMuted text-khata-ink/70",
                )}
                aria-label={badgeLabel ?? undefined}
              >
                {formatBadgeCount(badge.value)}
              </span>
            )}
          </>
        )}
        {collapsed && badge && (
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold leading-none tabular-nums ring-2 ring-white",
              badge.tone === "warning"
                ? "bg-warning/20 text-warning"
                : "bg-khata-paperMuted text-khata-ink/70",
            )}
            aria-hidden="true"
          >
            {formatBadgeCount(badge.value)}
          </span>
        )}
      </Link>
      {collapsed && tooltipVisible && typeof document !== "undefined" &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-khata-ink px-2 py-1 text-xs font-medium text-white shadow-lg"
            style={tooltipPosition}
          >
            {item.label}
          </span>,
          document.body,
        )}
    </>
  );
}

export function DashboardNav({
  onNavigate,
  collapsed = false,
  counts,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  counts?: DashboardNavCounts;
}) {
  const pathname = usePathname();
  const itemByHref = new Map(
    dashboardNavItems.map((item) => [item.href as string, item]),
  );

  return (
    <nav
      className={cn(
        "min-h-0 flex-1 overflow-y-auto k-scrollbar",
        collapsed ? "space-y-4 px-2 py-3" : "px-3 py-3",
      )}
      aria-label="Workspace"
    >
      {groups.map((group) => {
        const items = group.items
          .map((href) => itemByHref.get(href))
          .filter((item): item is (typeof dashboardNavItems)[number] =>
            Boolean(item),
          );

        return (
          <div key={group.title} className={collapsed ? "space-y-1" : "mb-3 last:mb-0"}>
            {!collapsed && (
              <p className={sidebarSectionLabelClassName}>
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const href = item.href as string;
                const Icon = iconByHref[href] ?? LayoutDashboard;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${href}/`));
                const badge = countBadgeForHref(href, counts);

                return (
                  <li key={href}>
                    <DashboardNavLink
                      item={item}
                      icon={Icon}
                      isActive={isActive}
                      collapsed={collapsed}
                      pathname={pathname}
                      onNavigate={onNavigate}
                      badge={badge}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function DashboardUtilityNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Workspace utilities"
      className={cn(
        "border-t border-khata-border/80",
        collapsed ? "px-2 py-3" : "px-3 py-3",
      )}
    >
      <ul className="space-y-1">
        {utilityItems.map((item) => {
          const href = item.href as string;
          const Icon = iconByHref[href] ?? Settings;
          const isActive =
            pathname === href ||
            (href !== "/contact" && pathname.startsWith(`${href}/`));

          return (
            <li key={href}>
              <DashboardNavLink
                item={item}
                icon={Icon}
                isActive={isActive}
                collapsed={collapsed}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
