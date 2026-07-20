import { expect, test as setup } from "@playwright/test";

const authFile = "playwright/.auth/owner.json";

setup("authenticate seeded organization owner", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByLabel("Password").fill("Closeout-Test-2026!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: authFile });
});
