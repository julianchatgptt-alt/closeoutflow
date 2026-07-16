import { describe, expect, it } from "vitest";

import { can } from "../index";

describe("authorization foundation", () => {
  it("denies every action until explicit Phase 4 policy exists", () => {
    expect(
      can({ type: "internal_user", id: "user-1" }, "project.read", {
        type: "project",
        id: "project-1",
        organizationId: "org-1"
      })
    ).toEqual({ allowed: false, reason: "policy_not_implemented" });
  });
});
