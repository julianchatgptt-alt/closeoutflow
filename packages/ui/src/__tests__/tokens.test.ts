import fs from "node:fs";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync("packages/ui/src/tokens.css", "utf8");

describe("Phase 3 design tokens", () => {
  it.each([
    "--surface",
    "--shadow-card",
    "--primary-hover",
    "--success-subtle",
    "--warning-foreground",
    "--owner-border",
    "--sidebar-w",
    "--row-h-compact",
    "--dur-base",
    "--z-command"
  ])("defines %s", (token) => expect(css).toContain(token));

  it("includes light, dark, compact, contrast, and reduced-motion layers", () => {
    expect(css).toContain(".dark");
    expect(css).toContain('[data-density="compact"]');
    expect(css).toContain("prefers-contrast: more");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});

describe("Phase 6E-B2 surface ladder", () => {
  it.each([
    "--hairline",
    "--shadow-raised",
    "--shadow-overlay",
    "--nav-item-active-bg",
    "--nav-item-active-accent",
    "--nav-item-active-fg",
    "--content-wide",
    "--text-metric"
  ])("defines %s", (token) => expect(css).toContain(token));

  it("gives dark mode a real ambient elevation rather than a border ring", () => {
    const dark = css.slice(css.indexOf(".dark {"), css.indexOf("/* Primary actions retain"));
    // The old dark --shadow-raised equivalent was `0 0 0 1px hsl(var(--border))`,
    // which made every raised surface read as just another outlined rectangle.
    const raised = /--shadow-raised:([^;]+);/.exec(dark)?.[1] ?? "";
    expect(raised).toMatch(/\d+px\s+-?\d+px/); // has real blur/spread geometry
    expect(raised).not.toMatch(/^\s*0 0 0 1px/);
  });

  it("keeps panels free of a drop shadow so only focal surfaces are elevated", () => {
    const light = css.slice(0, css.indexOf(".dark {"));
    const cardShadow = /--shadow-card:([^;]+);/.exec(light)?.[1]?.trim() ?? "";
    expect(cardShadow).toBe("0 0 0 1px hsl(var(--hairline))");
  });

  it("keeps the hairline lower-contrast than the outer border in both themes", () => {
    // Internal table/list rules must be quieter than outer boundaries, otherwise
    // the register reads as a spreadsheet grid.
    expect(lightness("--hairline", "light")).toBeGreaterThan(lightness("--border", "light"));
    expect(lightness("--hairline", "dark")).toBeLessThan(lightness("--border", "dark"));
  });
});

describe("token contrast (AA)", () => {
  const lightCanvas: Hsl = [216, 22, 95.5];
  const lightPanel: Hsl = [0, 0, 100];
  const lightQuiet: Hsl = [214, 20, 97.5];
  const darkCanvas: Hsl = [222, 20, 7];
  const darkPanel: Hsl = [220, 16, 12.5];
  const darkRaised: Hsl = [219, 15, 16.5];

  it("keeps primary body text at AA in both themes", () => {
    expect(contrast([220, 26, 14], lightCanvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast([210, 30, 96], darkCanvas)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps secondary text readable on every surface in the ladder", () => {
    const lightSecondary: Hsl = [220, 20, 26];
    for (const surface of [lightCanvas, lightPanel, lightQuiet]) {
      expect(contrast(lightSecondary, surface)).toBeGreaterThanOrEqual(4.5);
    }
    const darkSecondary: Hsl = [215, 20, 84];
    for (const surface of [darkCanvas, darkPanel, darkRaised]) {
      expect(contrast(darkSecondary, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the quieter overline/metadata rank at AA too", () => {
    const lightSubtle: Hsl = [220, 14, 36];
    for (const surface of [lightCanvas, lightPanel, lightQuiet]) {
      expect(contrast(lightSubtle, surface)).toBeGreaterThanOrEqual(4.5);
    }
    const darkSubtle: Hsl = [215, 16, 72];
    for (const surface of [darkCanvas, darkPanel, darkRaised]) {
      expect(contrast(darkSubtle, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the active navigation label readable on its tinted background", () => {
    expect(contrast([215, 66, 30], [215, 70, 96])).toBeGreaterThanOrEqual(4.5);
    expect(contrast([210, 60, 90], [215, 40, 18])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps primary button text at AA", () => {
    expect(contrast([0, 0, 100], [216, 68, 36])).toBeGreaterThanOrEqual(4.5);
  });
});

type Hsl = [number, number, number];

function lightness(token: string, theme: "light" | "dark") {
  const darkStart = css.indexOf(".dark {");
  const scope = theme === "light" ? css.slice(0, darkStart) : css.slice(darkStart);
  const value = new RegExp(`${token}:\\s*[\\d.]+ [\\d.]+% ([\\d.]+)%`).exec(scope)?.[1];
  expect(value, `${token} (${theme}) should be an hsl triple`).toBeDefined();
  return Number(value);
}

function contrast(foreground: Hsl, background: Hsl) {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
}

function luminance([h, s, l]: Hsl) {
  const saturation = s / 100;
  const lightness = l / 100;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [r + m, g + m, b + m]
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index]!, 0);
}
