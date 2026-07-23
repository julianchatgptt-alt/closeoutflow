import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const seededProject = "/projects/50000000-0000-4000-8000-000000000001";
const register = `${seededProject}/requirements`;

test("the requirement register is real, grouped, and honest across browsers", async ({ page }) => {
  await page.goto(register);
  await expect(page.getByRole("heading", { level: 1, name: "Requirements" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview information" })).toHaveCount(0);
  await expect(page.getByLabel("Register summary")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "HVAC O&M Manual" }).filter({ visible: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText("From Medical Office Closeout v1").filter({ visible: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText("Company left project").filter({ visible: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText("Planned date passed").filter({ visible: true }).first()
  ).toBeVisible();
  const mainText = await page.locator("body").innerText();
  expect(mainText).not.toMatch(/not_applicable_approved|source_item_key|jsonb/i);
  expect(mainText).not.toMatch(/\b20\d{2}-\d{2}-\d{2}\b/);
});

test("register filters derive attention and never store assignment status", async ({ page }) => {
  await page.goto(`${register}?attention=1`);
  await expect(
    page.getByRole("link", { name: "Roofing Warranty" }).filter({ visible: true }).first()
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "HVAC O&M Manual" })).toHaveCount(0);
  await page.goto(`${register}?status=not_applicable`);
  await expect(
    page.getByRole("link", { name: "Certificate of Occupancy" }).filter({ visible: true }).first()
  ).toBeVisible();
  await expect(page.getByText("Not applicable").filter({ visible: true }).first()).toBeVisible();
});

test("requirement detail separates responsibility, dates, and lifecycle actions", async ({
  page
}) => {
  await page.goto(`${register}/d0000000-0000-4000-8000-000000000001`);
  await expect(page.getByRole("heading", { name: "HVAC O&M Manual" })).toBeVisible();
  await expect(
    page.getByText("Requests are sent when the subcontractor portal arrives")
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Responsibility" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Due date" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark not applicable" })).toBeVisible();
});

test("template library and builder are first-class surfaces", async ({ page }) => {
  await page.goto("/templates");
  await expect(
    page.getByRole("heading", { level: 1, name: "Requirement Templates" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview information" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Medical Office Closeout/ }).first()).toBeVisible();
  await expect(
    page.getByText("Verify every requirement against your contract documents").first()
  ).toBeVisible();
  await page.goto("/settings/templates");
  await expect(page).toHaveURL(/\/templates$/);
});

test("custom requirement fast-create lands in the correct category", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutation journey runs once");
  const title = `Fixture Custom Requirement ${Date.now()}`;
  await page.goto(`${register}?add=1`);
  await page.getByLabel("Requirement title").fill(title);
  await page.locator("#requirement-category").selectOption({ label: "Warranties" });
  await page.getByRole("button", { name: "Add requirement", exact: true }).click();
  await expect(page.locator('main [role="status"]').first()).toContainText("Requirement added");
  const warrantiesGroup = page
    .locator("tbody, section")
    .filter({ hasText: "Warranties" })
    .filter({ has: page.getByRole("link", { name: title }) })
    .first();
  await expect(
    warrantiesGroup.getByRole("link", { name: title }).filter({ visible: true }).first()
  ).toBeVisible();
  await expect(
    warrantiesGroup.getByText("Custom requirement").filter({ visible: true }).first()
  ).toBeVisible();
});

test("applying a template is idempotent and reports honest counts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutation journey runs once");
  await page.goto(`${register}/apply?template=b0000000-0000-4000-8000-000000000001`);
  await expect(page.getByText(/will be added/)).toBeVisible();
  await expect(page.getByText("Already in project").first()).toBeVisible();
  // Include the optional items so the re-apply preview is truly empty.
  const uncheckedItems = page.locator('input[name="itemKeys"]:not(:checked):not([disabled])');
  while ((await uncheckedItems.count()) > 0) {
    await uncheckedItems.first().check();
  }
  await page.getByRole("button", { name: /^Add \d+ requirement/ }).click();
  await expect(page).toHaveURL(/\/requirements\?message=/, { timeout: 15_000 });
  await expect(page.locator('main [role="status"]').first()).toContainText(
    /requirements? added|No new requirements added/
  );

  await page.goto(`${register}/apply?template=b0000000-0000-4000-8000-000000000001`);
  await expect(page.getByText(/0 requirements will be added/)).toBeVisible();
});

test("template creation, publishing, and immutability work end to end", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutation journey runs once");
  const name = `Fixture Standard ${Date.now()}`;
  await page.goto("/templates/new");
  await page.getByLabel("Template name").fill(name);
  await page.getByRole("button", { name: "Create template" }).click();
  await expect(page.locator('main [role="status"]').first()).toContainText("Template created");

  await page.getByLabel("Requirement title").fill("Fixture O&M Manual");
  await page.getByRole("button", { name: "Add requirement", exact: true }).click();
  await expect(page.locator('main [role="status"]').first()).toContainText("Requirement added");

  await page.getByRole("button", { name: "Publish template" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Publish template" }).click();
  await expect(page.locator('main [role="status"]').first()).toContainText("Template published");
  await expect(page.getByText(/v1 · Published/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Publish template" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit as new version" })).toBeVisible();
});

test("bulk selection applies one confirmed change to many requirements", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutation journey runs once");
  await page.goto(register);
  const checkboxes = page.getByRole("checkbox", { name: /^Select / });
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await page.getByLabel("Change selected").selectOption("set_priority");
  await page.locator("#bulk-priority").selectOption("high");
  await page.getByRole("button", { name: "Apply to selected" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Apply to selected" }).click();
  await expect(page.locator('main [role="status"]').first()).toContainText(
    /2 requirements updated/
  );
});

test("project overview shows real requirement configuration only", async ({ page }) => {
  await page.goto(seededProject);
  await expect(page.getByRole("heading", { name: "Closeout requirements" })).toBeVisible();
  await expect(page.getByText("Need setup attention")).toBeVisible();
  await expect(page.getByText("Setup progress").first()).toBeVisible();
  const overviewText = await page.locator("main").innerText();
  expect(overviewText).not.toMatch(/submitted|approved|rejected|readiness score|risk score/i);
  await expect(page.getByText("Add closeout requirements").first()).toBeVisible();
});

test("unassigned members cannot discover a project register and viewers stay read-only", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Identity switching runs once");
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("viewer@example.com");
  await page.getByLabel("Password").fill("Closeout-Test-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/);

  await page.goto(register);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("HVAC O&M Manual");

  await page.goto("/templates");
  await expect(page.getByRole("heading", { name: "Requirement Templates" })).toBeVisible();
  await expect(page.getByRole("link", { name: "New template" })).toHaveCount(0);
  await expect(page.getByText("editing is available to administrators")).toBeVisible();
});

test("assigned reviewer sees a read-only register without configuration controls", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Identity switching runs once");
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("reviewer@example.com");
  await page.getByLabel("Password").fill("Closeout-Test-2026!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/);

  await page.goto("/projects/50000000-0000-4000-8000-000000000002/requirements");
  await expect(page.getByRole("heading", { level: 1, name: "Requirements" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply template" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Add requirement" })).toHaveCount(0);
  await expect(page.getByText("Every closeout starts with the scope")).toBeVisible();
});

test("deferred document and review routes keep their honest previews", async ({ page }) => {
  for (const route of [`${seededProject}/documents`, `${seededProject}/reviews`]) {
    await page.goto(route);
    await expect(page.getByRole("button", { name: "Preview information" })).toHaveCount(1);
  }
});

for (const route of [register, "/templates"] as const) {
  test(`@a11y ${route} has no detectable violations in light and dark`, async ({ page }) => {
    for (const theme of ["light", "dark"] as const) {
      await page.addInitScript((value) => localStorage.setItem("cof-theme", value), theme);
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
  });
}

test("@a11y the apply-template flow has no detectable violations", async ({ page }) => {
  await page.goto(`${register}/apply?template=b0000000-0000-4000-8000-000000000001`);
  await expect(page.getByRole("heading", { name: "Apply template" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("the register keeps content inside the viewport on every profile", async ({ page }) => {
  await page.goto(register);
  await expect(page.getByRole("heading", { level: 1, name: "Requirements" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);
});
