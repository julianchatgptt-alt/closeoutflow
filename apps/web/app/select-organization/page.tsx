import { Badge, Button, Card, CardContent } from "@closeoutflow/ui";
import { redirect } from "next/navigation";

import { selectOrganizationFormAction } from "../../actions/organizations";
import { AuthCard } from "../../components/auth/auth-card";
import { AuthMessage } from "../../components/auth/auth-message";
import { resolveOrganizationContext } from "../../lib/organization-context";
import { getRequestUser } from "../../lib/server-auth";

export const metadata = {
  title: "Select organization",
  robots: { index: false, follow: false }
};

export default async function SelectOrganizationPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getRequestUser();
  if (!user) redirect("/sign-in?next=/select-organization");
  const context = await resolveOrganizationContext(user.id);
  if (context.organizations.length === 0) redirect("/onboarding");
  const params = await searchParams;

  return (
    <AuthCard
      title="Choose an organization"
      eyebrow="Organization access"
      description="Access is revalidated before the workspace changes."
    >
      <div className="mb-4">
        <AuthMessage error={params.error} />
      </div>
      <div className="space-y-3">
        {context.organizations.map((organization) => (
          <Card key={organization.id} className="ring-1 ring-border">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{organization.displayName}</p>
                <Badge className="mt-1">{organization.role.replaceAll("_", " ")}</Badge>
              </div>
              <form action={selectOrganizationFormAction}>
                <input type="hidden" name="organizationId" value={organization.id} />
                <input type="hidden" name="destination" value="/dashboard" />
                <Button type="submit" variant="outline">
                  Open
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </AuthCard>
  );
}
