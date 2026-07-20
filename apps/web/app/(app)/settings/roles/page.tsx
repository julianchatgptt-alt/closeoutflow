import { Card } from "@closeoutflow/ui";

import { PageHeader } from "../../../../components/shell/page-header";

export const metadata = { title: "Roles" };

const roles = [
  ["Owner", "Full organization administration, security, lifecycle, and ownership."],
  ["Administrator", "Organization settings, invitations, members, roles, and audit access."],
  ["Project Manager", "Standard member access; project permissions begin in a later phase."],
  ["Closeout Coordinator", "Standard member access; closeout workflows begin in a later phase."],
  ["Internal Reviewer", "Standard member access; review workflows begin in a later phase."],
  ["Viewer", "Read-only organization and membership visibility."]
] as const;

export default function RolesPage() {
  return (
    <div>
      <PageHeader
        title="Roles"
        description="The Phase 4 organization permission model is fixed and deny-by-default."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map(([role, description]) => (
          <Card key={role} className="p-5">
            <h2 className="font-semibold">{role}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
