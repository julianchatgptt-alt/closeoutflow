import { describe, expect, it } from "vitest";

import { noopNotificationsAdapter } from "../index";

describe("notifications adapter", () => {
  it("provides a no-op multi-channel seam without sending", async () => {
    const result = await noopNotificationsAdapter.dispatch({
      channel: "email",
      recipientId: "recipient-1",
      category: "foundation",
      idempotencyKey: "notification-1",
      payload: {}
    });

    expect(result.status).toBe("skipped");
  });
});
