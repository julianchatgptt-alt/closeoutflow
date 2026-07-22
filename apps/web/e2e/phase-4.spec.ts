import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext } from "@playwright/test";

async function getMailpitActionUrl(
  request: APIRequestContext,
  email: string,
  subject: RegExp
): Promise<string> {
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`
        );
        if (!response.ok()) return null;
        const result = (await response.json()) as {
          messages?: { ID: string; Subject?: string }[];
        };
        return result.messages?.find((message) => subject.test(message.Subject ?? ""))?.ID ?? null;
      },
      { timeout: 10_000 }
    )
    .not.toBeNull();

  const search = await request.get(
    `http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`
  );
  const result = (await search.json()) as {
    messages?: { ID: string; Subject?: string }[];
  };
  const messageId = result.messages?.find((message) => subject.test(message.Subject ?? ""))?.ID;
  expect(messageId).toBeTruthy();
  const messageResponse = await request.get(`http://127.0.0.1:54324/api/v1/message/${messageId}`);
  const message = (await messageResponse.json()) as { Text?: string; HTML?: string };
  const actionUrl = (
    message.HTML?.match(/href="(https?:\/\/[^"]+)"/)?.[1] ??
    message.Text?.match(/\(\s*(https?:\/\/[^)\s]+)\s*\)/)?.[1]
  )?.replaceAll("&amp;", "&");
  expect(actionUrl).toBeTruthy();
  return actionUrl!;
}

test("unauthenticated protected navigation redirects server-side", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard|\/sign-in\?next=\/dashboard/);
  await context.close();
});

test("authentication routes use Closeout branding and safe generic states", async ({ page }) => {
  await page.goto("/sign-in?next=https://evil.example");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(
    page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Sign in", exact: true }) })
      .locator('input[name="next"]')
  ).toHaveValue("/dashboard");
  await expect(page.getByRole("link", { name: "Closeout home" })).toBeVisible();
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: /Reset/ })).toBeVisible();
});

