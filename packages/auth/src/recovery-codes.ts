import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function legacyRecoveryHash(code: string, salt: string): string {
  return `${salt}:${createHash("sha256").update(`${salt}:${code}`).digest("hex")}`;
}

function recoveryHash(code: string, salt: string, pepper: string): string {
  const digest = createHmac("sha256", pepper)
    .update(`closeoutflow:recovery-code:v2:${salt}:${code}`)
    .digest("hex");
  return `v2:${salt}:${digest}`;
}

export function createRecoveryCodes(
  pepper: string,
  count = 8
): { codes: string[]; hashes: string[] } {
  if (pepper.length < 32) throw new Error("INVALID_RECOVERY_CODE_PEPPER");
  if (count < 1 || count > 10) throw new Error("INVALID_RECOVERY_CODE_COUNT");
  const codes = Array.from({ length: count }, () => {
    const value = randomBytes(8).toString("hex").toUpperCase();
    return `COF-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
  });
  return {
    codes,
    hashes: codes.map((code) => recoveryHash(code, randomBytes(16).toString("hex"), pepper))
  };
}

export function findMatchingRecoveryHash(
  code: string,
  storedHashes: readonly string[],
  pepper: string
) {
  if (pepper.length < 32) return undefined;
  const normalizedCode = code.trim().toUpperCase();
  return storedHashes.find((stored) => {
    const v2 = stored.match(/^v2:([a-f0-9]{32}):([a-f0-9]{64})$/);
    const legacy = stored.match(/^([a-f0-9]{32}):([a-f0-9]{64})$/);
    const salt = v2?.[1] ?? legacy?.[1];
    const expected = v2?.[2] ?? legacy?.[2];
    if (!salt || !expected) {
      return false;
    }
    const actual = v2
      ? recoveryHash(normalizedCode, salt, pepper).split(":")[2]
      : legacyRecoveryHash(normalizedCode, salt).split(":")[1];
    if (!actual || actual.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
  });
}
