import { describe, expect, it } from "vitest";

import { canAcceptOwnershipTransfer } from "./ownership-transfer";

describe("ownership transfer acceptance defense in depth", () => {
  const now = new Date("2026-07-19T12:00:00Z");
  const transfer = {
    organization_id: "10000000-0000-4000-8000-000000000001",
    to_user: "10000000-0000-4000-8000-000000000002",
    status: "pending",
    expires_at: "2026-07-20T12:00:00Z"
  };
  const freshAal2 = {
    aal: "aal2",
    auth_time: now.getTime() / 1000
  };

  it("allows only the target with fresh verified AAL2 claims", () => {
    expect(
      canAcceptOwnershipTransfer({
        transfer,
        userId: transfer.to_user,
        organizationId: transfer.organization_id,
        claims: freshAal2,
        now
      })
    ).toBe(true);
  });

  it("rejects a non-target member before the database call", () => {
    expect(
      canAcceptOwnershipTransfer({
        transfer,
        userId: "10000000-0000-4000-8000-000000000003",
        organizationId: transfer.organization_id,
        claims: freshAal2,
        now
      })
    ).toBe(false);
  });

  it("rejects AAL1 and stale verified sessions", () => {
    expect(
      canAcceptOwnershipTransfer({
        transfer,
        userId: transfer.to_user,
        organizationId: transfer.organization_id,
        claims: { ...freshAal2, aal: "aal1" },
        now
      })
    ).toBe(false);
    expect(
      canAcceptOwnershipTransfer({
        transfer,
        userId: transfer.to_user,
        organizationId: transfer.organization_id,
        claims: { aal: "aal2", auth_time: now.getTime() / 1000 - 3600 },
        now
      })
    ).toBe(false);
  });
});
