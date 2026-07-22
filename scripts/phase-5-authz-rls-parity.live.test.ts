import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  can,
  permissions,
  projectRolePermissions,
  rolePermissions,
  roles,
  type OrgRole,
  type Permission,
  type ProjectRole
} from "../packages/authz/src/index";

const url = process.env.LOCAL_SUPABASE_URL;
const anonKey = process.env.LOCAL_SUPABASE_ANON_KEY;
const password = "Closeout-Test-2026!";
const organizationId = "30000000-0000-4000-8000-000000000001";
const projectOne = "50000000-0000-4000-8000-000000000001";
const projectTwo = "50000000-0000-4000-8000-000000000002";
const viewerMembership = "40000000-0000-4000-8000-000000000003";
const execFileAsync = promisify(execFile);
let viewerAssignmentId: string | null = null;

if (!url || !anonKey || !url.startsWith("http://127.0.0.1:")) {
  throw new Error("Live parity tests require the local Supabase harness.");
}

async function signIn(email: string) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const responseBody = await response.text();
  expect(response.ok, responseBody).toBe(true);
  const body = JSON.parse(responseBody) as { access_token: string };
  return body.access_token;
}

async function rest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const responseBody = await response.text();
  expect(response.ok, responseBody).toBe(true);
  return (responseBody ? JSON.parse(responseBody) : undefined) as T;
}

const organizationFixtures: Record<OrgRole, string> = {
  owner: "owner@example.com",
  administrator: "admin@example.com",
  project_manager: "pm@example.com",
  closeout_coordinator: "coordinator@example.com",
  internal_reviewer: "reviewer@example.com",
  viewer: "viewer@example.com"
};

const projectFixtures: Record<
  ProjectRole,
  { email: string; organizationRole: OrgRole; projectId: string }
> = {
  project_administrator: {
    email: "owner@example.com",
    organizationRole: "owner",
    projectId: projectOne
  },
  project_manager: {
    email: "pm@example.com",
    organizationRole: "project_manager",
    projectId: projectOne
  },
  closeout_coordinator: {
    email: "coordinator@example.com",
    organizationRole: "closeout_coordinator",
    projectId: projectOne
  },
  internal_reviewer: {
    email: "reviewer@example.com",
    organizationRole: "internal_reviewer",
    projectId: projectTwo
  },
  viewer: { email: "viewer@example.com", organizationRole: "viewer", projectId: projectOne }
};

const projectPermissions = [...new Set(Object.values(projectRolePermissions).flat())];
const projectPermissionSet = new Set<Permission>(projectPermissions);
const organizationPermissions = Object.values(permissions).filter(
  (permission) => !permission.startsWith("platform.") && !projectPermissionSet.has(permission)
);

function actor(role: OrgRole, projectRole?: ProjectRole) {
  return {
    type: "internal_user" as const,
    id: `live-${role}`,
    membership: { organizationId, role, status: "active" as const },
    accountStatus: "active" as const,
    organizationStatus: "active" as const,
    assuranceLevel: "aal2" as const,
    reauthenticated: true,
    ...(projectRole ? { projectAccess: true, projectRole } : {})
  };
}

beforeAll(async () => {
  const ownerToken = await signIn("owner@example.com");
  viewerAssignmentId = await rest<string>(ownerToken, "rpc/assign_project_member", {
    method: "POST",
    body: JSON.stringify({
      target_project_id: projectOne,
      target_membership_id: viewerMembership,
      target_project_role: "viewer",
      request_id: "phase-5d-live-parity"
    })
  });
});

afterAll(async () => {
  if (!viewerAssignmentId) return;
  const ownerToken = await signIn("owner@example.com");
  await rest(ownerToken, "rpc/remove_project_member", {
    method: "POST",
    body: JSON.stringify({
      target_project_member_id: viewerAssignmentId,
      request_id: "phase-5d-live-parity-cleanup"
    })
  });
});

