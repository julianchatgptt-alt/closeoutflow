export { createAnonClient, type AnonClientConfig } from "./client";
export type { Database, Json } from "./types.generated";

import type { Database } from "./types.generated";

export type AuditEventRow = Database["audit"]["Tables"]["audit_events"]["Row"];
export type AuditEventInsert = Database["audit"]["Tables"]["audit_events"]["Insert"];
