import { auditActions, writeAuditEvent } from "@closeoutflow/audit";
import { createServiceClient } from "@closeoutflow/db/server";
import { serverEnv } from "@closeoutflow/env/server";
import { createLogger, createRequestId } from "@closeoutflow/observability";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const logger = createLogger({ requestId, source: "api" });
  let databaseReachable = false;

  const url = serverEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceRoleKey) {
    try {
      const client = createServiceClient({ url, serviceRoleKey });
      await writeAuditEvent(client, {
        actorType: "system",
        targetType: "system",
        action: auditActions.systemHealthChecked,
        requestId,
        source: "api",
        metadata: { build_version: serverEnv.BUILD_VERSION }
      });
      databaseReachable = true;
    } catch (error) {
      logger.warn({ error }, "Database health check failed");
    }
  }

  return NextResponse.json(
    {
      status: "ok",
      version: serverEnv.BUILD_VERSION,
      database: { reachable: databaseReachable }
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId
      }
    }
  );
}
