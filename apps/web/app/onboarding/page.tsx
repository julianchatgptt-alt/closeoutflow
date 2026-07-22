import { Button, Input, Label } from "@closeoutflow/ui";
import { redirect } from "next/navigation";

import { createOrganizationAction } from "../../actions/organizations";
import { AuthMessage } from "../../components/auth/auth-message";
import { AuthCard } from "../../components/auth/auth-card";
import { getRequestUser } from "../../lib/server-auth";

export const metadata = {
  title: "Set up your organization",
  robots: { index: false, follow: false }
};

export default async function OnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getRequestUser();
  if (!user) redirect("/sign-in?next=/onboarding");
  if (!user.email_confirmed_at) redirect("/verify-email");
  const params = await searchParams;
  return (
    <AuthCard
      title="Create your organization"
      eyebrow="Workspace setup · Step 1 of 1"
      description="Your organization is the secure boundary for members and future project data."
    >
      <div className="mb-4">
        <AuthMessage error={params.error} />
      </div>
      <form action={createOrganizationAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Organization name</Label>
          <Input id="displayName" name="displayName" autoComplete="organization" required />
        </div>
        <Button type="submit" className="w-full">
          Create organization
        </Button>
      </form>
    </AuthCard>
  );
}
