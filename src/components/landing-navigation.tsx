"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

const navItems = [
  { label: "How it works", href: "#how", id: "how" },
  { label: "Features", href: "#features", id: "features" },
  { label: "FAQ", href: "#faq", id: "faq" },
];

export function LandingNavigation() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [activeId, setActiveId] = useState("how");

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.1, 0.35, 0.6],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  function closeMobileMenu() {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  return (
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
      <div className="flex items-center">
        <Link
          href="/"
          aria-label="KhataOne home"
          className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
        >
          <BrandLogo />
        </Link>
      </div>

      <nav
        aria-label="Primary"
        className="hidden items-center gap-1 rounded-full border border-khata-border/70 bg-khata-paperMuted/70 p-1 md:flex"
      >
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={isActive ? "location" : undefined}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green ${
                isActive
                  ? "bg-white text-khata-green shadow-sm"
                  : "text-khata-muted hover:bg-white/60 hover:text-khata-ink"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="hidden items-center justify-end gap-3 md:flex">
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-xs font-medium text-khata-muted transition hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green"
        >
          Sign in
        </Link>
        <span className="h-4 w-px bg-khata-border" aria-hidden="true" />
        <a
          href="#demo"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-khata-green px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-khata-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-khata-green active:scale-[0.98]"
        >
          <span>Book a demo</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      <details ref={detailsRef} className="group relative md:hidden">
        <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-khata-border bg-white text-khata-ink shadow-sm transition hover:bg-khata-paperMuted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green">
          <span className="sr-only">Open navigation menu</span>
          <Menu className="h-5 w-5" />
        </summary>
        <div className="absolute right-0 top-12 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-khata-border bg-white p-2.5 shadow-xl">
          <nav aria-label="Mobile primary" className="grid gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeId === item.id
                    ? "bg-khata-green/10 font-semibold text-khata-green"
                    : "text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink"
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="my-1.5 h-px bg-khata-border" />
            <Link
              href="/login"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink"
            >
              Sign in
            </Link>
            <a
              href="#demo"
              onClick={closeMobileMenu}
              className="mt-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-khata-green px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-khata-greenDark"
            >
              <span>Book a demo</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </details>
    </div>
  );
}
