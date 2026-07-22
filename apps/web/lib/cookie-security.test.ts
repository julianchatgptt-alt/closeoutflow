import { describe, expect, it } from "vitest";

import { shouldUseSecureCookies } from "./cookie-security";

describe("secure cookie runtime selection", () => {
  it.each(["production", "staging", "preview"])(
    "uses secure cookies for %s production runtimes",
    (appEnvironment) => {
      expect(shouldUseSecureCookies(appEnvironment, "production")).toBe(true);
    }
  );

  it.each(["local", "test"])(
    "allows the HTTP %s harness to retain organization context",
    (appEnvironment) => {
      expect(shouldUseSecureCookies(appEnvironment, "production")).toBe(false);
    }
  );

  it("does not mark development cookies secure", () => {
    expect(shouldUseSecureCookies("local", "development")).toBe(false);
  });
});
