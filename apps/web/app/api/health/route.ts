import { createServiceClient } from "@closeoutflow/db/server";
import { serverEnv } from "@closeoutflow/env/server";
import { createLogger, createRequestId } from "@closeoutflow/observability";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DatabaseHealthResult = PromiseLike<{
  data: boolean | null;
  error: { code?: string } | null;
}>;

export type DatabaseHealthClient = {
  rpc(name: "database_health_check"): DatabaseHealthResult;
};

export async function checkDatabaseReachability(client: DatabaseHealthClient): Promise<boolean> {
  const { data, error } = await client.rpc("database_health_check");
  return error === null && data === true;
}

export async function GET(request: Request) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const logger = createLogger({ requestId, source: "api", level: serverEnv.LOG_LEVEL });
  let databaseReachable = false;

  const url = serverEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceRoleKey) {
    try {
      const client = createServiceClient({ url, serviceRoleKey });
      databaseReachable = await checkDatabaseReachability(client);
      if (!databaseReachable) logger.warn("Database health check failed");
    } catch {
      logger.warn("Database health check failed");
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
