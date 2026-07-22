import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Phase 5E public authentication applies final branding without placeholder OAuth", async ({
  page
}) => {
  await page.goto("/sign-in");

  await expect(page.getByRole("img", { name: "Closeout" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
  await expect(page.getByText(/not configured/i)).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  await expect(page.locator('link[rel="icon"]')).not.toHaveCount(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("Phase 5E signup, recovery, verification, and invitation error states retain the auth shell", async ({
  page
}) => {
  for (const [route, heading] of [
    ["/sign-up", "Create your account"],
    ["/forgot-password", "Reset your password"],
    ["/reset-password?error=This%20link%20has%20expired", "Choose a new password"],
    ["/verify-email", "Check your inbox"],
    ["/invite/not-a-real-token", "Invitation unavailable"]
  ] as const) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("img", { name: "Closeout" }).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  }
});

test("@a11y Phase 5E sign-in is accessible in light and dark themes", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    await page.addInitScript((value) => localStorage.setItem("cof-theme", value), theme);
    await page.goto("/sign-in");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});
