import { Button, Input, Label } from "@closeoutflow/ui";

import { resendVerificationAction, signOutAction } from "../../../actions/auth";
import { AuthCard } from "../../../components/auth/auth-card";
import { AuthMessage } from "../../../components/auth/auth-message";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard
      title="Check your inbox"
      description="Confirm your email to protect your Closeout account."
    >
      <div className="mb-4">
        <AuthMessage
          message={params.sent ? "A new verification email was requested." : undefined}
        />
      </div>
      <form action={resendVerificationAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={params.email} required />
        </div>
        <Button type="submit" className="w-full">
          Resend verification email
        </Button>
      </form>
      <form action={signOutAction} className="mt-3">
        <Button type="submit" variant="ghost" className="w-full">
          Sign out
        </Button>
      </form>
    </AuthCard>
  );
}
