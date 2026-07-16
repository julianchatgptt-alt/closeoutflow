import { describe, expect, it, vi } from "vitest";

import { auditActions, type AuditClient, writeAuditEvent } from "../index";

describe("audit writer", () => {
  it("writes through the audit schema rather than logs or analytics", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ insert }));
    const schema = vi.fn(() => ({ from }));
    const client = { schema } as AuditClient;

    await writeAuditEvent(client, {
      actorType: "system",
      targetType: "system",
      action: auditActions.systemHealthChecked,
      requestId: "request-1",
      source: "api"
    });

    expect(schema).toHaveBeenCalledWith("audit");
    expect(from).toHaveBeenCalledWith("audit_events");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: "system.health_checked", request_id: "request-1" })
    );
  });
});
