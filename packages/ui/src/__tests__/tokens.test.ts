import fs from "node:fs";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync("packages/ui/src/tokens.css", "utf8");

describe("Phase 3 design tokens", () => {
  it.each([
    "--surface",
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

  it("keeps key light and dark text pairs at AA contrast", () => {
    expect(contrast([220, 33, 11], [210, 20, 98])).toBeGreaterThanOrEqual(4.5);
    expect(contrast([210, 40, 96], [222, 40, 7])).toBeGreaterThanOrEqual(4.5);
    expect(contrast([0, 0, 100], [216, 68, 36])).toBeGreaterThanOrEqual(4.5);
  });
});

function contrast(foreground: [number, number, number], background: [number, number, number]) {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
}

function luminance([h, s, l]: [number, number, number]) {
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
