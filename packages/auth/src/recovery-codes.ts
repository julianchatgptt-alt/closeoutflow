import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

function recoveryHash(code: string, salt: string): string {
  return `${salt}:${createHash("sha256").update(`${salt}:${code}`).digest("hex")}`;
}

export function createRecoveryCodes(count = 8): { codes: string[]; hashes: string[] } {
  if (count < 1 || count > 10) throw new Error("INVALID_RECOVERY_CODE_COUNT");
  const codes = Array.from({ length: count }, () => {
    const value = randomBytes(8).toString("hex").toUpperCase();
    return `COF-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
  });
  return {
    codes,
    hashes: codes.map((code) => recoveryHash(code, randomBytes(16).toString("hex")))
  };
}

export function findMatchingRecoveryHash(code: string, storedHashes: readonly string[]) {
  const normalizedCode = code.trim().toUpperCase();
  return storedHashes.find((stored) => {
    const [salt, expected] = stored.split(":");
    if (!salt || !expected || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{64}$/.test(expected)) {
      return false;
    }
    const actual = recoveryHash(normalizedCode, salt).split(":")[1];
    if (!actual || actual.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
  });
}
