import { describe, expect, it } from "vitest";

import nextConfig, { securityHeaders } from "../../../next.config";

describe("security headers", () => {
  it("sets baseline security headers centrally while CSP remains request-scoped", async () => {
    const names = securityHeaders.map((header) => header.key);

    expect(names).not.toContain("Content-Security-Policy");
    expect(names).toContain("Strict-Transport-Security");
    expect(names).toContain("X-Content-Type-Options");
    expect(names).toContain("Referrer-Policy");
    expect(await nextConfig.headers?.()).toHaveLength(1);
  });
});
