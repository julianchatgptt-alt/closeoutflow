import { Button, Badge } from "@closeoutflow/ui";
import Link from "next/link";

import { acceptInvitationAction } from "../../../actions/invitations";
import { AuthCard } from "../../../components/auth/auth-card";
import { AuthMessage } from "../../../components/auth/auth-message";
import { createRequestAuthClient, getRequestUser } from "../../../lib/server-auth";

export const metadata = { title: "Organization invitation" };

export default async function InvitationPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const client = await createRequestAuthClient();
  const user = await getRequestUser();
  const { data } = client
    ? await client.rpc("get_invitation_preview", { raw_token: token })
    : { data: null };
  const invitation = data?.[0];

  if (!invitation || invitation.invitation_state !== "pending") {
    return (
      <AuthCard
        title="Invitation unavailable"
        description="This invitation link is no longer valid. Ask an administrator to resend it."
      >
        <Link className="block text-center text-sm text-primary hover:underline" href="/sign-in">
          Return to sign in
        </Link>
      </AuthCard>
    );
  }

  const emailMatches = user?.email?.toLowerCase() === invitation.invitation_email.toLowerCase();
  return (
    <AuthCard
      title={`Join ${invitation.organization_name}`}
      description="This invitation creates an active organization membership."
    >
      <div className="mb-4">
        <AuthMessage error={query.error} />
      </div>
      <dl className="mb-6 space-y-3 rounded-md bg-muted p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate font-medium">{invitation.invitation_email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Role</dt>
          <dd>
            <Badge>{invitation.invitation_role.replaceAll("_", " ")}</Badge>
          </dd>
        </div>
      </dl>
      {!user ? (
        <div className="grid gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            href={`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`}
          >
            Sign in to accept
          </Link>
          <Link
            className="text-center text-sm text-primary hover:underline"
            href={`/sign-up?email=${encodeURIComponent(invitation.invitation_email)}&next=${encodeURIComponent(`/invite/${token}`)}`}
          >
            Create an account
          </Link>
        </div>
      ) : emailMatches ? (
        <form action={acceptInvitationAction.bind(null, token)}>
          <Button type="submit" className="w-full">
            Accept invitation
          </Button>
        </form>
      ) : (
        <AuthMessage
          error={`This invitation is for ${invitation.invitation_email}. Sign out to accept it with that account.`}
        />
      )}
    </AuthCard>
  );
}
