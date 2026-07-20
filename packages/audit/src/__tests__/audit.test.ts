import { describe, expect, it, vi } from "vitest";

import { assertSafeAuditMetadata, auditActions, type AuditClient, writeAuditEvent } from "../index";

describe("audit writer", () => {
  it("writes through the service-role-only RPC rather than exposing the audit schema", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    const client = { rpc } as AuditClient;

    await writeAuditEvent(client, {
      actorType: "system",
      targetType: "system",
      action: auditActions.systemFoundationVerified,
      requestId: "request-1",
      source: "api"
    });

    expect(rpc).toHaveBeenCalledWith(
      "write_audit_event",
      expect.objectContaining({
        p_action: "system.foundation_verified",
        p_request_id: "request-1"
      })
    );
  });
});

describe("identity audit metadata", () => {
  it("contains the complete Phase 4 action catalog without free-form values", () => {
    expect(Object.values(auditActions)).toContain("auth.mfa_enrolled");
    expect(Object.values(auditActions)).toContain("ownership_transfer.completed");
    expect(Object.values(auditActions)).toContain("platform.org_suspended");
  });

  it("rejects sensitive keys recursively", () => {
    expect(() => assertSafeAuditMetadata({ safe: { nested: { recovery_code: "never" } } })).toThrow(
      "Unsafe audit metadata key"
    );
    expect(() => assertSafeAuditMetadata({ role: "viewer", method: "password" })).not.toThrow();
  });
});
