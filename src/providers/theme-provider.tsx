"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "logisphere-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  // Always use light theme, ignore stored preferences and system settings
  return "light";
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Always use light theme
  const [theme] = useState<Theme>("light");

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        setTheme: () => {}, // No-op: always light
        toggleTheme: () => {}, // No-op: always light
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
