"use server";

import { permissions } from "@closeoutflow/authz";
import { redirect } from "next/navigation";
import { z } from "zod";

import { rateLimitRequest } from "../lib/rate-limit";
import { authorizePlatformAction } from "../lib/authorization";
import { createRequestAuthClient, getRequestUser } from "../lib/server-auth";

async function platformClient() {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/platform");
  if (!(await rateLimitRequest("ownership-transfer", user.id))) {
    redirect("/platform?error=Too many attempts. Try again later.");
  }
  return { client, user };
}

export async function suspendPlatformOrganizationAction(formData: FormData): Promise<void> {
  const organizationId = z.uuid().safeParse(formData.get("organizationId"));
  const reason = z.string().trim().min(10).max(500).safeParse(formData.get("reason"));
  if (!organizationId.success || !reason.success)
    redirect("/platform?error=Enter a valid organization and reason");
  const { client, user } = await platformClient();
  const authorization = await authorizePlatformAction({
    client,
    userId: user.id,
    permission: permissions.platformSuspendOrg,
    resource: { type: "organization", id: organizationId.data }
  });
  if (!authorization.allowed) redirect("/platform?error=Platform action was denied");
  const { error } = await client.rpc("platform_suspend_organization", {
    target_organization_id: organizationId.data,
    reason: reason.data
  });
  if (error) redirect("/platform?error=Platform action was denied");
  redirect("/platform?message=Organization suspended");
}

export async function suspendPlatformUserAction(formData: FormData): Promise<void> {
  const userId = z.uuid().safeParse(formData.get("userId"));
  const reason = z.string().trim().min(10).max(500).safeParse(formData.get("reason"));
  if (!userId.success || !reason.success) redirect("/platform?error=Enter a valid user and reason");
  const { client, user } = await platformClient();
  const authorization = await authorizePlatformAction({
    client,
    userId: user.id,
    permission: permissions.platformSuspendUser,
    resource: { type: "user", id: userId.data }
  });
  if (!authorization.allowed) redirect("/platform?error=Platform action was denied");
  const { error } = await client.rpc("platform_suspend_user", {
    target_user_id: userId.data,
    reason: reason.data
  });
  if (error) redirect("/platform?error=Platform action was denied");
  redirect("/platform?message=User suspended");
}
