import { Button, Input, Label } from "@closeoutflow/ui";
import Link from "next/link";

import { signInAction } from "../../../actions/auth";
import { AuthCard } from "../../../components/auth/auth-card";
import { AuthMessage } from "../../../components/auth/auth-message";
import { OAuthButtons } from "../../../components/auth/oauth-buttons";
import { getSafeRedirect } from "../../../lib/safe-redirect";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard title="Welcome back" description="Sign in to continue to your Closeout workspace.">
      <div className="mb-4">
        <AuthMessage error={params.error} message={params.message} />
      </div>
      <OAuthButtons next={getSafeRedirect(params.next)} />
      <form action={signInAction} className="space-y-4">
        <input type="hidden" name="next" value={getSafeRedirect(params.next)} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link className="text-sm text-primary hover:underline" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={12}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Closeout?{" "}
        <Link className="font-medium text-primary hover:underline" href="/sign-up">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
