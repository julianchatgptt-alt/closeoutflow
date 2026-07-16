import { randomUUID } from "node:crypto";

export function createRequestId(incoming?: string | null): string {
  const candidate = incoming?.trim();
  return candidate && candidate.length <= 128 ? candidate : randomUUID();
}
