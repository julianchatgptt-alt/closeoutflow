export const roles = [
  "owner",
  "administrator",
  "project_manager",
  "closeout_coordinator",
  "internal_reviewer",
  "viewer"
] as const;

export type OrgRole = (typeof roles)[number];

export const projectRoles = [
  "project_administrator",
  "project_manager",
  "closeout_coordinator",
  "internal_reviewer",
  "viewer"
] as const;

export type ProjectRole = (typeof projectRoles)[number];

export const permissions = {
  profileUpdateSelf: "profile.update_self",
  organizationView: "organization.view",
  organizationUpdate: "organization.update",
  organizationManageMembers: "organization.manage_members",
  organizationManageRoles: "organization.manage_roles",
  organizationTransferOwnership: "organization.transfer_ownership",
  organizationArchive: "organization.archive",
  organizationDelete: "organization.delete",
  organizationManageSecurity: "organization.manage_security",
  membershipView: "membership.view",
  membershipInvite: "membership.invite",
  membershipChangeRole: "membership.change_role",
  membershipSuspend: "membership.suspend",
  membershipReactivate: "membership.reactivate",
  membershipRemove: "membership.remove",
  membershipLeave: "membership.leave",
  auditView: "audit.view",
  securityManage: "security.manage",
  projectCreate: "project.create",
  projectView: "project.view",
  projectViewAll: "project.view_all",
  projectUpdate: "project.update",
  projectArchive: "project.archive",
  projectRestore: "project.restore",
  projectManageTeam: "project.manage_team",
  projectManageCompanies: "project.manage_companies",
  projectManageContacts: "project.manage_contacts",
  companyView: "company.view",
  companyCreate: "company.create",
  companyUpdate: "company.update",
  companyArchive: "company.archive",
  contactView: "contact.view",
  contactCreate: "contact.create",
  contactUpdate: "contact.update",
  contactArchive: "contact.archive",
  templateView: "template.view",
  templateManage: "template.manage",
  templatePublish: "template.publish",
  templateArchive: "template.archive",
  requirementView: "requirement.view",
  requirementManage: "requirement.manage",
  requirementAssign: "requirement.assign",
  requirementSetDates: "requirement.set_dates",
  requirementApplyTemplate: "requirement.apply_template",
  requirementSetNotApplicable: "requirement.set_not_applicable",
  requirementArchive: "requirement.archive",
  platformSuspendOrg: "platform.suspend_org",
  platformSuspendUser: "platform.suspend_user",
  platformViewSecurityEvents: "platform.view_security_events"
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];
export type MembershipStatus = "active" | "suspended" | "removed";

const memberReadPermissions = [
  permissions.profileUpdateSelf,
  permissions.organizationView,
  permissions.membershipView,
  permissions.membershipLeave,
  permissions.companyView,
  permissions.contactView,
  permissions.templateView
] as const;

const directoryManagePermissions = [
  permissions.companyCreate,
  permissions.companyUpdate,
  permissions.companyArchive,
  permissions.contactCreate,
  permissions.contactUpdate,
  permissions.contactArchive
] as const;

const templateManagePermissions = [
  permissions.templateManage,
  permissions.templatePublish
] as const;

const administratorPermissions = [
  ...memberReadPermissions,
  permissions.organizationUpdate,
  permissions.organizationManageMembers,
  permissions.organizationManageRoles,
  permissions.membershipInvite,
  permissions.membershipChangeRole,
  permissions.membershipSuspend,
  permissions.membershipReactivate,
  permissions.membershipRemove,
  permissions.auditView,
  permissions.projectCreate,
  permissions.projectViewAll,
  ...directoryManagePermissions,
  ...templateManagePermissions,
  permissions.templateArchive
] as const;

