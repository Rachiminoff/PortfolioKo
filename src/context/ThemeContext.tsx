import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  isLightMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getStoredTheme(): Theme {
  try {
    return localStorage.getItem("tdy-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const body = document.body;

  root.dataset.theme = theme;
  body.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  useLayoutEffect(() => {
    applyTheme(theme);

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = theme === "light" ? "#f2f0e8" : "#000000";
    }

    try {
      localStorage.setItem("tdy-theme", theme);
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    if (nextTheme === theme) return;

    // Enable the temporary transition class only for an intentional theme change.
    document.documentElement.classList.add("theme-transition");
    document.body.classList.add("theme-transition");

    setThemeState(nextTheme);

    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
      document.body.classList.remove("theme-transition");
    }, 560);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [setTheme, theme]);

  const value = useMemo(() => ({
    theme,
    isLightMode: theme === "light",
    toggleTheme,
    setTheme,
  }), [theme, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
