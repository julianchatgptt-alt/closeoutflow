import { Button, Input, Label } from "@closeoutflow/ui";
import { redirect } from "next/navigation";

import { challengeMfaAction } from "../../../actions/security";
import { AuthCard } from "../../../components/auth/auth-card";
import { AuthMessage } from "../../../components/auth/auth-message";
import { getSafeRedirect } from "../../../lib/safe-redirect";
import {
  createRequestAuthClient,
  getRequestUser,
  getVerifiedAssuranceLevel
} from "../../../lib/server-auth";

export const metadata = {
  title: "Verify two-factor authentication",
  robots: { index: false, follow: false }
};

export default async function MfaChallengePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/mfa/challenge");
  const [{ data: factors }, aal, params] = await Promise.all([
    client.auth.mfa.listFactors(),
    getVerifiedAssuranceLevel(client),
    searchParams
  ]);
  const next = getSafeRedirect(params.next, "/dashboard");
  if (aal === "aal2") redirect(next);
  const factor = factors?.totp.find((candidate) => candidate.status === "verified");
  if (!factor) redirect("/account/security?error=Set up an authenticator to continue");

  return (
    <AuthCard
      title="Two-factor verification"
      description="Enter the six-digit code from your authenticator to continue."
      eyebrow="Identity check"
    >
      <div className="mb-4">
        <AuthMessage error={params.error} />
      </div>
      <form action={challengeMfaAction} className="space-y-4">
        <input type="hidden" name="factorId" value={factor.id} />
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="code">Authentication code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            className="font-mono tracking-[0.3em]"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Verify identity
        </Button>
      </form>
    </AuthCard>
  );
}
