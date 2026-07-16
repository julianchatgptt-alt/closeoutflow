import { describe, expect, it } from "vitest";

import { foundationJobEvent, localJobsAdapter } from "../index";

describe("jobs adapter", () => {
  it("accepts the local no-op event with an idempotency key", async () => {
    const result = await localJobsAdapter.enqueue({
      eventName: foundationJobEvent,
      payload: { health: true },
      idempotencyKey: "noop-1",
      correlationId: "request-1"
    });

    expect(result).toEqual({
      accepted: true,
      jobId: "local:noop-1",
      eventName: foundationJobEvent
    });
  });
});
