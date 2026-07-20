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

  it("honors the validated log level", () => {
    const destination = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      }
    });
    const logger = createLogger({ level: "debug" }, destination);

    expect(logger.level).toBe("debug");
    expect(createLogger({}, destination).level).toBe("info");
  });

  it("deeply redacts credentials, headers, signed URLs, and sensitive bodies", () => {
    let output = "";
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      }
    });
    const logger = createLogger({}, destination);

    logger.info({
      req: {
        headers: {
          authorization: "Bearer secret",
          cookie: "session=secret",
          "set-cookie": "refresh=secret"
        },
        body: { password: "secret", document: "entire document payload" }
      },
      session: {
        access_token: "access-secret",
        refreshToken: "refresh-secret",
        secureLinkToken: "link-secret"
      },
      providers: {
        supabase: { service_role_key: "role-secret" },
        vendor: { apiKey: "api-secret" }
      },
      download: { signed_url: "https://example.invalid/file?token=secret" },
      upload: { fileContents: "binary-content" },
      safe: { project: "foundation" }
    });

    const event = JSON.parse(output) as Record<string, unknown>;
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain("Bearer secret");
    expect(serialized).not.toContain("session=secret");
    expect(serialized).not.toContain("entire document payload");
    expect(serialized).not.toContain("access-secret");
    expect(serialized).not.toContain("refresh-secret");
    expect(serialized).not.toContain("link-secret");
    expect(serialized).not.toContain("role-secret");
    expect(serialized).not.toContain("api-secret");
    expect(serialized).not.toContain("binary-content");
    expect(serialized).toContain("[Redacted]");
    expect(serialized).toContain("foundation");
  });

  it("uses a bounded incoming request id or creates one", () => {
    const trusted = "123e4567-e89b-42d3-a456-426614174000";
    expect(createRequestId(trusted)).toBe(trusted);
    expect(createRequestId("caller-controlled")).toMatch(/^[0-9a-f-]{36}$/);
    expect(createRequestId("caller-controlled")).not.toBe("caller-controlled");
    expect(createRequestId()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("keeps Sentry disabled when configuration is absent", () => {
    expect(initializeSentry({ enabled: false, environment: "test" })).toBe(false);
  });
});
