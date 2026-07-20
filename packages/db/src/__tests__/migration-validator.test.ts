import { describe, expect, it } from "vitest";

import {
  approvedApplicationTables,
  validateApplicationTables
} from "../../../../scripts/validate-migrations.mjs";

describe("Phase 5 migration table allowlist", () => {
  it("accepts every approved Phase 4 and Phase 5 application table", () => {
    const sql = [...approvedApplicationTables]
      .map((table) => `create table public.${table} (id uuid);`)
      .join("\n");
    expect(validateApplicationTables(sql)).toEqual([]);
  });

  it("rejects forbidden Phase 6 and later tables", () => {
    expect(validateApplicationTables("create table public.requirements (id uuid);")).toEqual([
      "Forbidden out-of-phase table found: requirements."
    ]);
  });

  it("rejects unknown application tables", () => {
    expect(validateApplicationTables("create table public.project_widgets (id uuid);")).toEqual([
      "Unknown application table is not allowlisted: project_widgets."
    ]);
  });
});
