import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  permissions,
  projectRolePermissions,
  projectRoles,
  rolePermissions,
  roles,
  type OrgRole,
  type ProjectRole
} from "../index";

function sqlPermissionMatrix() {
  const migration = [
    "0006_memberships_and_permissions.sql",
    "0012_project_extensions_and_permissions.sql"
  ]
    .map((name) => readFileSync(path.join(process.cwd(), "supabase", "migrations", name), "utf8"))
    .join("\n");
  const bodies = [
    ...migration.matchAll(/create or replace function public\.has_org_permission[\s\S]*?\$\$;/g)
  ];
  const functionBody = bodies.at(-1)?.[0] ?? "";
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
    const projectScoped = new Set<string>([
      permissions.projectView,
      permissions.projectUpdate,
      permissions.projectArchive,
      permissions.projectRestore,
      permissions.projectManageTeam,
      permissions.projectManageCompanies,
      permissions.projectManageContacts
    ]);
    const organizationPermissions = Object.values(permissions)
      .filter((permission) => !permission.startsWith("platform.") && !projectScoped.has(permission))
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

  it("keeps the project-role matrix aligned with project_permission", () => {
    const migration = readFileSync(
      path.join(process.cwd(), "supabase", "migrations", "0013_projects_and_project_members.sql"),
      "utf8"
    );
    const functionBody =
      migration.match(/create or replace function public\.project_permission[\s\S]*?\$\$;/)?.[0] ??
      "";
    const matrix = new Map<string, string[]>();
    const branch = /when '([^']+)' then effective_role (?:in \(([^)]+)\)|= '([^']+)')/g;
    for (const match of functionBody.matchAll(branch)) {
      const allowed = match[2]
        ? [...match[2].matchAll(/'([^']+)'/g)].map((entry) => entry[1]!)
        : [match[3]!];
      matrix.set(match[1]!, allowed.sort());
    }

    const projectPermissions = [...new Set(Object.values(projectRolePermissions).flat())].sort();
    expect([...matrix.keys()].sort()).toEqual(projectPermissions);

    for (const permission of projectPermissions) {
      const expectedRoles = projectRoles
        .filter((role) => projectRolePermissions[role as ProjectRole].includes(permission))
        .sort();
      expect(matrix.get(permission)?.sort(), permission).toEqual(expectedRoles);
    }
  });
});
