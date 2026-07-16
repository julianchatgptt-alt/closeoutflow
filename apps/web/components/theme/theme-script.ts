export const THEME_STORAGE_KEY = "cof-theme";
export const DENSITY_STORAGE_KEY = "cof-density";
export const SIDEBAR_STORAGE_KEY = "cof-sidebar";

export type ThemePreference = "light" | "dark" | "system";
export type DensityPreference = "comfortable" | "compact";

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean
): Exclude<ThemePreference, "system"> {
  return preference === "system" ? (prefersDark ? "dark" : "light") : preference;
}

export const THEME_INIT_SCRIPT = `(()=>{try{const d=document.documentElement,s=localStorage;const p=s.getItem("cof-theme")||"system";const dark=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",dark);d.dataset.theme=p;d.dataset.density=s.getItem("cof-density")||"comfortable";d.dataset.sidebar=s.getItem("cof-sidebar")||"expanded";d.style.colorScheme=dark?"dark":"light"}catch{}})();`;
