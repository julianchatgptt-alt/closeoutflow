import { AppShell } from "../../components/shell/app-shell";
import { redirect } from "next/navigation";

import {
  createRequestAuthClient,
  getRequestUser,
  getVerifiedAssuranceLevel
} from "../../lib/server-auth";
import { resolveOrganizationContext } from "../../lib/organization-context";

export default async function InternalAppLayout({ children }: { children: React.ReactNode }) {
  const user = await getRequestUser();
  if (!user) redirect("/sign-in");
  if (!user.email_confirmed_at) redirect("/verify-email");
  const client = await createRequestAuthClient();
  if (!client) redirect("/sign-in");
  await client.rpc("ensure_profile");
  const { data: profile } = await client
    .from("user_profiles")
    .select("display_name,account_status,onboarding_status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.account_status !== "active") {
    redirect("/sign-in?error=This account is unavailable");
  }
  if (!profile.display_name) redirect("/account/profile");
  const organizationContext = await resolveOrganizationContext(user.id);
  if (!organizationContext.active) redirect("/onboarding");
  const [{ data: organization }, assurance, { data: factors }] = await Promise.all([
    client
      .from("organizations")
      .select("requires_mfa")
      .eq("id", organizationContext.active.id)
      .single(),
    getVerifiedAssuranceLevel(client),
    client.auth.mfa.listFactors()
  ]);
  if (
    assurance === "aal1" &&
    (factors?.totp.some((factor) => factor.status === "verified") || organization?.requires_mfa)
  ) {
    redirect("/mfa/challenge?next=/dashboard");
  }

  return (
    <AppShell userName={profile.display_name} organizationContext={organizationContext}>
      {children}
    </AppShell>
  );
}