export const rolePermissions: Readonly<Record<OrgRole, readonly Permission[]>> = {
  owner: [
    ...administratorPermissions,
    permissions.organizationTransferOwnership,
    permissions.organizationArchive,
    permissions.organizationDelete,
    permissions.organizationManageSecurity,
    permissions.securityManage
  ],
  administrator: administratorPermissions,
  project_manager: [
    ...memberReadPermissions,
    permissions.projectCreate,
    ...directoryManagePermissions,
    ...templateManagePermissions
  ],
  closeout_coordinator: [
    ...memberReadPermissions,
    permissions.projectCreate,
    ...directoryManagePermissions,
    ...templateManagePermissions
  ],
  internal_reviewer: memberReadPermissions,
  viewer: memberReadPermissions
};

export type ActorMembership = {
  organizationId: string;
  role: OrgRole | string;
  status: MembershipStatus | string;
};

export type Actor = {
  type: "internal_user" | "external_grant" | "platform_admin" | "system";
  id: string;
  membership?: ActorMembership;
  accountStatus?: "active" | "suspended" | "deleted";
  organizationStatus?: "active" | "suspended" | "archived" | "pending_deletion";
  assuranceLevel?: "aal1" | "aal2";
  reauthenticated?: boolean;
  platformRole?: "platform_admin" | "platform_support";
  projectAccess?: boolean;
  projectRole?: ProjectRole | string;
};

export type AuthorizationResource = {
  type: string;
  id: string;
  organizationId?: string;
  projectId?: string;
  projectStatus?: string;
  ownerProtected?: boolean;
  soleOwner?: boolean;
};

export type DenialReason =
  | "account_inactive"
  | "organization_inactive"
  | "membership_inactive"
  | "organization_mismatch"
  | "unknown_permission"
  | "unknown_role"
  | "permission_denied"
  | "owner_protected"
  | "last_owner"
  | "reauthentication_required"
  | "mfa_required"
  | "platform_role_required";

export type AuthorizationDecision = { allowed: true } | { allowed: false; reason: DenialReason };

const permissionValues = new Set<string>(Object.values(permissions));
const roleValues = new Set<string>(roles);
const projectRoleValues = new Set<string>(projectRoles);

const projectScopedPermissions = new Set<Permission>([
  permissions.projectView,
  permissions.projectUpdate,
  permissions.projectArchive,
  permissions.projectRestore,
  permissions.projectManageTeam,
  permissions.projectManageCompanies,
  permissions.projectManageContacts,
  permissions.requirementView,
  permissions.requirementManage,
  permissions.requirementAssign,
  permissions.requirementSetDates,
  permissions.requirementApplyTemplate,
  permissions.requirementSetNotApplicable,
  permissions.requirementArchive
]);

const requirementConfigurationPermissions = [
  permissions.requirementView,
  permissions.requirementManage,
  permissions.requirementAssign,
  permissions.requirementSetDates,
  permissions.requirementApplyTemplate,
  permissions.requirementSetNotApplicable,
  permissions.requirementArchive
] as const;

export const projectRolePermissions: Readonly<Record<ProjectRole, readonly Permission[]>> = {
  project_administrator: [
    permissions.projectView,
    permissions.projectUpdate,
    permissions.projectArchive,
    permissions.projectRestore,
    permissions.projectManageTeam,
    permissions.projectManageCompanies,
    permissions.projectManageContacts,
    ...requirementConfigurationPermissions
  ],
  project_manager: [
    permissions.projectView,
    permissions.projectUpdate,
    permissions.projectManageTeam,
    permissions.projectManageCompanies,
    permissions.projectManageContacts,
    ...requirementConfigurationPermissions
  ],
  closeout_coordinator: [
    permissions.projectView,
    permissions.projectUpdate,
    permissions.projectManageCompanies,
    permissions.projectManageContacts,
    ...requirementConfigurationPermissions
  ],
  internal_reviewer: [permissions.projectView, permissions.requirementView],
  viewer: [permissions.projectView, permissions.requirementView]
};

