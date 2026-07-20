import { describe, expect, it } from "vitest";

import { getSafeRedirect } from "./safe-redirect";

describe("safe redirects", () => {
  it.each([
    "https://evil.example",
    "HTTP://evil.example",
    "//evil.example",
    "%2F%2Fevil.example",
    "/\\evil.example",
    "/%5Cevil.example",
    "javascript:alert(1)",
    "/auth/callback",
    "/unknown"
  ])("rejects unsafe destination %s", (candidate) => {
    expect(getSafeRedirect(candidate)).toBe("/dashboard");
  });

  it.each([
    ["/dashboard", "/dashboard"],
    ["/settings/team?tab=invitations", "/settings/team?tab=invitations"],
    ["/projects/example#activity", "/projects/example#activity"],
    ["/account/security", "/account/security"],
    ["/invite/opaque-token", "/invite/opaque-token"],
    ["/reset-password", "/reset-password"],
    ["/mfa/challenge?next=%2Fdashboard", "/mfa/challenge?next=/dashboard"],
    ["/reauthenticate?next=%2Faccount%2Fsecurity", "/reauthenticate?next=/account/security"],
    ["/select-organization", "/select-organization"]
  ])("allows known internal destination %s", (candidate, expected) => {
    expect(getSafeRedirect(candidate)).toBe(expected);
  });
});
