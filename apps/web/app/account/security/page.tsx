import { Badge, Button, Card, Input, Label } from "@closeoutflow/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  changePasswordAction,
  removeMfaFactorAction,
  requestAccountDeletionAction,
  requestEmailChangeAction
} from "../../../actions/security";
import { MfaEnrollment } from "../../../components/account/mfa-enrollment";
import { AuthMessage } from "../../../components/auth/auth-message";
import { createRequestAuthClient, getRequestUser } from "../../../lib/server-auth";

export const metadata = { title: "Account security" };

export default async function SecurityPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/account/security");
  const [{ data: factors }, { data: events }, params] = await Promise.all([
    client.auth.mfa.listFactors(),
    client
      .from("user_security_events")
      .select("id,event_type,occurred_at")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(20),
    searchParams
  ]);
  const verifiedFactor = factors?.totp.find((factor) => factor.status === "verified");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 font-semibold">Security</h1>
          <p className="mt-1 text-muted-foreground">
            Password, two-factor authentication, and recent security activity.
          </p>
        </div>
        <Link
          href="/account/sessions"
          className="inline-flex min-h-10 items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-muted"
        >
          Sessions
        </Link>
      </div>
      <div className="my-5">
        <AuthMessage error={params.error} message={params.message} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-h3 font-semibold">Two-factor authentication</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Required for ownership transfer and platform administration.
            </p>
          </div>
          <Badge tone={verifiedFactor ? "success" : "neutral"}>
            {verifiedFactor ? "Enabled" : "Optional"}
          </Badge>
        </div>
        <div className="mt-5">
          <MfaEnrollment {...(verifiedFactor ? { existingFactorId: verifiedFactor.id } : {})} />
        </div>
        {verifiedFactor ? (
          <form action={removeMfaFactorAction} className="mt-5 border-t border-border pt-5">
            <input type="hidden" name="factorId" value={verifiedFactor.id} />
            <Button type="submit" variant="destructive">
              Remove authenticator
            </Button>
          </form>
        ) : null}
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-h3 font-semibold">Change password</h2>
        <form action={changePasswordAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              minLength={12}
              required
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmation">Confirm new password</Label>
            <Input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </div>
          <Button type="submit" className="sm:col-span-2 sm:w-fit">
            Change password
          </Button>
        </form>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-h3 font-semibold">Change email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Supabase confirms the change through the old and new addresses.
        </p>
        <form action={requestEmailChangeAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="newEmail">New email</Label>
            <Input id="newEmail" name="newEmail" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="emailCurrentPassword">Current password</Label>
            <Input
              id="emailCurrentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              minLength={12}
              required
            />
          </div>
          <Button type="submit" variant="outline" className="sm:col-span-2 sm:w-fit">
            Request email change
          </Button>
        </form>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-h3 font-semibold">Recent security activity</h2>
        {events?.length ? (
          <ul className="mt-3 divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex justify-between gap-3 py-3 text-sm">
                <span>{event.event_type.replaceAll("_", " ")}</span>
                <time className="text-muted-foreground" dateTime={event.occurred_at}>
                  {new Date(event.occurred_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No security events recorded yet.</p>
        )}
      </Card>

      <Card className="mt-5 border-destructive/30 p-5">
        <h2 className="text-h3 font-semibold">Delete account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfer every owned organization first. This request requires recent MFA verification and
          enters the documented grace-period workflow.
        </p>
        <form action={requestAccountDeletionAction} className="mt-4 flex flex-wrap gap-2">
          <Label htmlFor="deleteConfirmation" className="sr-only">
            Type DELETE to confirm
          </Label>
          <Input
            id="deleteConfirmation"
            name="confirmation"
            placeholder="Type DELETE"
            className="max-w-48"
            required
          />
          <Button type="submit" variant="destructive">
            Request account deletion
          </Button>
        </form>
      </Card>
    </main>
  );
}
