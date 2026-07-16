import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const previewRoutes = [
  "/dashboard",
  "/projects",
  "/projects/riverside-medical-office",
  "/projects/riverside-medical-office/requirements",
  "/projects/riverside-medical-office/documents",
  "/projects/riverside-medical-office/reviews",
  "/projects/riverside-medical-office/equipment",
  "/projects/riverside-medical-office/warranties",
  "/projects/riverside-medical-office/inspections",
  "/projects/riverside-medical-office/training",
  "/projects/riverside-medical-office/lien-waivers",
  "/projects/riverside-medical-office/drawings",
  "/projects/riverside-medical-office/package",
  "/projects/riverside-medical-office/contacts",
  "/projects/riverside-medical-office/activity",
  "/companies",
  "/reports",
  "/team",
  "/settings/general",
  "/settings/members",
  "/settings/templates",
  "/settings/trades",
  "/settings/billing",
  "/settings/integrations",
  "/settings/api-keys",
  "/settings/security"
];

test("shell navigation, skip link, and command palette work by keyboard", async ({
  page,
  isMobile
}) => {
  test.skip(isMobile, "Desktop keyboard navigation; mobile navigation is covered separately");
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  await page.getByPlaceholder("Search pages and sample projects…").fill("Projects");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects$/);
  await page.goto("/projects");
  const skipLink = page.getByText("Skip to main content");
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("mobile navigation and table card transformation are usable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-specific transformation");
  await page.goto("/projects");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "CloseoutFlow navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "CloseoutFlow navigation" })).toBeHidden();
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
});

test("theme preference persists without weakening the pre-paint initializer", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await page.evaluate(() => localStorage.getItem("cof-theme"))).toBe("dark");
});

test("all approved internal placeholder routes are honest", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    testInfo.project.name !== "chromium",
    "Full route census runs once; cross-browser smoke is separate"
  );
  for (const route of previewRoutes) {
    await page.goto(route);
    await expect(page.getByText("Preview — not yet functional").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("cross-browser shell and project workspace smoke", async ({ page }) => {
  await page.goto("/projects/riverside-medical-office/requirements");
  await expect(page.getByRole("heading", { level: 1, name: "Requirements" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project navigation" })).toBeVisible();
  await expect(page.getByText("Preview — not yet functional")).toBeVisible();
});

test("reduced motion removes design-system durations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dashboard");
  const duration = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--dur-base").trim()
  );
  expect(["0s", "0ms"]).toContain(duration);
});

for (const route of ["/dashboard", "/projects", "/settings/general"] as const) {
  test(`@a11y ${route} has no detectable violations in light and dark`, async ({ page }) => {
    for (const theme of ["light", "dark"] as const) {
      await page.addInitScript((value) => localStorage.setItem("cof-theme", value), theme);
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
  });
}

test("design gallery is available locally and absent from production navigation", async ({
  page
}) => {
  await page.goto("/design");
  await expect(
    page.getByRole("heading", { level: 1, name: "CloseoutFlow component gallery" })
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /design/i })).toHaveCount(0);
});
