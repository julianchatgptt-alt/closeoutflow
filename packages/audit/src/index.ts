import type { AuditEventInsert, Json } from "@closeoutflow/db";

export const auditActions = {
  systemHealthChecked: "system.health_checked"
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

export type AuditClient = {
  schema(name: "audit"): {
    from(table: "audit_events"): {
      insert(value: AuditEventInsert): AuditInsertResult;
    };
  };
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

  const { error } = await client.schema("audit").from("audit_events").insert(row);
  if (error) throw new Error("Audit event write failed: " + error.message);
}
