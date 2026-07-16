import { describe, expect, it } from "vitest";

import nextConfig, { securityHeaders } from "../../../next.config";

describe("security headers", () => {
  it("sets CSP and baseline security headers centrally", async () => {
    const names = securityHeaders.map((header) => header.key);
    const csp = securityHeaders.find((header) => header.key === "Content-Security-Policy");

    expect(names).toContain("Content-Security-Policy");
    expect(names).toContain("Strict-Transport-Security");
    expect(names).toContain("X-Content-Type-Options");
    expect(names).toContain("Referrer-Policy");
    expect(csp?.value).toContain("frame-ancestors 'none'");
    expect(await nextConfig.headers?.()).toHaveLength(1);
  });
});
