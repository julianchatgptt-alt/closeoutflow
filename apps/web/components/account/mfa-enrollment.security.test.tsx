import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("MFA QR rendering", () => {
  it("renders the Supabase data URI through an image and never injects HTML", () => {
    const source = readFileSync("apps/web/components/account/mfa-enrollment.tsx", "utf8");
    expect(source).toContain("<img");
    expect(source).toContain("src={enrollment.qrCode}");
    expect(source).not.toContain("dangerouslySetInnerHTML");
    expect(source).not.toContain("innerHTML");
  });
});
