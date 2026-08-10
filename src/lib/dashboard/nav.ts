import type { Route } from "next";

export const dashboardNavItems: Array<{ label: string; href: Route }> = [
  { label: "Overview", href: "/dashboard" },
  { label: "Clients", href: "/dashboard/clients" },
  { label: "Inbox", href: "/dashboard/inbox" },
  { label: "Review Queue", href: "/dashboard/review-queue" },
  { label: "Ledger", href: "/dashboard/ledger" },
  { label: "GST Summary", href: "/dashboard/gst-summary" },
  { label: "Reports", href: "/dashboard/reports" },
  { label: "Exports", href: "/dashboard/exports" },
  { label: "Audit Logs", href: "/dashboard/audit-logs" },
  { label: "Operations", href: "/dashboard/operations" as Route },
  { label: "Platform", href: "/dashboard/platform" as Route },
  { label: "Settings", href: "/dashboard/settings" },
];
