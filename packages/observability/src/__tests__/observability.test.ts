import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";

import { createLogger, createRequestId, initializeSentry } from "../index";

describe("observability foundation", () => {
  it("emits structured JSON and redacts sensitive fields", () => {
    let output = "";
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      }
    });
    const logger = createLogger({ requestId: "request-1", source: "web" }, destination);

    logger.info({ token: "secret", safe: "value" }, "test");

    const event = JSON.parse(output) as Record<string, unknown>;
    expect(event.request_id).toBe("request-1");
    expect(event.token).toBe("[Redacted]");
    expect(event.safe).toBe("value");
  });

  it("uses a bounded incoming request id or creates one", () => {
    expect(createRequestId("trace-1")).toBe("trace-1");
    expect(createRequestId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("keeps Sentry disabled when configuration is absent", () => {
    expect(initializeSentry({ enabled: false, environment: "test" })).toBe(false);
  });
});
