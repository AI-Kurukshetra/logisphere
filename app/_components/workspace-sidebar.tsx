"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";

export type WorkspaceSidebarItem = {
  badge?: number | null;
  description?: string;
  href: string;
  label: string;
};

export type WorkspaceSidebarSection = {
  items: WorkspaceSidebarItem[];
  title: string;
};

export type WorkspaceSidebarStat = {
  label: string;
  note: string;
  value: string;
};

function isActivePath(pathname: string | null, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname?.startsWith(`${href}/`));
}

export function WorkspaceSidebar({
  companyName,
  companySlug,
  eyebrow,
  email,
  footerNote,
  fullName,
  roleLabel,
  sections,
  stats,
}: Readonly<{
  companyName: string;
  companySlug: string | null;
  eyebrow: string;
  email: string | null;
  footerNote?: string;
  fullName: string | null;
  roleLabel: string;
  sections: WorkspaceSidebarSection[];
  stats: WorkspaceSidebarStat[];
}>) {
  const pathname = usePathname();
  const initials = getInitials(fullName, email);
  const primaryEmail = email || "No email assigned";

  return (
    <aside className="border-b border-[color:var(--border-inverse)] bg-[linear-gradient(180deg,#081425_0%,#0d223a_38%,#102f4f_100%)] p-6 text-white lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6">
        <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 shadow-[0_18px_48px_rgba(2,6,23,0.22)] backdrop-blur-sm">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-semibold uppercase tracking-[0.24em] text-slate-950">
              LS
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-100/80">
                {eyebrow}
              </p>
              <p className="truncate text-lg font-semibold text-white">{companyName}</p>
            </div>
          </Link>

          <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/18 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-50">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {fullName || primaryEmail}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.24em] text-cyan-100/75">
                {roleLabel}
              </p>
              <p className="mt-2 truncate text-xs text-cyan-50/80">
                Scope: {companySlug || "workspace"} · Account: {primaryEmail}
              </p>
            </div>
          </div>

          {stats.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/78">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-cyan-50/76">{stat.note}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex-1 space-y-5">
          {sections.map((section) => (
            <section key={section.title}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-100/72">
                {section.title}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-[1.25rem] border px-4 py-3 transition",
                        active
                          ? "border-cyan-300/50 bg-cyan-400/25 text-white shadow-[0_16px_30px_rgba(34,211,238,0.15)]"
                          : "border-white/8 bg-white/6 text-white hover:border-white/14 hover:bg-white/10"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {item.label}
                        </p>
                        {item.description ? (
                          <p
                            className={cn(
                              "mt-1 truncate text-xs",
                              active ? "text-cyan-50/90" : "text-cyan-50/74"
                            )}
                          >
                            {item.description}
                          </p>
                        ) : null}
                      </div>

                      {typeof item.badge === "number" ? (
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-cyan-300/16 text-cyan-50"
                          )}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
