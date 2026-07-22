import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("logo founder review presents three equal non-selectable concepts", async ({ page }) => {
  await page.goto("/design");
  const review = page.getByTestId("logo-founder-review");
  await expect(
    review.getByRole("heading", { level: 2, name: "Closeout Logo Founder Review" })
  ).toBeVisible();
  await expect(review.getByTestId("logo-neutral-comparison").locator("article")).toHaveCount(3);
  await expect(review.getByTestId("all-favicon-previews")).toBeVisible();
  await expect(review.getByTestId("all-sidebar-previews")).toBeVisible();
  await expect(review.getByTestId("all-desktop-auth-previews")).toBeVisible();
  await expect(review.getByTestId("all-mobile-auth-previews")).toBeVisible();
  await expect(review.getByTestId("all-journey-previews")).toBeVisible();
  await expect(review.getByRole("button", { name: /select/i })).toHaveCount(0);
  await expect(page.getByText(/CloseoutFlow/)).toHaveCount(0);

  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(page.viewportSize()?.width ?? documentWidth);
});

test("@a11y logo founder review has no detectable violations in light and dark", async ({
  page
}) => {
  for (const theme of ["light", "dark"] as const) {
    await page.addInitScript((value) => localStorage.setItem("cof-theme", value), theme);
    await page.goto("/design");
    const results = await new AxeBuilder({ page })
      .include('[data-testid="logo-founder-review"]')
      .analyze();
    expect(results.violations).toEqual([]);
  }
});
