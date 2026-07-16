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

  it("adds append-only truncate protection and removes the audit schema from PostgREST", async () => {
    const remediation = await readFile(
      "supabase/migrations/0002_phase_2d_audit_hardening.sql",
      "utf8"
    );
    const config = await readFile("supabase/config.toml", "utf8");

    expect(remediation).toContain("before truncate on audit.audit_events");
    expect(remediation).toContain("security definer");
    expect(remediation).toContain("grant execute on function public.write_audit_event");
    expect(config).toContain('schemas = ["public", "graphql_public"]');
    expect(config).not.toMatch(/^schemas\s*=.*audit/m);
  });
});