describe("live TypeScript authorization and database parity", () => {
  it("cross-checks every organization role and permission against live SQL", async () => {
    for (const role of roles) {
      const token = await signIn(organizationFixtures[role]);
      for (const permission of organizationPermissions) {
        const sqlAllowed = await rest<boolean>(token, "rpc/has_org_permission", {
          method: "POST",
          body: JSON.stringify({ target_organization_id: organizationId, permission })
        });
        const tsAllowed = can(actor(role), permission, {
          type: "organization",
          id: organizationId,
          organizationId
        }).allowed;
        expect(sqlAllowed, `${role}: ${permission}`).toBe(tsAllowed);
        expect(
          sqlAllowed,
          `${rolePermissions[role].includes(permission)}: ${role}: ${permission}`
        ).toBe(rolePermissions[role].includes(permission));
      }
    }
  });

  it("cross-checks every project role and permission plus an RLS read", async () => {
    for (const [projectRole, fixture] of Object.entries(projectFixtures) as Array<
      [ProjectRole, (typeof projectFixtures)[ProjectRole]]
    >) {
      const token = await signIn(fixture.email);
      for (const permission of projectPermissions) {
        const sqlAllowed = await rest<boolean>(token, "rpc/project_permission", {
          method: "POST",
          body: JSON.stringify({ target_project_id: fixture.projectId, permission })
        });
        const tsAllowed = can(actor(fixture.organizationRole, projectRole), permission, {
          type: "project",
          id: fixture.projectId,
          projectId: fixture.projectId,
          organizationId,
          projectStatus: "active"
        }).allowed;
        expect(sqlAllowed, `${projectRole}: ${permission}`).toBe(tsAllowed);
      }

      const visible = await rest<Array<{ id: string }>>(
        token,
        `projects?id=eq.${fixture.projectId}&select=id`
      );
      expect(visible.map((project) => project.id)).toEqual([fixture.projectId]);
    }
  });

  it("matches owner/admin all-project and assigned-only RLS behavior", async () => {
    for (const email of ["owner@example.com", "admin@example.com"]) {
      const token = await signIn(email);
      const projects = await rest<Array<{ id: string }>>(token, "projects?select=id");
      expect(projects).toHaveLength(3);
    }

    const managerToken = await signIn("pm@example.com");
    const assigned = await rest<Array<{ id: string }>>(managerToken, "projects?select=id");
    expect(assigned.map((project) => project.id)).toEqual([projectOne]);
  });

  it("matches suspended, unknown, archived, and removed-assignment denial behavior", async () => {
    const suspendedToken = await signIn("suspended@example.com");
    expect(
      await rest<boolean>(suspendedToken, "rpc/project_permission", {
        method: "POST",
        body: JSON.stringify({ target_project_id: projectOne, permission: permissions.projectView })
      })
    ).toBe(false);
    expect(await rest<Array<{ id: string }>>(suspendedToken, "projects?select=id")).toEqual([]);
    expect(
      can(
        {
          ...actor("internal_reviewer", "internal_reviewer"),
          membership: {
            organizationId,
            role: "internal_reviewer",
            status: "suspended"
          }
        },
        permissions.projectView,
        {
          type: "project",
          id: projectOne,
          projectId: projectOne,
          organizationId,
          projectStatus: "active"
        }
      ).allowed
    ).toBe(false);

    const ownerToken = await signIn("owner@example.com");
    expect(
      await rest<boolean>(ownerToken, "rpc/project_permission", {
        method: "POST",
        body: JSON.stringify({ target_project_id: projectOne, permission: "project.unknown" })
      })
    ).toBe(false);
    expect(
      can(actor("owner"), "project.unknown", {
        type: "project",
        id: projectOne,
        projectId: projectOne,
        organizationId,
        projectStatus: "active"
      }).allowed
    ).toBe(false);

    const archivedProject = "50000000-0000-4000-8000-000000000003";
    const [archived] = await rest<Array<{ updated_at: string }>>(
      ownerToken,
      `projects?id=eq.${archivedProject}&select=updated_at`
    );
    const archivedResponse = await fetch(`${url}/rest/v1/rpc/update_project`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${ownerToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        target_project_id: archivedProject,
        expected_updated_at: archived?.updated_at,
        project_data: { city: "Durham" },
        request_id: "phase-5d-archived-denial"
      })
    });
    expect(archivedResponse.ok).toBe(false);
    expect(await archivedResponse.text()).toContain("archived projects are read only");
    expect(
      can(actor("owner"), permissions.projectUpdate, {
        type: "project",
        id: archivedProject,
        projectId: archivedProject,
        organizationId,
        projectStatus: "archived"
      }).allowed
    ).toBe(false);

    await rest(ownerToken, "rpc/remove_project_member", {
      method: "POST",
      body: JSON.stringify({
        target_project_member_id: viewerAssignmentId,
        request_id: "phase-5d-removed-assignment"
      })
    });
    const viewerToken = await signIn("viewer@example.com");
    expect(
      await rest<boolean>(viewerToken, "rpc/project_permission", {
        method: "POST",
        body: JSON.stringify({ target_project_id: projectOne, permission: permissions.projectView })
      })
    ).toBe(false);
    expect(await rest<Array<{ id: string }>>(viewerToken, "projects?select=id")).toEqual([]);
  });

  it("allows exactly one of two concurrent project updates with the same version", async () => {
    const token = await signIn("owner@example.com");
    const [project] = await rest<Array<{ updated_at: string }>>(
      token,
      `projects?id=eq.${projectTwo}&select=updated_at`
    );
    expect(project?.updated_at).toBeTruthy();

    const update = (city: string, requestId: string) => {
      const sql = `begin; set local role authenticated; select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true); select public.update_project('${projectTwo}','${project?.updated_at}'::timestamptz,'{"city":"${city}"}'::jsonb,'${requestId}'); commit;`;
      return execFileAsync("docker", [
        "exec",
        "supabase_db_closeoutflow",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        sql
      ]);
    };

    const results = await Promise.allSettled([
      update("Raleigh", "95000000-0000-4000-8000-000000000001"),
      update("Greensboro", "95000000-0000-4000-8000-000000000002")
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );
    expect(String(rejected?.reason?.stderr ?? rejected?.reason)).toContain(
      "project was updated by another user"
    );
  });
});
