"use client";

import {
  FileDown,
  FileText,
  Inbox,
  LayoutDashboard,
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
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavItems } from "@/lib/dashboard/nav";
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
    items: [
      "/dashboard/audit-logs",
      "/dashboard/operations",
      "/dashboard/platform",
      "/dashboard/settings",
    ],
  },
];

export function DashboardNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const itemByHref = new Map(
    dashboardNavItems.map((item) => [item.href as string, item]),
  );

  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto k-scrollbar py-3",
        collapsed ? "px-2 space-y-4" : "px-2.5",
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
          <div key={group.title} className={collapsed ? "space-y-1" : "mb-4 last:mb-0"}>
            {!collapsed && (
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-khata-muted/80">
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

                return (
                  <li key={href}>
                    <Link
                      href={item.href}
                      prefetch={process.env.NEXT_PUBLIC_KHATAONE_PREFETCH_EXPERIMENT === "1" &&
                        (pathname === href || href === "/dashboard") ? false : undefined}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center rounded-lg text-xs font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green",
                        collapsed
                          ? "size-9 mx-auto justify-center"
                          : "min-h-9 gap-2.5 px-2.5 py-2",
                        isActive
                          ? "bg-khata-green/10 font-semibold text-khata-green shadow-sm"
                          : "text-khata-ink/80 hover:bg-khata-paperMuted hover:text-khata-ink",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {!collapsed && (
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      )}
                    </Link>
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
