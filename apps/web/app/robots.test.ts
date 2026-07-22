// @vitest-environment node

import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots policy", () => {
  it("keeps authentication and private application routes out of search indexes", () => {
    const value = robots();
    const rules = Array.isArray(value.rules) ? value.rules[0] : value.rules;
    const disallow = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

    expect(disallow).toEqual(
      expect.arrayContaining([
        "/account/",
        "/dashboard",
        "/invite/",
        "/onboarding",
        "/projects/",
        "/sign-in"
      ])
    );
    expect(value.host).toBe("https://closeoutflow.com");
  });
});
