import { randomUUID } from "node:crypto";

export function createRequestId(incoming?: string | null): string {
  const candidate = incoming?.trim();
  return candidate &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(candidate)
    ? candidate
    : randomUUID();
}
