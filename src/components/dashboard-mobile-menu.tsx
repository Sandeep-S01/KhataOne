"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav, DashboardUtilityNav } from "@/components/dashboard-nav";

export function DashboardMobileMenu() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  function openMenu() {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
      setIsOpen(true);
    }
  }

  function closeMenu() {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="dashboard-mobile-navigation"
        className="flex size-11 items-center justify-center rounded-md text-khata-muted transition hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green md:size-9"
      >
        <span className="sr-only">Open workspace navigation</span>
        <Menu className="size-5" aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        id="dashboard-mobile-navigation"
        aria-label="Workspace navigation"
        onCancel={(event) => {
          event.preventDefault();
          closeMenu();
        }}
        onClose={() => {
          setIsOpen(false);
          triggerRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeMenu();
          }
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-khata-ink/25 lg:hidden"
      >
        <div className="absolute left-3 top-14 flex max-h-[calc(100dvh-4.25rem)] w-[min(19rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.375rem] border border-khata-border/80 bg-white shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b border-khata-border/80 px-4 py-3">
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className="block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
              aria-label="KhataOne dashboard"
            >
              <BrandLogo />
            </Link>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close workspace navigation"
              className="flex size-11 shrink-0 items-center justify-center rounded-md text-khata-muted transition hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green md:size-9"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <DashboardNav onNavigate={closeMenu} />
          <DashboardUtilityNav onNavigate={closeMenu} />
        </div>
      </dialog>
    </div>
  );
}