const sensitiveMfaPermissions = new Set<Permission>([
  permissions.organizationTransferOwnership,
  permissions.organizationDelete,
  permissions.organizationManageSecurity,
  permissions.securityManage,
  permissions.platformSuspendOrg,
  permissions.platformSuspendUser,
  permissions.platformViewSecurityEvents
]);

const sensitiveReauthPermissions = new Set<Permission>([...sensitiveMfaPermissions]);

const ownerProtectedPermissions = new Set<Permission>([
  permissions.membershipChangeRole,
  permissions.membershipRemove,
  permissions.membershipSuspend
]);

export function can(
  actor: Actor,
  permission: Permission | string,
  resource: AuthorizationResource
): AuthorizationDecision {
  if (!permissionValues.has(permission)) return { allowed: false, reason: "unknown_permission" };
  const knownPermission = permission as Permission;

  if (actor.accountStatus && actor.accountStatus !== "active") {
    return { allowed: false, reason: "account_inactive" };
  }

  if (knownPermission.startsWith("platform.")) {
    const rolesAllowed =
      knownPermission === permissions.platformViewSecurityEvents
        ? new Set(["platform_admin", "platform_support"])
        : new Set(["platform_admin"]);
    if (!actor.platformRole || !rolesAllowed.has(actor.platformRole)) {
      return { allowed: false, reason: "platform_role_required" };
    }
    if (actor.assuranceLevel !== "aal2") return { allowed: false, reason: "mfa_required" };
    return { allowed: true };
  }

  if (actor.type !== "internal_user" || !actor.membership) {
    return { allowed: false, reason: "permission_denied" };
  }
  if (actor.membership.status !== "active") {
    return { allowed: false, reason: "membership_inactive" };
  }
  if (resource.organizationId && actor.membership.organizationId !== resource.organizationId) {
    return { allowed: false, reason: "organization_mismatch" };
  }
  if (actor.organizationStatus && actor.organizationStatus !== "active") {
    return { allowed: false, reason: "organization_inactive" };
  }
  if (!roleValues.has(actor.membership.role)) return { allowed: false, reason: "unknown_role" };

  const role = actor.membership.role as OrgRole;
  if (projectScopedPermissions.has(knownPermission)) {
    if (!resource.projectId) return { allowed: false, reason: "permission_denied" };
    const effectiveProjectRole: ProjectRole | null =
      role === "owner" || role === "administrator"
        ? "project_administrator"
        : actor.projectAccess && actor.projectRole && projectRoleValues.has(actor.projectRole)
          ? (actor.projectRole as ProjectRole)
          : null;
    if (!effectiveProjectRole) return { allowed: false, reason: "permission_denied" };
    if (
      resource.projectStatus === "archived" &&
      knownPermission !== permissions.projectView &&
      knownPermission !== permissions.projectRestore &&
      knownPermission !== permissions.requirementView
    ) {
      return { allowed: false, reason: "permission_denied" };
    }
    return projectRolePermissions[effectiveProjectRole].includes(knownPermission)
      ? { allowed: true }
      : { allowed: false, reason: "permission_denied" };
  }
  if (!rolePermissions[role].includes(knownPermission)) {
    return { allowed: false, reason: "permission_denied" };
  }
  if (
    resource.ownerProtected &&
    role !== "owner" &&
    ownerProtectedPermissions.has(knownPermission)
  ) {
    return { allowed: false, reason: "owner_protected" };
  }
  if (resource.soleOwner && knownPermission === permissions.membershipLeave) {
    return { allowed: false, reason: "last_owner" };
  }
  if (sensitiveReauthPermissions.has(knownPermission) && !actor.reauthenticated) {
    return { allowed: false, reason: "reauthentication_required" };
  }
  if (sensitiveMfaPermissions.has(knownPermission) && actor.assuranceLevel !== "aal2") {
    return { allowed: false, reason: "mfa_required" };
  }
  return { allowed: true };
}