test("new user verifies email, signs out, resets password, and signs back in", async ({
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Stateful local email flow runs once");
  const email = `phase4-auth-${Date.now()}@example.com`;
  const initialPassword = "Closeout-Initial-2026!";
  const replacementPassword = "Closeout-Replaced-2026!";
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();

  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill("Phase Four User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(initialPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email/);

  const verificationUrl = await getMailpitActionUrl(request, email, /confirm/i);
  await page.goto(verificationUrl);
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.goto("/verify-email");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page).toHaveURL(/\/forgot-password\?sent=1/);

  const resetUrl = await getMailpitActionUrl(request, email, /reset/i);
  await page.goto(resetUrl);
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel("New password").fill(replacementPassword);
  await page.getByLabel("Confirm password").fill(replacementPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/\/sign-in\?message=/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(replacementPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await context.close();
});

test("seeded owner can switch organizations through a server-validated action", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Stateful organization flow runs once");
  await page.goto("/select-organization");
  await expect(page.getByText("Sample Construction Co.")).toBeVisible();
  await expect(page.getByText("Riverside Builders")).toBeVisible();
  const riverside = page.getByRole("button", { name: "Open" }).nth(1);
  await riverside.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("button", { name: /Switch organization/ })).toHaveAttribute(
    "title",
    "Riverside Builders"
  );
  await page.goto("/select-organization");
  await page.getByRole("button", { name: "Open" }).first().click();
});

test("team and organization settings use real Phase 4 data", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Data assertions run once");
  await page.goto("/settings/team");
  await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
  await expect(page.getByText("Olivia Owner")).toBeVisible();
  await expect(page.getByRole("table").getByText("Amir Admin")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send invitation" })).toBeVisible();
  await page.goto("/settings/organization");
  await expect(page.getByRole("textbox", { name: "Display name" })).toHaveValue(
    "Sample Construction Co."
  );
  await expect(page.getByRole("button", { name: "Save organization" })).toBeVisible();
});

test("existing user receives and accepts a hashed organization invitation", async ({
  page,
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Stateful invitation flow runs once");
  await page.goto("/settings/team");
  await page.getByLabel("Email address").fill("owner-b@example.com");
  await page.getByLabel("Role", { exact: true }).selectOption("viewer");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page).toHaveURL(/message=Invitation(?:%20|\+)created/);

  const searchResponse = await request.get(
    "http://127.0.0.1:54324/api/v1/search?query=to%3Aowner-b%40example.com"
  );
  expect(searchResponse.ok()).toBe(true);
  const search = (await searchResponse.json()) as { messages?: { ID: string }[] };
  const messageId = search.messages?.[0]?.ID;
  expect(messageId).toBeTruthy();
  const messageResponse = await request.get(`http://127.0.0.1:54324/api/v1/message/${messageId}`);
  const message = (await messageResponse.json()) as { Text?: string; HTML?: string };
  const invitePath = `${message.Text ?? ""}${message.HTML ?? ""}`.match(
    /\/invite\/[A-Za-z0-9_-]{32,}/
  )?.[0];
  expect(invitePath).toBeTruthy();

  const inviteeContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const invitee = await inviteeContext.newPage();
  await invitee.goto("/sign-in");
  await invitee.getByLabel("Email").fill("owner-b@example.com");
  await invitee.getByLabel("Password").fill("Closeout-Test-2026!");
  await invitee.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(invitee).toHaveURL(/\/dashboard$/);
  await invitee.goto(invitePath!);
  await expect(invitee.getByText("Organization administrator", { exact: true })).toBeVisible();
  await invitee.getByRole("button", { name: "Accept invitation" }).click();
  await expect(invitee).toHaveURL(/\/dashboard$/);
  await invitee.goto("/select-organization");
  await expect(invitee.getByText("Sample Construction Co.")).toBeVisible();
  await inviteeContext.close();
});

test("new user preserves invitation continuation through sign-up and verification", async ({
  page,
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Stateful new-user invitation flow runs once");
  const email = `phase4-invite-${Date.now()}@example.com`;

  await page.goto("/settings/team");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Role", { exact: true }).selectOption("internal_reviewer");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page).toHaveURL(/message=Invitation(?:%20|\+)created/);
  const inviteUrl = await getMailpitActionUrl(request, email, /invited/i);

  const inviteeContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const invitee = await inviteeContext.newPage();
  await invitee.goto(inviteUrl);
  await expect(invitee.getByRole("heading", { name: /Join Sample Construction/ })).toBeVisible();
  await invitee.getByRole("link", { name: "Create an account" }).click();
  await expect(invitee.getByLabel("Email")).toHaveValue("");
  await expect(invitee.getByLabel("Email")).not.toHaveAttribute("readonly", "");
  await invitee.getByLabel("Email").fill(email);
  await invitee.getByLabel("Your name").fill("Invited New User");
  await invitee.getByLabel("Password").fill("Closeout-Invited-2026!");
  await invitee.getByRole("button", { name: "Create account" }).click();
  await expect(invitee).toHaveURL(/\/verify-email/);

  const verificationUrl = await getMailpitActionUrl(request, email, /confirm/i);
  await invitee.goto(verificationUrl);
  await expect(invitee).toHaveURL(/\/invite\//);
  await invitee.getByRole("button", { name: "Accept invitation" }).click();
  await expect(invitee).toHaveURL(/\/dashboard$/);
  await invitee.goto("/select-organization");
  await expect(invitee.getByText("Sample Construction Co.")).toBeVisible();
  await inviteeContext.close();
});

test("profile and preference screens load persisted identity data", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Account data assertions run once");
  await page.goto("/account/profile");
  await expect(page.getByRole("textbox", { name: "Display name" })).toHaveValue("Olivia Owner");
  await page.goto("/account/preferences");
  await expect(page.getByRole("heading", { name: "Preferences" })).toBeVisible();
});

for (const route of [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/account/security",
  "/account/sessions",
  "/onboarding",
  "/select-organization",
  "/settings/team",
  "/settings/organization"
] as const) {
  test(`@a11y Phase 4 route ${route} has no detectable violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("cross-browser authentication and protected shell smoke", async ({ page }) => {
  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
