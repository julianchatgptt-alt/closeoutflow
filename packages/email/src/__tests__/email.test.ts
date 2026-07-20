import { describe, expect, it } from "vitest";

import { noopEmailAdapter, renderIdentityEmail } from "../index";

describe("email adapter", () => {
  it("has a development-safe no-send implementation", async () => {
    const result = await noopEmailAdapter.send({
      to: ["developer@example.com"],
      from: "noreply@example.com",
      subject: "Foundation",
      text: "No business email",
      idempotencyKey: "foundation-1"
    });

    expect(result).toEqual({ status: "skipped", providerMessageId: null });
  });

  it.each([
    "verify_email",
    "password_reset",
    "organization_invitation",
    "invitation_reminder",
    "email_changed",
    "password_changed",
    "mfa_changed",
    "ownership_transfer",
    "membership_changed",
    "security_alert"
  ] as const)("renders branded accessible HTML and text for %s", (kind) => {
    const message = renderIdentityEmail({
      kind,
      to: "person@example.com",
      actionUrl: "https://app.closeoutflow.com/account/security",
      ...(kind.includes("invitation") ? { expiresIn: "14 days" } : {}),
      idempotencyKey: `test-${kind}`
    });
    expect(message.subject).toContain("Closeout");
    expect(message.html).toContain('<html lang="en">');
    expect(message.html).toContain("closeoutflow.com");
    expect(message.text).toContain("Closeout");
    expect(message.text).not.toMatch(/password=|secret=|recovery_code=/i);
  });

  it("rejects non-Closeout action hosts", () => {
    expect(() =>
      renderIdentityEmail({
        kind: "password_reset",
        to: "person@example.com",
        actionUrl: "https://evil.example/reset",
        idempotencyKey: "unsafe"
      })
    ).toThrow("INVALID_EMAIL_ACTION_HOST");
  });
});
