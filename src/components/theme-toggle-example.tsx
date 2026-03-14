"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/src/hooks/use-theme";

export function ThemeToggleExample() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-2 py-2 shadow-[var(--shadow-soft)]">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          mounted && theme === "light"
            ? "bg-[color:var(--surface-inverse)] text-[color:var(--text-inverse)]"
            : "text-[color:var(--muted-strong)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--brand-ink)]"
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          mounted && theme === "dark"
            ? "bg-[color:var(--surface-inverse)] text-[color:var(--text-inverse)]"
            : "text-[color:var(--muted-strong)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--brand-ink)]"
        }`}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-ink)] transition hover:bg-[color:var(--surface-muted)]"
      >
        {mounted ? `Switch to ${theme === "light" ? "dark" : "light"}` : "Toggle theme"}
      </button>
    </div>
  );
}
