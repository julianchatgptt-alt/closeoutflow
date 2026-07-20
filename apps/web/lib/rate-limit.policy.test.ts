import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("authentication mutation rate-limit coverage", () => {
  const sources = Object.fromEntries(
    ["auth", "invitations", "members", "organizations", "platform", "security"].map((name) => [
      name,
      readFileSync(`apps/web/actions/${name}.ts`, "utf8")
    ])
  );

  it.each([
    ["auth", "sign-in"],
    ["auth", "sign-up"],
    ["auth", "verification-resend"],
    ["auth", "password-reset"],
    ["auth", "password-reset-complete"],
    ["auth", "oauth-callback"],
    ["invitations", "invitation-accept"],
    ["members", "invitation-resend"],
    ["members", "membership-update"],
    ["members", "ownership-transfer"],
    ["members", "ownership-transfer-accept"],
    ["organizations", "invitation-create"],
    ["organizations", "organization-create"],
    ["organizations", "organization-sensitive"],
    ["platform", "ownership-transfer"],
    ["security", "mfa-attempt"],
    ["security", "mfa-enrollment"],
    ["security", "mfa-removal"],
    ["security", "recovery-code"],
    ["security", "session-revoke"],
    ["security", "account-recovery"]
  ])("%s actions invoke the %s limiter", (file, operation) => {
    expect(sources[file]).toContain(`rateLimitRequest("${operation}"`);
  });
});
