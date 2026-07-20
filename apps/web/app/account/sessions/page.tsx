import { Button, Card } from "@closeoutflow/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { revokeOtherSessionsAction } from "../../../actions/security";
import { AuthMessage } from "../../../components/auth/auth-message";
import { createRequestAuthClient, getRequestUser } from "../../../lib/server-auth";

export const metadata = { title: "Sessions" };

export default async function SessionsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/account/sessions");
  const { data: claims } = await client.auth.getClaims();
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 font-semibold">Sessions</h1>
          <p className="mt-1 text-muted-foreground">
            Supabase exposes the current session and global revocation in Phase 4.
          </p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/account/security">
          Security
        </Link>
      </div>
      <div className="my-5">
        <AuthMessage error={params.error} message={params.message} />
      </div>
      <Card className="p-5">
        <h2 className="font-semibold">Current session</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Expires</dt>
            <dd>
              {claims?.claims.exp
                ? new Date(claims.claims.exp * 1000).toLocaleString()
                : "Unavailable"}
            </dd>
          </div>
        </dl>
        <form action={revokeOtherSessionsAction} className="mt-5">
          <Button type="submit" variant="outline">
            Sign out all other devices
          </Button>
        </form>
      </Card>
    </main>
  );
}
