import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outputRoot = process.env.PHASE6_CAPTURE_DIR;
const seededProject = "/projects/50000000-0000-4000-8000-000000000001";
const emptyProject = "/projects/50000000-0000-4000-8000-000000000002";
const register = `${seededProject}/requirements`;
const draftTemplate = "/templates/b0000000-0000-4000-8000-000000000002";
const publishedTemplate = "/templates/b0000000-0000-4000-8000-000000000001";

if (!outputRoot) throw new Error("PHASE6_CAPTURE_DIR is required");

const desktop = { width: 1440, height: 900 };
const tablet = { width: 834, height: 1112 };
const pixel = { width: 412, height: 915 };
const iphone = { width: 393, height: 852 };

async function prepare(
  page: Page,
  route: string,
  viewport: { width: number; height: number },
  theme: "light" | "dark" = "light"
) {
  await page.setViewportSize(viewport);
  await page.addInitScript((selectedTheme: string) => {
    localStorage.setItem("cof-theme", selectedTheme);
    localStorage.setItem("cof-sidebar", "expanded");
  }, theme);
  await page.goto(route, { waitUntil: "networkidle" });
  await page.evaluate((selectedTheme: string) => {
    document.documentElement.classList.toggle("dark", selectedTheme === "dark");
    document.documentElement.dataset.theme = selectedTheme;
    document.querySelectorAll("nextjs-portal").forEach((portal) => {
      (portal as HTMLElement).style.display = "none";
    });
  }, theme);
  await page.emulateMedia({ reducedMotion: "reduce" });
}

async function capture(page: Page, id: string, fullPage = true) {
  await mkdir(outputRoot!, { recursive: true });
  await page.screenshot({
    path: path.join(outputRoot!, `${id}.png`),
    fullPage,
    animations: "disabled"
  });
}

test("capture the deterministic Phase 6 visual evidence manifest", async ({ page }) => {
  test.setTimeout(600_000);

  // Requirement register — populated, light/dark, tablet, phones.
  await prepare(page, register, desktop);
  await capture(page, "register--desktop--light", false);
  await prepare(page, register, desktop, "dark");
  await capture(page, "register--desktop--dark", false);
  await prepare(page, register, tablet);
  await capture(page, "register--tablet--light", false);
  await prepare(page, register, pixel);
  await capture(page, "register--pixel--light");
  await prepare(page, register, iphone);
  await capture(page, "register--iphone--light");

  // Needs-attention filter and not-applicable views.
  await prepare(page, `${register}?attention=1`, desktop);
  await capture(page, "register--needs-attention--desktop--light", false);
  await prepare(page, `${register}?status=not_applicable`, desktop);
  await capture(page, "register--not-applicable--desktop--light", false);

  // Bulk-selection state.
  await prepare(page, register, desktop);
  const checkboxes = page.getByRole("checkbox", { name: /^Select / });
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await capture(page, "register--bulk-selected--desktop--light", false);

  // Long custom requirement title + custom create flow.
  await prepare(page, `${register}?add=1`, desktop);
  await capture(page, "register--add-requirement--desktop--light", false);
  const longTitle =
    "Complete Central Utility Plant Chilled Water System Operation and Maintenance Manual With Commissioning Appendices";
  await page.getByLabel("Requirement title").fill(longTitle);
  await page.getByRole("button", { name: "Add requirement", exact: true }).click();
  await expect(page.locator('main [role="status"]').first()).toContainText("Requirement added");
  await capture(page, "register--long-title--desktop--light", false);

  // Empty register (draft project without requirements).
  await prepare(page, `${emptyProject}/requirements`, desktop);
  await capture(page, "register--empty--desktop--light");
  await prepare(page, `${emptyProject}/requirements`, pixel);
  await capture(page, "register--empty--pixel--light");

  // Requirement detail: responsibility, dates, N/A confirmation, conflict recovery.
  const detail = `${register}/d0000000-0000-4000-8000-000000000001`;
  await prepare(page, detail, desktop);
  await capture(page, "requirement-detail--desktop--light");
  await prepare(page, detail, desktop, "dark");
  await capture(page, "requirement-detail--desktop--dark");
  await prepare(page, detail, iphone);
  await capture(page, "requirement-detail--iphone--light");

  await prepare(page, detail, desktop);
  await page.getByRole("button", { name: "Mark not applicable" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await capture(page, "requirement--not-applicable-confirm--desktop--light", false);
  await page.keyboard.press("Escape");

  const token = page.locator('input[name="updatedAt"]').first();
  await token.evaluate((input: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "2020-01-01T00:00:00.000Z");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.locator('main [role="alert"]')).toContainText("changed while you were editing");
  await capture(page, "requirement--stale-conflict--desktop--light", false);

  // Permission-safe not-found for an unknown requirement.
  await prepare(page, `${register}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`, desktop);
  await capture(page, "requirement--not-found--desktop--light", false);

  // Template library.
  await prepare(page, "/templates", desktop);
  await capture(page, "templates--desktop--light");
  await prepare(page, "/templates", desktop, "dark");
  await capture(page, "templates--desktop--dark");
  await prepare(page, "/templates", tablet);
  await capture(page, "templates--tablet--light");
  await prepare(page, "/templates", pixel);
  await capture(page, "templates--pixel--light");
  await prepare(page, "/templates?q=zzz-no-match", desktop);
  await capture(page, "templates--no-results--desktop--light", false);

  // Builder (draft) and published version chain.
  await prepare(page, draftTemplate, desktop);
  await capture(page, "template-builder--draft--desktop--light");
  await prepare(page, draftTemplate, desktop, "dark");
  await capture(page, "template-builder--draft--desktop--dark");
  await prepare(page, draftTemplate, tablet);
  await capture(page, "template-builder--draft--tablet--light");
  await prepare(page, publishedTemplate, desktop);
  await capture(page, "template--published-version-chain--desktop--light");

  // Apply-template flow: selection, preview, confirm.
  await prepare(page, `${register}/apply`, desktop);
  await capture(page, "apply-template--choose--desktop--light", false);
  const preview = `${register}/apply?template=b0000000-0000-4000-8000-000000000001`;
  await prepare(page, preview, desktop);
  await capture(page, "apply-template--preview--desktop--light");
  await prepare(page, preview, desktop, "dark");
  await capture(page, "apply-template--preview--desktop--dark");
  await prepare(page, preview, pixel);
  await capture(page, "apply-template--preview--pixel--light");
  await prepare(page, preview, iphone);
  await capture(page, "apply-template--preview--iphone--light");

  // Project overview integration.
  await prepare(page, seededProject, desktop);
  await capture(page, "overview--requirements-panel--desktop--light");
  await prepare(page, seededProject, desktop, "dark");
  await capture(page, "overview--requirements-panel--desktop--dark");
  await prepare(page, seededProject, pixel);
  await capture(page, "overview--requirements-panel--pixel--light");
});
