import { Button, Card, Input, Label } from "@closeoutflow/ui";
import { redirect } from "next/navigation";

import {
  requestReauthenticationAction,
  verifyReauthenticationAction
} from "../../actions/security";
import { AuthMessage } from "../../components/auth/auth-message";
import { getSafeRedirect } from "../../lib/safe-redirect";
import { getRequestUser } from "../../lib/server-auth";

export const metadata = { title: "Confirm your identity" };

export default async function ReauthenticatePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; sent?: string; next?: string }>;
}) {
  const user = await getRequestUser();
  if (!user) redirect("/sign-in?next=/reauthenticate");
  const params = await searchParams;
  const next = getSafeRedirect(params.next, "/account/security");

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-h2 font-semibold">Confirm your identity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sensitive actions require a recent email verification code and MFA where enrolled.
        </p>
        <div className="my-4">
          <AuthMessage
            error={params.error}
            message={params.sent ? "Verification code sent." : undefined}
          />
        </div>
        {params.sent ? (
          <form action={verifyReauthenticationAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <Label htmlFor="token">Six-digit email code</Label>
              <Input
                id="token"
                name="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Confirm identity
            </Button>
          </form>
        ) : (
          <form action={requestReauthenticationAction}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" className="w-full">
              Send verification code
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
