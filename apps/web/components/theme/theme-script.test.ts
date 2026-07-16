import { resolveTheme, THEME_INIT_SCRIPT } from "./theme-script";

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
});
