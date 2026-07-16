import type { AuditEventInsert, Database, Json } from "@closeoutflow/db";

export const auditActions = {
  systemFoundationVerified: "system.foundation_verified"
} as const;

export type AuditAction = (typeof auditActions)[keyof typeof auditActions];

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
