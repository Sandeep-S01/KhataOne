"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";

const navItems = [
  { label: "How it works", href: "#how", id: "how" },
  { label: "Features", href: "#features", id: "features" },
  { label: "FAQ", href: "#faq", id: "faq" },
];

const navLinkClass =
  "font-medium transition hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green";

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
    <>
      <nav
        aria-label="Primary"
        className="hidden items-center gap-6 text-sm text-khata-muted md:flex"
      >
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={activeId === item.id ? "location" : undefined}
            className={`${navLinkClass} ${
              activeId === item.id ? "text-khata-green" : "text-khata-muted"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
        >
          Sign in
        </Link>
        <a
          href="#demo"
          className="inline-flex h-9 items-center justify-center rounded-md bg-khata-green px-4 text-sm font-medium text-white shadow-sm hover:bg-khata-greenDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green"
        >
          Book a demo
        </a>
      </div>

      <details ref={detailsRef} className="group relative md:hidden">
        <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-khata-border bg-white text-khata-ink shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-khata-green">
          <span className="sr-only">Open navigation menu</span>
          <Menu className="h-5 w-5" />
        </summary>
        <div className="absolute right-0 top-14 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-khata-border bg-white p-2 shadow-lg">
          <nav aria-label="Mobile primary" className="grid gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-3 text-sm font-medium text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-lg px-3 py-3 text-sm font-medium text-khata-muted hover:bg-khata-paperMuted hover:text-khata-ink"
            >
              Sign in
            </Link>
            <a
              href="#demo"
              onClick={closeMobileMenu}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-khata-green px-4 text-sm font-medium text-white"
            >
              Book a demo
            </a>
          </nav>
        </div>
      </details>
    </>
  );
}
