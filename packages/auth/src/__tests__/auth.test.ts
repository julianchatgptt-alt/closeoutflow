import { describe, expect, it, vi } from "vitest";

import { hasRequiredAssurance, isFreshAuthentication } from "../index";

describe("authentication security helpers", () => {
  it("requires AAL2 explicitly for sensitive operations", () => {
    expect(hasRequiredAssurance("aal1", "aal2")).toBe(false);
    expect(hasRequiredAssurance("aal2", "aal2")).toBe(true);
    expect(hasRequiredAssurance("aal2", "aal1")).toBe(true);
    expect(hasRequiredAssurance(undefined, "aal1")).toBe(false);
  });

  it("fails closed for missing, future, and stale authentication times", () => {
    const now = new Date("2026-07-17T12:00:00Z");
    expect(isFreshAuthentication(null, now)).toBe(false);
    expect(isFreshAuthentication(new Date("2026-07-17T12:01:00Z"), now)).toBe(false);
    expect(isFreshAuthentication(new Date("2026-07-17T11:44:59Z"), now)).toBe(false);
    expect(isFreshAuthentication(new Date("2026-07-17T11:45:00Z"), now)).toBe(true);
  });

  it("verifies identity with getUser and never needs getSession", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));
    const { getVerifiedUser } = await import("../server");
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "verified-user" } },
      error: null
    });
    const getSession = vi.fn();

    await expect(getVerifiedUser({ auth: { getUser } })).resolves.toMatchObject({
      id: "verified-user"
    });
    expect(getUser).toHaveBeenCalledOnce();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("uses the idempotent database fallback for profile provisioning", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));
    const { ensureProfile } = await import("../server");
    const rpc = vi.fn().mockResolvedValue({
      data: { id: "verified-user", display_name: null },
      error: null
    });

    await expect(ensureProfile({ rpc })).resolves.toMatchObject({ id: "verified-user" });
    expect(rpc).toHaveBeenCalledWith("ensure_profile", {});
  });
});
