import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("foundation smoke", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "CloseoutFlow is operational." })
  ).toBeVisible();
});

test("@a11y foundation has no automatically detectable violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("health endpoint is safe and receives centralized security headers", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = await response.text();

  expect(response.status()).toBe(200);
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(body).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  expect(body).not.toContain("service-role");
});
