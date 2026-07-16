import { describe, expect, it } from "vitest";

import { noopSearchAdapter } from "../index";

describe("search adapter", () => {
  it("requires an explicit organization scope and returns no local results", async () => {
    const results = await noopSearchAdapter.search({
      text: "manual",
      scope: { organizationId: "org-1", actorId: "user-1" },
      limit: 10
    });

    expect(results).toEqual([]);
  });
});
