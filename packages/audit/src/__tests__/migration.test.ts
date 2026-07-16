import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("audit migration contract", () => {
  it("enables default-deny RLS and prevents update/delete", async () => {
    const migration = await readFile("supabase/migrations/0001_audit_foundation.sql", "utf8");

    expect(migration).toContain("enable row level security");
    expect(migration).toContain("force row level security");
    expect(migration).toContain("before update or delete");
    expect(migration).not.toContain("grant update");
    expect(migration).not.toContain("grant delete");
  });
});
