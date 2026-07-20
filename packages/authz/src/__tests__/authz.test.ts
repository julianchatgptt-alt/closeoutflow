import { describe, expect, it } from "vitest";

import {
  can,
  permissions,
  projectRolePermissions,
  projectRoles,
  rolePermissions,
  roles,
  type OrgRole,
  type Permission,
  type ProjectRole
} from "../index";

const resource = { type: "organization", id: "org-a", organizationId: "org-a" };

function actor(role: OrgRole) {
  return {
    type: "internal_user" as const,
    id: "user-1",
    membership: { organizationId: "org-a", role, status: "active" as const },
    accountStatus: "active" as const,
    organizationStatus: "active" as const,
    assuranceLevel: "aal2" as const,
    reauthenticated: true
  };
}

function projectActor(role: OrgRole, projectRole?: ProjectRole) {
  return {
    ...actor(role),
    ...(projectRole ? { projectAccess: true, projectRole } : {})
  };
}

const projectResource = {
  type: "project",
  id: "project-a",
  projectId: "project-a",
  organizationId: "org-a",
  projectStatus: "active"
};

describe("Phase 4 authorization policy", () => {
  it("matches the complete declared role-permission matrix", () => {
    for (const role of roles) {
      for (const permission of Object.values(permissions)) {
        if (permission.startsWith("platform.")) continue;
        const expected = rolePermissions[role].includes(permission as Permission);
        expect(can(actor(role), permission, resource).allowed, `${role}: ${permission}`).toBe(
          expected
        );
      }
    }
  });

  it("denies unknown roles, permissions, organizations, and inactive memberships", () => {
    expect(can(actor("owner"), "project.read", resource)).toEqual({
      allowed: false,
      reason: "unknown_permission"
    });
    expect(
      can(
        { ...actor("owner"), membership: { ...actor("owner").membership, role: "forged" } },
        permissions.organizationView,
        resource
      )
    ).toEqual({ allowed: false, reason: "unknown_role" });
    expect(
      can(actor("owner"), permissions.organizationView, {
        ...resource,
        organizationId: "org-b"
      })
    ).toEqual({ allowed: false, reason: "organization_mismatch" });
    expect(
      can(
        { ...actor("viewer"), membership: { ...actor("viewer").membership, status: "suspended" } },
        permissions.organizationView,
        resource
      )
    ).toEqual({ allowed: false, reason: "membership_inactive" });
  });

  it("does not accept forged metadata or a platform role as tenant access", () => {
    expect(
      can(
        {
          type: "platform_admin",
          id: "platform-user",
          platformRole: "platform_admin",
          assuranceLevel: "aal2"
        },
        permissions.organizationView,
        resource
      )
    ).toEqual({ allowed: false, reason: "permission_denied" });
  });

  it("matches the complete project-role permission matrix", () => {
    const projectPermissions = [
      permissions.projectView,
      permissions.projectUpdate,
      permissions.projectArchive,
      permissions.projectRestore,
      permissions.projectManageTeam,
      permissions.projectManageCompanies,
      permissions.projectManageContacts
    ];

    for (const projectRole of projectRoles) {
      for (const permission of projectPermissions) {
        expect(
          can(projectActor("project_manager", projectRole), permission, projectResource).allowed,
          `${projectRole}: ${permission}`
        ).toBe(projectRolePermissions[projectRole].includes(permission));
      }
    }
  });

  it("requires assignment for non-admin project access and grants owner/admin implicit access", () => {
    expect(can(projectActor("project_manager"), permissions.projectView, projectResource)).toEqual({
      allowed: false,
      reason: "permission_denied"
    });
    expect(can(projectActor("viewer", "viewer"), permissions.projectView, projectResource)).toEqual(
      {
        allowed: true
      }
    );
    expect(can(projectActor("owner"), permissions.projectArchive, projectResource)).toEqual({
      allowed: true
    });
    expect(
      can(projectActor("administrator"), permissions.projectManageTeam, projectResource)
    ).toEqual({
      allowed: true
    });
  });

  it("keeps archived projects read-only except for authorized restore", () => {
    const archived = { ...projectResource, projectStatus: "archived" };
    expect(
      can(projectActor("project_manager", "project_manager"), permissions.projectUpdate, archived)
    ).toEqual({ allowed: false, reason: "permission_denied" });
    expect(can(projectActor("owner"), permissions.projectRestore, archived)).toEqual({
      allowed: true
    });
  });

  it("requires reauthentication and AAL2 for ownership transfer", () => {
    expect(
      can(
        { ...actor("owner"), reauthenticated: false },
        permissions.organizationTransferOwnership,
        resource
      )
    ).toEqual({ allowed: false, reason: "reauthentication_required" });
    expect(
      can(
        { ...actor("owner"), assuranceLevel: "aal1" },
        permissions.organizationTransferOwnership,
        resource
      )
    ).toEqual({ allowed: false, reason: "mfa_required" });
  });

  it("prevents the sole owner from leaving", () => {
    expect(
      can(actor("owner"), permissions.membershipLeave, { ...resource, soleOwner: true })
    ).toEqual({ allowed: false, reason: "last_owner" });
  });
});
