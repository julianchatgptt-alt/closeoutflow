"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  DENSITY_STORAGE_KEY,
  type DensityPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference
} from "./theme-script";

type ThemeContextValue = {
  theme: ThemePreference;
  density: DensityPreference;
  setTheme: (theme: ThemePreference) => void;
  setDensity: (density: DensityPreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  const dark =
    resolveTheme(theme, window.matchMedia("(prefers-color-scheme: dark)").matches) === "dark";
  root.classList.toggle("dark", dark);
  root.dataset.theme = theme;
  root.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [density, setDensityState] = useState<DensityPreference>("comfortable");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      const storedDensity = localStorage.getItem(DENSITY_STORAGE_KEY);
      setThemeState(storedTheme === "light" || storedTheme === "dark" ? storedTheme : "system");
      setDensityState(storedDensity === "compact" ? "compact" : "comfortable");
      setPreferencesLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme(theme);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [preferencesLoaded, theme]);

  const setTheme = useCallback((value: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, value);
    setThemeState(value);
    applyTheme(value);
  }, []);

  const setDensity = useCallback((value: DensityPreference) => {
    localStorage.setItem(DENSITY_STORAGE_KEY, value);
    document.documentElement.dataset.density = value;
    setDensityState(value);
  }, []);

  const value = useMemo(
    () => ({ theme, density, setTheme, setDensity }),
    [density, setDensity, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
