import { Badge, Button, Card, Input, Label, Select } from "@closeoutflow/ui";
import { redirect } from "next/navigation";

import {
  archiveOrganizationAction,
  requestOrganizationDeletionAction,
  updateOrganizationAction
} from "../../../../actions/organizations";
import { AuthMessage } from "../../../../components/auth/auth-message";
import { PageHeader } from "../../../../components/shell/page-header";
import { resolveOrganizationContext } from "../../../../lib/organization-context";
import { createRequestAuthClient, getRequestUser } from "../../../../lib/server-auth";

export const metadata = { title: "Organization settings" };

export default async function OrganizationSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/settings/organization");
  const context = await resolveOrganizationContext(user.id);
  if (!context.active) redirect("/select-organization");
  const { data: organization } = await client
    .from("organizations")
    .select("display_name,slug,timezone,default_locale,status")
    .eq("id", context.active.id)
    .single();
  if (!organization) redirect("/select-organization");
  const params = await searchParams;
  const canEdit = ["owner", "administrator"].includes(context.active.role);
  const isOwner = context.active.role === "owner";

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Manage the identity and operating defaults for your organization."
        meta={<Badge tone="neutral">{organization.status}</Badge>}
      />
      <AuthMessage error={params.error} message={params.message} />
      <Card className="mt-5 p-5">
        <form action={updateOrganizationAction} className="space-y-5">
          <div>
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={organization.display_name}
              readOnly={!canEdit}
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" value={organization.slug} readOnly aria-describedby="slug-note" />
            <p id="slug-note" className="mt-1 text-xs text-muted-foreground">
              Slug changes are intentionally unavailable in Phase 4.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={organization.timezone}
                readOnly={!canEdit}
                required
              />
            </div>
            <div>
              <Label htmlFor="locale">Locale</Label>
              <Select
                id="locale"
                name="locale"
                defaultValue={organization.default_locale}
                disabled={!canEdit}
              >
                <option value="en-US">English (United States)</option>
                <option value="en-CA">English (Canada)</option>
                <option value="fr-CA">French (Canada)</option>
              </Select>
            </div>
          </div>
          {canEdit ? <Button type="submit">Save organization</Button> : null}
        </form>
      </Card>

      {isOwner ? (
        <Card className="mt-5 border-destructive/30 p-5">
          <h2 className="text-h3 font-semibold">Organization lifecycle</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Archiving removes tenant access. Deletion requests also require recent MFA verification
            and exact-name confirmation.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={archiveOrganizationAction}>
              <Button type="submit" variant="outline">
                Archive organization
              </Button>
            </form>
            <form action={requestOrganizationDeletionAction} className="flex flex-wrap gap-2">
              <Label htmlFor="confirmation" className="sr-only">
                Type {organization.display_name} to confirm deletion
              </Label>
              <Input
                id="confirmation"
                name="confirmation"
                placeholder={`Type ${organization.display_name}`}
                required
              />
              <Button type="submit" variant="destructive">
                Request deletion
              </Button>
            </form>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
