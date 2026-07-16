export const THEME_STORAGE_KEY = "cof-theme";
export const DENSITY_STORAGE_KEY = "cof-density";
export const SIDEBAR_STORAGE_KEY = "cof-sidebar";

export type ThemePreference = "light" | "dark" | "system";
export type DensityPreference = "comfortable" | "compact";

export function normalizeTheme(value: string | null): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function normalizeDensity(value: string | null): DensityPreference {
  return value === "compact" ? "compact" : "comfortable";
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean
): Exclude<ThemePreference, "system"> {
  return preference === "system" ? (prefersDark ? "dark" : "light") : preference;
}

export const THEME_INIT_SCRIPT = `(()=>{try{const d=document.documentElement,s=localStorage,raw=s.getItem("cof-theme"),p=["light","dark","system"].includes(raw)?raw:"system",density=s.getItem("cof-density")==="compact"?"compact":"comfortable",sidebar=s.getItem("cof-sidebar")==="collapsed"?"collapsed":"expanded";const dark=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);d.dataset.theme=p;d.dataset.density=density;d.dataset.sidebar=sidebar;d.style.colorScheme=dark?"dark":"light"}catch{}})();`;
