// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy, createCspNonce, proxy } from "./proxy";

describe("nonce-based content security policy", () => {
  it("creates a distinct cryptographically random nonce per request", () => {
    const first = createCspNonce();
    const second = createCspNonce();

    expect(first).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(second).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(first).not.toBe(second);
  });

  it("uses nonce-based scripts without production inline or eval fallbacks", () => {
    const csp = createContentSecurityPolicy("test-nonce", "production");

    expect(csp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("does not upgrade the HTTP origin used by local and test browser harnesses", () => {
    const csp = createContentSecurityPolicy("test-nonce", "test");

    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(csp).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
  });

  it("forwards the nonce and CSP into the rendering request and response", async () => {
    const response = await proxy(
      new NextRequest("http://localhost/", {
        headers: {
          "x-request-id": "caller-controlled",
          "x-closeout-request-id": "caller-controlled"
        }
      })
    );
    const csp = response.headers.get("content-security-policy");
    const forwardedCsp = response.headers.get("x-middleware-request-content-security-policy");
    const forwardedNonce = response.headers.get("x-middleware-request-x-nonce");

    expect(csp).toMatch(/'nonce-[A-Za-z0-9+/]{22}=='/);
    expect(forwardedCsp).toBe(csp);
    expect(csp).toContain(`'nonce-${forwardedNonce}'`);
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get("x-request-id")).not.toBe("caller-controlled");
    expect(response.headers.get("x-middleware-request-x-closeout-request-id")).toBe(
      response.headers.get("x-request-id")
    );
  });
});
