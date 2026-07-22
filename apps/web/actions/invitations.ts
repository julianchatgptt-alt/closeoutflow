"use server";

import { ACTIVE_ORGANIZATION_COOKIE } from "@closeoutflow/auth";
import { serverEnv } from "@closeoutflow/env/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createRequestAuthClient, getRequestUser } from "../lib/server-auth";
import { rateLimitRequest } from "../lib/rate-limit";
import { shouldUseSecureCookies } from "../lib/cookie-security";

export async function acceptInvitationAction(token: string): Promise<void> {
  if (!(await rateLimitRequest("invitation-accept", token))) {
    redirect(`/invite/${token}?error=Too many attempts. Try again later.`);
  }
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) {
    redirect(`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
  }
  const { data, error } = await client.rpc("accept_invitation", { raw_token: token });
  const accepted = data?.[0];
  if (error || !accepted) redirect(`/invite/${token}?error=This invitation is no longer valid`);
  (await cookies()).set(ACTIVE_ORGANIZATION_COOKIE, accepted.organization_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(serverEnv.APP_ENV),
    path: "/"
  });
  redirect("/dashboard");
}
