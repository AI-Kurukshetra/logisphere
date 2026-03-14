"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminRoutes, workspaceRoutePrefixes } from "@/manager_directory/routes";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith(adminRoutes.root)) {
    return null;
  }
  const isWorkspace = workspaceRoutePrefixes.some(
    (p) => pathname === p || pathname?.startsWith(p + "/")
  );
  if (isWorkspace) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--surface-inverse)] text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--text-inverse)] shadow-[var(--shadow-soft)]">
            LS
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--muted)]">
              Logisphere
            </p>
            <p className="hidden text-sm text-[color:var(--muted-strong)] sm:block">
              Freight intelligence platform
            </p>
          </div>
        </Link>

        <nav className="hidden flex-wrap items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-1 shadow-[var(--shadow-soft)] md:flex">
          <Link
            href="/features"
            className="rounded-full px-4 py-2 text-sm text-[color:var(--muted-strong)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--brand-ink)]"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-4 py-2 text-sm text-[color:var(--muted-strong)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--brand-ink)]"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="rounded-full px-4 py-2 text-sm text-[color:var(--muted-strong)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--brand-ink)]"
          >
            Docs
          </Link>
          <Link
            href="/blog"
            className="rounded-full px-4 py-2 text-sm text-[color:var(--muted-strong)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--brand-ink)]"
          >
            Insights
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/contact"
            className="hidden rounded-full px-4 py-2 text-sm text-[color:var(--muted-strong)] transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--brand-ink)] sm:inline-flex"
          >
            Talk to Sales
          </Link>
          <Link
            href={adminRoutes.login}
            className="hidden rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-medium text-[color:var(--brand-ink)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--brand-ink)] lg:inline-flex"
            title="Admin Console"
          >
            Admin
          </Link>
          <Link
            href="/auth"
            className="rounded-full bg-[color:var(--surface-inverse)] px-4 py-2 text-xs font-semibold !text-white transition hover:opacity-90 sm:text-sm"
          >
            Open Platform
          </Link>
        </div>
      </div>
    </header>
  );
}
