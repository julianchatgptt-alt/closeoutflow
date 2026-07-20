import { Button, Card, Input, Label, Textarea } from "@closeoutflow/ui";

import {
  suspendPlatformOrganizationAction,
  suspendPlatformUserAction
} from "../../actions/platform";
import { AuthMessage } from "../../components/auth/auth-message";

export const metadata = { title: "Platform security" };

export default async function PlatformPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-h1 font-semibold">Platform security</h1>
      <p className="mt-1 text-muted-foreground">
        Narrow, AAL2-gated support actions. Platform roles do not bypass customer RLS.
      </p>
      <div className="my-5">
        <AuthMessage error={params.error} message={params.message} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-h3 font-semibold">Suspend organization</h2>
          <form action={suspendPlatformOrganizationAction} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="organizationId">Organization ID</Label>
              <Input id="organizationId" name="organizationId" required />
            </div>
            <div>
              <Label htmlFor="organizationReason">Audited reason</Label>
              <Textarea id="organizationReason" name="reason" minLength={10} required />
            </div>
            <Button type="submit" variant="destructive">
              Suspend organization
            </Button>
          </form>
        </Card>
        <Card className="p-5">
          <h2 className="text-h3 font-semibold">Suspend user</h2>
          <form action={suspendPlatformUserAction} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input id="userId" name="userId" required />
            </div>
            <div>
              <Label htmlFor="userReason">Audited reason</Label>
              <Textarea id="userReason" name="reason" minLength={10} required />
            </div>
            <Button type="submit" variant="destructive">
              Suspend user
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
