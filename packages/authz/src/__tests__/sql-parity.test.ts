import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { permissions, rolePermissions, roles, type OrgRole } from "../index";

function sqlPermissionMatrix() {
  const migration = readFileSync(
    path.join(process.cwd(), "supabase", "migrations", "0006_memberships_and_permissions.sql"),
    "utf8"
  );
  const functionBody =
    migration.match(/create or replace function public\.has_org_permission[\s\S]*?\$\$;/)?.[0] ??
    "";
  const matrix = new Map<string, string[]>();
  const branch = /when '([^']+)' then public\.has_org_role\([\s\S]*?array\[([^\]]+)\]\s*\)/g;
  for (const match of functionBody.matchAll(branch)) {
    const permission = match[1];
    const allowedRoles = [...(match[2]?.matchAll(/'([^']+)'/g) ?? [])].map((entry) => entry[1]!);
    if (permission) matrix.set(permission, allowedRoles.sort());
  }
  return matrix;
}

describe("TypeScript and SQL authorization parity", () => {
  it("cross-diffs every organization permission, role, and role mapping", () => {
    const sql = sqlPermissionMatrix();
    const organizationPermissions = Object.values(permissions)
      .filter((permission) => !permission.startsWith("platform."))
      .sort();
    expect([...sql.keys()].sort()).toEqual(organizationPermissions);

    const sqlRoles = new Set([...sql.values()].flat());
    expect([...sqlRoles].sort()).toEqual([...roles].sort());

    for (const permission of organizationPermissions) {
      const expectedRoles = roles
        .filter((role) => rolePermissions[role as OrgRole].includes(permission))
        .sort();
      expect(sql.get(permission)?.sort(), permission).toEqual(expectedRoles);
    }
  });
});
