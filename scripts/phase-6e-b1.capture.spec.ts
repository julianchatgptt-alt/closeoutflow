import { mkdir } from "node:fs/promises";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 6E-B1 — capture the dev-only Full-Product Visual Direction Review board.
 * Static gallery; no auth or database. Runs against an existing local dev server.
 */
const outputRoot = process.env.PHASE6E_B1_CAPTURE_DIR;
if (!outputRoot) throw new Error("PHASE6E_B1_CAPTURE_DIR is required");

async function prepare(page: Page, theme: "light" | "dark", width: number, height = 900) {
  await page.setViewportSize({ width, height });
  await page.addInitScript((t: string) => localStorage.setItem("cof-theme", t), theme);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design", { waitUntil: "networkidle" });
  await page.evaluate((t: string) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.dataset.theme = t;
    document
      .querySelectorAll("nextjs-portal")
      .forEach((p) => ((p as HTMLElement).style.display = "none"));
  }, theme);
}

async function shot(page: Page, selector: string, id: string) {
  await mkdir(outputRoot!, { recursive: true });
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await expect(el).toBeVisible();
  await el.screenshot({ path: path.join(outputRoot!, `${id}.png`), animations: "disabled" });
}

test("capture the Phase 6E-B1 founder visual review board", async ({ page }) => {
  test.setTimeout(240_000);

  // Desktop light
  await prepare(page, "light", 1440);
  await shot(page, "#pv-surfaces", "01-surfaces-light");
  await shot(page, "#pv-shell", "02-shell-light");
  await shot(page, "#pv-dashboard", "03-dashboard-light");
  await shot(page, "#pv-register", "04-register-light");
  await shot(page, "#pv-templates", "05-templates-light");
  await shot(page, "#pv-homepage", "06-homepage-light");
  await shot(page, "#pv-compare", "07-current-vs-proposed");
  await shot(page, `[aria-label="Full-Product Visual Direction Review"]`, "20-full-board-light");

  // Desktop dark
  await prepare(page, "dark", 1440);
  await shot(page, "#pv-surfaces", "08-surfaces-dark");
  await shot(page, "#pv-shell", "09-shell-dark");
  await shot(page, "#pv-dashboard", "10-dashboard-dark");
  await shot(page, "#pv-register", "11-register-dark");
  await shot(page, "#pv-templates", "12-templates-dark");
  await shot(page, `[aria-label="Full-Product Visual Direction Review"]`, "21-full-board-dark");

  // Mobile
  await prepare(page, "light", 412, 915);
  await shot(page, "#pv-shell", "13-shell-mobile");
  await shot(page, "#pv-dashboard", "14-dashboard-mobile");
  await shot(page, "#pv-register", "15-register-mobile");
  await shot(page, "#pv-templates", "16-templates-mobile");
  await shot(page, "#pv-homepage", "17-homepage-mobile");
});

test("the review board has no detectable a11y violations in light and dark", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    await prepare(page, theme, 1440);
    const results = await new AxeBuilder({ page })
      .include('[aria-label="Full-Product Visual Direction Review"]')
      .analyze();
    expect(results.violations, `${theme} violations`).toEqual([]);
  }
});
