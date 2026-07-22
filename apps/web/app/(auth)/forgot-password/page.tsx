import { Button, Input, Label } from "@closeoutflow/ui";
import Link from "next/link";

import { requestPasswordResetAction } from "../../../actions/auth";
import { AuthCard } from "../../../components/auth/auth-card";
import { AuthMessage } from "../../../components/auth/auth-message";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard
      title="Reset your password"
      eyebrow="Account recovery"
      description="We’ll send a secure reset link if the account exists."
    >
      <div className="mb-4">
        <AuthMessage
          message={
            params.sent ? "If an account exists, we’ve sent a password reset link." : undefined
          }
        />
      </div>
      <form action={requestPasswordResetAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>
      <Link className="mt-6 block text-center text-sm text-primary hover:underline" href="/sign-in">
        Return to sign in
      </Link>
    </AuthCard>
  );
}
