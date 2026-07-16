import { readFile } from "node:fs/promises";

describe("root route", () => {
  it("redirects into the approved internal dashboard preview", async () => {
    const source = await readFile("apps/web/app/(marketing)/page.tsx", "utf8");
    expect(source).toContain('redirect("/dashboard")');
  });
});
