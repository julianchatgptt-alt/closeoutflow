import { describe, expect, it, vi } from "vitest";

import { auditActions, type AuditClient, writeAuditEvent } from "../index";

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
