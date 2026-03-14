import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
  isActive?: boolean;
};

interface PageNavProps {
  currentPage: string;
  items?: NavItem[];
}

export function PageNav({ currentPage, items }: PageNavProps) {
  const defaultItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
    { label: "Docs", href: "/docs" },
  ];

  const navItems = items || defaultItems;

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {navItems.map((item) => {
        const isActive = currentPage === item.href || currentPage === item.label;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[color:var(--surface-inverse)] text-[color:var(--text-inverse)] shadow-[var(--shadow-soft)]"
                : "text-[color:var(--muted-strong)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--brand-ink)]"
            }`}
            title={isActive ? `Currently viewing ${currentPage}` : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
