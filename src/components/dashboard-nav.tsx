"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavItems } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1 p-3">
      {dashboardNavItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-khata-green text-white"
                : "text-khata-muted hover:bg-khata-paper hover:text-khata-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
