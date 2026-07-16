import { normalizeDensity, normalizeTheme, resolveTheme, THEME_INIT_SCRIPT } from "./theme-script";

describe("theme foundation", () => {
  it("resolves system preferences", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("initializes all persistent preferences before paint", () => {
    expect(THEME_INIT_SCRIPT).toContain("cof-theme");
    expect(THEME_INIT_SCRIPT).toContain("cof-density");
    expect(THEME_INIT_SCRIPT).toContain("cof-sidebar");
  });

  it("normalizes invalid persistent preferences", () => {
    expect(normalizeTheme("sepia")).toBe("system");
    expect(normalizeTheme("dark")).toBe("dark");
    expect(normalizeDensity("dense")).toBe("comfortable");
    expect(normalizeDensity("compact")).toBe("compact");
    expect(THEME_INIT_SCRIPT).toContain('["light","dark","system"].includes(raw)');
  });
});
