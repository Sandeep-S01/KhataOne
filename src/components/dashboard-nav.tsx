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

export function DashboardNav() {
  const pathname = usePathname();
  const itemByHref = new Map(
    dashboardNavItems.map((item) => [item.href as string, item]),
  );

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Workspace">
      {groups.map((group) => {
        const items = group.items
          .map((href) => itemByHref.get(href))
          .filter(Boolean);

        return (
          <div key={group.title} className="mb-4 last:mb-0">
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-khata-muted">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                if (!item) {
                  return null;
                }

                const href = item.href as string;
                const Icon = iconByHref[href] ?? LayoutDashboard;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${href}/`));

                return (
                  <li key={href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex min-h-9 items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors duration-150",
                        isActive
                          ? "bg-khata-green/10 font-semibold text-khata-green before:absolute before:inset-y-1.5 before:-left-2 before:w-[3px] before:rounded-r before:bg-khata-green"
                          : "text-khata-ink/80 hover:bg-khata-paperMuted hover:text-khata-ink",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
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
