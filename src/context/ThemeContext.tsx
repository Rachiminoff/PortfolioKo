import React, { createContext, useContext, useMemo } from "react";

export type Theme = "dark";

interface ThemeContextValue {
  theme: Theme;
  isLightMode: false;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ThemeContextValue>(() => ({
    theme: "dark",
    isLightMode: false,
    toggleTheme: () => undefined,
    setTheme: () => undefined,
  }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
