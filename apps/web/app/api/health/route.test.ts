// @vitest-environment node

import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";

import { checkDatabaseReachability, GET, type DatabaseHealthClient } from "./route";

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

  it("uses only the read-only health RPC and never writes an audit event", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const client = { rpc } as DatabaseHealthClient;

    await expect(checkDatabaseReachability(client)).resolves.toBe(true);
    await expect(checkDatabaseReachability(client)).resolves.toBe(true);

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenNthCalledWith(1, "database_health_check");
    expect(rpc).toHaveBeenNthCalledWith(2, "database_health_check");

    const source = await readFile("apps/web/app/api/health/route.ts", "utf8");
    expect(source).not.toContain("@closeoutflow/audit");
    expect(source).not.toContain("writeAuditEvent");
  });
});
