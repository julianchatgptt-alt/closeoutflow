import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outputRoot = process.env.PHASE5E_LOGO_CAPTURE_DIR;

if (!outputRoot) throw new Error("PHASE5E_LOGO_CAPTURE_DIR is required");

async function prepare(page: Page, theme: "light" | "dark" = "light") {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript((selectedTheme: string) => {
    localStorage.setItem("cof-theme", selectedTheme);
  }, theme);
  await page.goto("/design");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(async (selectedTheme: string) => {
    document.documentElement.classList.toggle("dark", selectedTheme === "dark");
    document.documentElement.dataset.theme = selectedTheme;
    document.querySelectorAll("nextjs-portal").forEach((portal) => {
      (portal as HTMLElement).style.display = "none";
    });
    document.querySelectorAll(".cof-toast").forEach((toast) => {
      (toast as HTMLElement).style.display = "none";
    });
    await document.fonts.ready;
  }, theme);
}

async function capture(locator: Locator, id: string) {
  await mkdir(outputRoot!, { recursive: true });
  await locator.evaluate(() => {
    document.querySelectorAll(".cof-toast").forEach((toast) => {
      (toast as HTMLElement).style.display = "none";
    });
  });
  await locator.screenshot({
    animations: "disabled",
    path: path.join(outputRoot!, `${id}.png`)
  });
}

test("capture the Phase 5E-B1 founder review packet", async ({ page }) => {
  await prepare(page);
  await expect(page.getByTestId("logo-founder-review")).toBeVisible();
  await capture(page.getByTestId("logo-review-comparison"), "logo-comparison--desktop--light");

  await prepare(page, "dark");
  await capture(page.getByTestId("logo-review-comparison"), "logo-comparison--desktop--dark");

  await prepare(page);
  await capture(page.getByTestId("concept-a-detail"), "concept-a--sealed-packet--detail");
  await capture(page.getByTestId("concept-b-detail"), "concept-b--closeout-check--detail");
  await capture(page.getByTestId("concept-c-detail"), "concept-c--keystone-fold--detail");
  await capture(page.getByTestId("all-favicon-previews"), "all-concepts--favicon-previews");
  await capture(page.getByTestId("all-sidebar-previews"), "all-concepts--sidebar-previews");
  await capture(
    page.getByTestId("all-desktop-auth-previews"),
    "all-concepts--desktop-auth-previews"
  );
  await capture(page.getByTestId("all-mobile-auth-previews"), "all-concepts--mobile-auth-previews");
  await capture(
    page.getByTestId("all-journey-previews"),
    "all-concepts--invitation-onboarding-previews"
  );
});
