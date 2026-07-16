import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("foundation smoke uses the request CSP nonce on framework scripts", async ({ page }) => {
  const response = await page.goto("/");
  const csp = response?.headers()["content-security-policy"];
  const nonce = csp?.match(/'nonce-([^']+)'/)?.[1];

  await expect(
    page.getByRole("heading", { level: 1, name: "CloseoutFlow is operational." })
  ).toBeVisible();

  expect(csp).toContain("strict-dynamic");
  expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  expect(nonce).toBeTruthy();

  const html = await response?.text();
  const renderedScripts = html?.match(/<script\b[^>]*>/g) ?? [];
  expect(renderedScripts.length).toBeGreaterThan(0);
  expect(renderedScripts.every((script) => script.includes(`nonce="${nonce}"`))).toBe(true);
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
  const csp = response.headers()["content-security-policy"];

  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(body).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  expect(body).not.toContain("service-role");
});

test("CSP nonces differ across requests", async ({ request }) => {
  const first = await request.get("/");
  const second = await request.get("/");
  const firstNonce = first.headers()["content-security-policy"]?.match(/'nonce-([^']+)'/)?.[1];
  const secondNonce = second.headers()["content-security-policy"]?.match(/'nonce-([^']+)'/)?.[1];

  expect(firstNonce).toBeTruthy();
  expect(secondNonce).toBeTruthy();
  expect(firstNonce).not.toBe(secondNonce);
});
