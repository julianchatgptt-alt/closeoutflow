import { describe, expect, it } from "vitest";

import { createRecoveryCodes, findMatchingRecoveryHash } from "../recovery-codes";

describe("MFA recovery codes", () => {
  it("creates one-time codes while persisting only salted hashes", () => {
    const { codes, hashes } = createRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    expect(hashes).toHaveLength(8);
    expect(hashes.every((hash) => /^[a-f0-9]{32}:[a-f0-9]{64}$/.test(hash))).toBe(true);
    for (const code of codes) expect(hashes.join("")).not.toContain(code);
    expect(findMatchingRecoveryHash(codes[0]!, hashes)).toBeTruthy();
  });

  it("fails closed for invalid, malformed, and already-removed hashes", () => {
    const { codes, hashes } = createRecoveryCodes(1);
    expect(findMatchingRecoveryHash("wrong-code", hashes)).toBeUndefined();
    expect(findMatchingRecoveryHash(codes[0]!, ["malformed"])).toBeUndefined();
    expect(findMatchingRecoveryHash(codes[0]!, [])).toBeUndefined();
  });
});
