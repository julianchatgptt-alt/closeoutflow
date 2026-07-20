import { describe, expect, it } from "vitest";

import { createRecoveryCodes, findMatchingRecoveryHash } from "../recovery-codes";

describe("MFA recovery codes", () => {
  const pepper = "test-only-purpose-specific-pepper-0123456789";

  it("creates one-time codes while persisting only versioned keyed hashes", () => {
    const { codes, hashes } = createRecoveryCodes(pepper);
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    expect(hashes).toHaveLength(8);
    expect(hashes.every((hash) => /^v2:[a-f0-9]{32}:[a-f0-9]{64}$/.test(hash))).toBe(true);
    for (const code of codes) expect(hashes.join("")).not.toContain(code);
    expect(findMatchingRecoveryHash(codes[0]!, hashes, pepper)).toBeTruthy();
  });

  it("fails closed for a wrong pepper, malformed hashes, and removed hashes", () => {
    const { codes, hashes } = createRecoveryCodes(pepper, 1);
    expect(findMatchingRecoveryHash("wrong-code", hashes, pepper)).toBeUndefined();
    expect(
      findMatchingRecoveryHash(codes[0]!, hashes, "wrong-purpose-specific-pepper-0123456789")
    ).toBeUndefined();
    expect(findMatchingRecoveryHash(codes[0]!, ["malformed"], pepper)).toBeUndefined();
    expect(findMatchingRecoveryHash(codes[0]!, [], pepper)).toBeUndefined();
  });

  it("verifies legacy salted hashes during the migration window", () => {
    const code = "COF-1234-5678-9ABC";
    const salt = "00112233445566778899aabbccddeeff";
    const expected = "0a6dffc7b5ed59fd8bbeb6f2a8a9b0e4b17ff3f063de5c90bf0ad55c4fba2bf0";
    expect(findMatchingRecoveryHash(code, [`${salt}:${expected}`], pepper)).toBeTruthy();
  });
});
