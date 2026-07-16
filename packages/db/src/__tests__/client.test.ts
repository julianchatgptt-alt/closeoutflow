import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { createAnonClient } from "../index";

describe("database client boundaries", () => {
  it("creates an unprivileged typed client without a service credential", () => {
    const client = createAnonClient({
      url: "http://127.0.0.1:54321",
      anonKey: "local-public-anon-key"
    });

    expect(client).toBeDefined();
    expect("serviceRoleKey" in client).toBe(false);
  });

  it("protects the privileged entry with the server-only marker", async () => {
    const source = await readFile("packages/db/src/server.ts", "utf8");
    const packageDefinition = await readFile("packages/db/package.json", "utf8");

    expect(source).toContain('import "server-only"');
    expect(packageDefinition).toContain('"./server"');
    expect(packageDefinition).not.toContain('"./client"');
  });
});
