"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav } from "@/components/dashboard-nav";

export function DashboardMobileMenu() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  return (
    <details ref={detailsRef} className="group relative lg:hidden">
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-khata-muted transition hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green">
        <span className="sr-only">Open workspace navigation</span>
        <Menu className="size-5" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 top-11 z-30 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-khata-border bg-white shadow-lg">
        <div className="border-b border-khata-border px-3 py-3">
          <Link
            href="/dashboard"
            onClick={closeMenu}
            className="block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
            aria-label="KhataOne dashboard"
          >
            <BrandLogo />
          </Link>
        </div>
        <DashboardNav onNavigate={closeMenu} />
      </div>
    </details>
  );
}
