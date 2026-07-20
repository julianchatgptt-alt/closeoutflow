import type { AuditEventInsert, Database, Json } from "@closeoutflow/db";

export const auditActions = {
  systemFoundationVerified: "system.foundation_verified",
  authRegistered: "auth.registered",
  authEmailVerified: "auth.email_verified",
  authSignedIn: "auth.signed_in",
  authSignInFailed: "auth.sign_in_failed",
  authSignedOut: "auth.signed_out",
  authPasswordResetRequested: "auth.password_reset_requested",
  authPasswordChanged: "auth.password_changed",
  authEmailChanged: "auth.email_changed",
  authMfaEnrolled: "auth.mfa_enrolled",
  authMfaRemoved: "auth.mfa_removed",
  authRecoveryCodeUsed: "auth.recovery_code_used",
  authSessionRevoked: "auth.session_revoked",
  authAccountDeletionRequested: "auth.account_deletion_requested",
  profileUpdated: "profile.updated",
  organizationCreated: "organization.created",
  organizationUpdated: "organization.updated",
  organizationArchived: "organization.archived",
  organizationDeletionRequested: "organization.deletion_requested",
  organizationDeletionCancelled: "organization.deletion_cancelled",
  invitationCreated: "invitation.created",
  invitationResent: "invitation.resent",
  invitationRevoked: "invitation.revoked",
  invitationAccepted: "invitation.accepted",
  membershipActivated: "membership.activated",
  membershipRoleChanged: "membership.role_changed",
  membershipSuspended: "membership.suspended",
  membershipReactivated: "membership.reactivated",
  membershipRemoved: "membership.removed",
  membershipLeft: "membership.left",
  ownershipTransferInitiated: "ownership_transfer.initiated",
  ownershipTransferCompleted: "ownership_transfer.completed",
  ownershipTransferCancelled: "ownership_transfer.cancelled",
  projectCreated: "project.created",
  projectUpdated: "project.updated",
  projectStatusChanged: "project.status_changed",
  projectArchived: "project.archived",
  projectRestored: "project.restored",
  projectMemberAssigned: "project.member_assigned",
  projectMemberRoleChanged: "project.member_role_changed",
  projectMemberRemoved: "project.member_removed",
  companyCreated: "company.created",
  companyUpdated: "company.updated",
  companyArchived: "company.archived",
  companyRestored: "company.restored",
  contactCreated: "contact.created",
  contactUpdated: "contact.updated",
  contactArchived: "contact.archived",
  contactRestored: "contact.restored",
  projectCompanyAdded: "project.company_added",
  projectCompanyRoleChanged: "project.company_role_changed",
  projectCompanyRemoved: "project.company_removed",
  projectContactAdded: "project.contact_added",
  projectContactResponsibilityChanged: "project.contact_responsibility_changed",
  projectContactRemoved: "project.contact_removed",
  platformUserSuspended: "platform.user_suspended",
  platformOrgSuspended: "platform.org_suspended",
  platformSecurityEventsViewed: "platform.security_events_viewed",
  platformBreakGlassUsed: "platform.break_glass_used",
  platformRoleGranted: "platform.role_granted",
  platformRoleRevoked: "platform.role_revoked"
} as const;

export type AuditAction = (typeof auditActions)[keyof typeof auditActions];

const prohibitedMetadataKey = /(password|token|secret|recovery.?code|session|authorization)/i;

export function assertSafeAuditMetadata(metadata: Json | undefined): void {
  const inspect = (value: Json, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => inspect(entry, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) {
        if (prohibitedMetadataKey.test(key)) {
          throw new Error(`Unsafe audit metadata key: ${path}${key}`);
        }
        if (entry !== undefined) inspect(entry, `${path}${key}.`);
      }
    }
  };
  if (metadata !== undefined) inspect(metadata, "");
}

export type AuditEvent = {
  organizationId?: string;
  actorType: AuditEventInsert["actor_type"];
  actorId?: string;
  projectId?: string;
  targetType: string;
  targetId?: string;
  action: AuditAction;
  before?: Json;
  after?: Json;
  requestId: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  source: AuditEventInsert["source"];
  metadata?: Json;
};

type AuditInsertResult = PromiseLike<{ error: { message: string } | null }>;
type WriteAuditEventArgs = Database["public"]["Functions"]["write_audit_event"]["Args"];

export type AuditClient = {
  rpc(name: "write_audit_event", parameters: WriteAuditEventArgs): AuditInsertResult;
};

export async function writeAuditEvent(client: AuditClient, event: AuditEvent): Promise<void> {
  assertSafeAuditMetadata(event.metadata);
  assertSafeAuditMetadata(event.before);
  assertSafeAuditMetadata(event.after);
  const row: AuditEventInsert = {
    organization_id: event.organizationId ?? null,
    actor_type: event.actorType,
    actor_id: event.actorId ?? null,
    project_id: event.projectId ?? null,
    target_type: event.targetType,
    target_id: event.targetId ?? null,
    action: event.action,
    before: event.before ?? null,
    after: event.after ?? null,
    request_id: event.requestId,
    session_id: event.sessionId ?? null,
    ip: event.ip ?? null,
    user_agent: event.userAgent ?? null,
    source: event.source,
    metadata: event.metadata ?? {}
  };

  const parameters: WriteAuditEventArgs = {
    p_actor_type: row.actor_type,
    p_target_type: row.target_type,
    p_action: row.action,
    p_request_id: row.request_id,
    p_source: row.source,
    p_metadata: row.metadata ?? {},
    ...(event.organizationId ? { p_organization_id: event.organizationId } : {}),
    ...(event.actorId ? { p_actor_id: event.actorId } : {}),
    ...(event.projectId ? { p_project_id: event.projectId } : {}),
    ...(event.targetId ? { p_target_id: event.targetId } : {}),
    ...(event.before === undefined ? {} : { p_before: event.before }),
    ...(event.after === undefined ? {} : { p_after: event.after }),
    ...(event.sessionId ? { p_session_id: event.sessionId } : {}),
    ...(event.ip ? { p_ip: event.ip } : {}),
    ...(event.userAgent ? { p_user_agent: event.userAgent } : {})
  };

  const { error } = await client.rpc("write_audit_event", parameters);
  if (error) throw new Error("Audit event write failed: " + error.message);
}
