import { ACTIVE_ORGANIZATION_COOKIE } from "@closeoutflow/auth";
import { serverEnv } from "@closeoutflow/env/server";
import { NextResponse, type NextRequest } from "next/server";

import { createRequestAuthClient } from "../../../lib/server-auth";
import { getSafeRedirect } from "../../../lib/safe-redirect";
import { rateLimitRequest } from "../../../lib/rate-limit";

export async function GET(request: NextRequest) {
  const applicationUrl = serverEnv.APP_URL ?? "http://127.0.0.1:3000";
  const code = request.nextUrl.searchParams.get("code");
  const next = getSafeRedirect(request.nextUrl.searchParams.get("next"), "/onboarding");
  const client = await createRequestAuthClient();
  if (!code || !client || !(await rateLimitRequest("oauth-callback", code))) {
    return NextResponse.redirect(
      new URL("/sign-in?error=Unable to complete authentication", applicationUrl)
    );
  }
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL("/sign-in?error=Unable to complete authentication", applicationUrl)
    );
  }
  await client.rpc("record_identity_event", {
    target_action: "auth.email_verified",
    target_metadata: {}
  });
  const {
    data: { user }
  } = await client.auth.getUser();
  const response = NextResponse.redirect(new URL(next, applicationUrl));
  if (user) {
    const { data: membership } = await client
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (membership) {
      response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, membership.organization_id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });
    }
  }
  return response;
}
