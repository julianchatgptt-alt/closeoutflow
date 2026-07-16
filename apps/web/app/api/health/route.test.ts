// @vitest-environment node

import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("health endpoint", () => {
  it("returns a safe local health response without requiring cloud credentials", async () => {
    const response = await GET(new Request("http://localhost/api/health"));
    const payload = (await response.json()) as Record<string, unknown>;
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(payload.status).toBe("ok");
    expect(serialized).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serialized).not.toContain("placeholder-server-only");
  });
});
