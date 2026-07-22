import { Button, Input, Label } from "@closeoutflow/ui";

import { resetPasswordAction } from "../../../actions/auth";
import { AuthCard } from "../../../components/auth/auth-card";
import { AuthMessage } from "../../../components/auth/auth-message";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard
      title="Choose a new password"
      eyebrow="Account recovery"
      description="This will revoke your other active sessions."
    >
      <div className="mb-4">
        <AuthMessage error={params.error} />
      </div>
      <form action={resetPasswordAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" minLength={12} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmation">Confirm password</Label>
          <Input id="confirmation" name="confirmation" type="password" minLength={12} required />
        </div>
        <Button type="submit" className="w-full">
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
