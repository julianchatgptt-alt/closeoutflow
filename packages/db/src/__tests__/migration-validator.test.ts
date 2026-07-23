import { describe, expect, it } from "vitest";

import {
  approvedApplicationTables,
  validateApplicationTables
} from "../../../../scripts/validate-migrations.mjs";

describe("Phase 6 migration table allowlist", () => {
  it("accepts every approved Phase 4, Phase 5, and Phase 6 application table", () => {
    const sql = [...approvedApplicationTables]
      .map((table) => `create table public.${table} (id uuid);`)
      .join("\n");
    expect(validateApplicationTables(sql)).toEqual([]);
  });

  it("allowlists exactly the four approved Phase 6 requirement tables", () => {
    for (const table of [
      "requirement_categories",
      "requirement_templates",
      "requirement_template_items",
      "project_requirements"
    ]) {
      expect(approvedApplicationTables.has(table), table).toBe(true);
      expect(validateApplicationTables(`create table public.${table} (id uuid);`)).toEqual([]);
    }
  });

  it("rejects forbidden Phase 7 and later tables", () => {
    expect(validateApplicationTables("create table public.requirements (id uuid);")).toEqual([
      "Forbidden out-of-phase table found: requirements."
    ]);
    for (const table of ["submissions", "documents", "document_versions", "reviews", "packages"]) {
      expect(validateApplicationTables(`create table public.${table} (id uuid);`), table).toEqual([
        `Forbidden out-of-phase table found: ${table}.`
      ]);
    }
  });

  it("rejects unknown application tables", () => {
    expect(validateApplicationTables("create table public.project_widgets (id uuid);")).toEqual([
      "Unknown application table is not allowlisted: project_widgets."
    ]);
  });
});
