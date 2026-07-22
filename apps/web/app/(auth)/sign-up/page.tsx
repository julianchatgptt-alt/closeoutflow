import { Button, Input, Label } from "@closeoutflow/ui";
import Link from "next/link";

import { signUpAction } from "../../../actions/auth";
import { AuthCard } from "../../../components/auth/auth-card";
import { AuthMessage } from "../../../components/auth/auth-message";
import { OAuthButtons } from "../../../components/auth/oauth-buttons";
import { getSafeRedirect } from "../../../lib/safe-redirect";

export const metadata = { title: "Create account" };

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard
      title="Create your account"
      description="Set up your identity, then create or join a Closeout workspace."
      eyebrow="Get started"
    >
      <div className="mb-4">
        <AuthMessage error={params.error} />
      </div>
      <OAuthButtons next={getSafeRedirect(params.next, "/onboarding")} />
      <form action={signUpAction} className="space-y-4">
        <input type="hidden" name="next" value={params.next ?? "/onboarding"} />
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Your name</Label>
          <Input id="displayName" name="displayName" autoComplete="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={params.email}
            readOnly={Boolean(params.email)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            aria-describedby="password-help"
            required
          />
          <p id="password-help" className="text-xs text-muted-foreground">
            Use at least 12 characters.
          </p>
        </div>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-medium text-primary hover:underline" href="/sign-in">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
