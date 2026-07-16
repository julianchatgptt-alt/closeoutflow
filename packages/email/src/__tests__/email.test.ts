import { describe, expect, it } from "vitest";

import { noopEmailAdapter } from "../index";

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
});
