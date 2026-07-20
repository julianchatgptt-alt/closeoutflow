import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const previewRoutes = [
  "/dashboard",
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
  "/reports",
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
  await expect(page.getByText("Navigation item", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  const commandInput = page.getByRole("combobox");
  await expect(commandInput).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: "Projects" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects$/);
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
  await expect(page.getByRole("dialog", { name: "Closeout navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Closeout navigation" })).toBeHidden();
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.getByRole("table")).toBeHidden();
});

test("theme preference persists without weakening the pre-paint initializer", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("menuitem", { name: /Use dark theme/ }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await page.evaluate(() => localStorage.getItem("cof-theme"))).toBe("dark");
});

test("command palette traps focus, restores it, and supports listbox keys", async ({
  page,
  isMobile
}) => {
  test.skip(isMobile, "Desktop trigger focus restoration; mobile behavior is covered separately");
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", { name: /^Search/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  const input = page.getByRole("combobox");
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Close command palette" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("option", { name: "Settings" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await page.keyboard.press("Home");
  await expect(page.getByRole("option", { name: "Dashboard" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Closeout branding, metadata, manifest, and labels are consistent", async ({
  page,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Brand census runs once");
  await page.goto("/dashboard");
  await expect(page).toHaveTitle("Dashboard | Closeout");
  await expect(page.getByRole("link", { name: "Closeout dashboard" })).toBeVisible();
  await expect(page.getByText("Closeout", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("CloseoutFlow");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    "content",
    "Closeout"
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://closeoutflow.com"
  );

  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = (await response.json()) as { name: string; short_name: string };
  expect(manifest.name).toBe("Closeout");
  expect(manifest.short_name).toBe("Closeout");
  expect(JSON.stringify(manifest)).not.toContain("CloseoutFlow");
});

test("invalid theme and collapsed sidebar values normalize before interaction", async ({
  page,
  isMobile
}) => {
  test.skip(isMobile, "Desktop sidebar dimensions");
  await page.addInitScript(() => {
    localStorage.setItem("cof-theme", "sepia");
    localStorage.setItem("cof-sidebar", "collapsed");
  });
  await page.goto("/dashboard");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "system");
  await expect(page.locator("html")).toHaveAttribute("data-sidebar", "collapsed");
  expect(
    await page
      .locator("aside[aria-label='Application sidebar']")
      .evaluate((element) => getComputedStyle(element).width)
  ).toBe("64px");
  expect(
    await page.locator(".app-shell").evaluate((element) => getComputedStyle(element).paddingLeft)
  ).toBe("64px");
});

test("sidebar and density preferences persist after interaction", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop sidebar preference");
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-sidebar", "collapsed");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-sidebar", "collapsed");

  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("menuitem", { name: "Density: comfortable" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
});

test("project search labels stay accessible but visually hidden", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "DOM presentation check runs once");
  await page.goto("/projects");
  await expect(page.getByText("Search projects")).toHaveClass(/sr-only/);
  await expect(page.getByRole("textbox", { name: "Search projects" })).toBeVisible();
});

test("organization name truncates safely on narrow screens", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Narrow viewport check runs once");
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/dashboard");
  const switcher = page.getByRole("button", { name: /Switch organization/ });
  await expect(switcher).toHaveAttribute("title", "Sample Construction Co.");
  const styles = await switcher.locator("span").evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      overflow: computed.overflow,
      textOverflow: computed.textOverflow,
      whiteSpace: computed.whiteSpace
    };
  });
  expect(styles).toEqual({ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });
});

test("dashboard keeps the compact operational hierarchy on tablet", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Tablet viewport check runs once");
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Portfolio summary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Needs attention/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Upcoming deadlines" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project health" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
});

test("unknown routes use the branded not-found surface", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByText("Closeout", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to dashboard" })).toBeVisible();
});

test("all approved internal placeholder routes are honest", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  test.skip(
    testInfo.project.name !== "chromium",
    "Full route census runs once; cross-browser smoke is separate"
  );
  for (const route of previewRoutes) {
    await page.goto(route);
    await expect(page.getByRole("button", { name: "Preview information" })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("cross-browser shell and project workspace smoke", async ({ page }) => {
  await page.goto("/projects/riverside-medical-office/requirements");
  await expect(page.getByRole("heading", { level: 1, name: "Requirements" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Project navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview information" })).toHaveCount(1);
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
    page.getByRole("heading", { level: 1, name: "Closeout component gallery" })
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /design/i })).toHaveCount(0);
});

test("@a11y command palette has no detectable violations", async ({ page, isMobile }) => {
  await page.goto("/dashboard");
  if (isMobile) await page.getByRole("button", { name: "Search", exact: true }).click();
  else await page.keyboard.press("Control+K");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(results.violations).toEqual([]);
});
