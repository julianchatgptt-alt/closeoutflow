import "server-only";

import { ACTIVE_ORGANIZATION_COOKIE } from "@closeoutflow/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createRequestAuthClient, getRequestUser } from "./server-auth";

export async function getActiveContext() {
  const [user, client, cookieStore] = await Promise.all([
    getRequestUser(),
    createRequestAuthClient(),
    cookies()
  ]);
  const organizationId = z.uuid().safeParse(cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value);
  if (!user || !client || !organizationId.success) redirect("/select-organization");

  const { data: membership } = await client
    .from("organization_memberships")
    .select("id,role,status")
    .eq("organization_id", organizationId.data)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) redirect("/select-organization");

  return { client, user, organizationId: organizationId.data, membership };
}
