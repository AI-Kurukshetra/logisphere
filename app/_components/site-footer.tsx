"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminRoutes, workspaceRoutePrefixes } from "@/manager_directory/routes";

const footerLinks = {
  Company: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ],
  Platform: [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/auth", label: "Sign In" },
  ],
} as const;

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith(adminRoutes.root) || pathname?.startsWith("/auth")) {
    return null;
  }

  const isWorkspace = workspaceRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname?.startsWith(prefix + "/")
  );

  if (isWorkspace || pathname?.startsWith("/onboarding")) {
    return null;
  }

  return (
    <footer className="border-t border-[color:var(--border)] px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/60 bg-[rgba(247,251,252,0.8)] p-6 shadow-[0_20px_60px_rgba(10,31,53,0.06)] backdrop-blur sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--brand-ink)] text-xs font-semibold uppercase tracking-[0.28em] text-white">
                LS
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500">
                  Logisphere
                </p>
                <p className="text-sm text-slate-600">Freight intelligence for finance and operations.</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-600">
              One control layer for shipment visibility, invoice accuracy, carrier performance,
              and freight planning.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                {group}
              </p>
              <div className="mt-4 space-y-3">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-slate-600 transition hover:text-[color:var(--brand-ink)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[color:var(--border)] pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Designed for freight teams that need action, not dashboard theater.</p>
          <p>© 2026 Logisphere</p>
        </div>
      </div>
    </footer>
  );
}
