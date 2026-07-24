import { Badge, Button, Card, Input, Label, Select } from "@closeoutflow/ui";
import { redirect } from "next/navigation";

import {
  cancelOwnershipTransferAction,
  changeMemberRoleAction,
  completeOwnershipTransferAction,
  initiateOwnershipTransferAction,
  leaveOrganizationAction,
  reactivateMemberAction,
  removeMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  suspendMemberAction
} from "../../../../actions/members";
import { inviteMemberAction } from "../../../../actions/organizations";
import { AuthMessage } from "../../../../components/auth/auth-message";
import { PageHeader } from "../../../../components/shell/page-header";
import { resolveOrganizationContext } from "../../../../lib/organization-context";
import { createRequestAuthClient, getRequestUser } from "../../../../lib/server-auth";

export const metadata = { title: "Team" };

const assignableRoles = [
  ["administrator", "Administrator"],
  ["project_manager", "Project Manager"],
  ["closeout_coordinator", "Closeout Coordinator"],
  ["internal_reviewer", "Internal Reviewer"],
  ["viewer", "Viewer"]
] as const;

const roleLabels = Object.fromEntries([["owner", "Owner"], ...assignableRoles]) as Record<
  string,
  string
>;

export default async function TeamSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/settings/team");
  const context = await resolveOrganizationContext(user.id);
  if (!context.active) redirect("/select-organization");

  const [memberResult, invitationResult, transferResult, params] = await Promise.all([
    client.rpc("get_organization_members", {
      target_organization_id: context.active.id
    }),
    client.rpc("get_organization_invitations", {
      target_organization_id: context.active.id
    }),
    client
      .from("organization_ownership_transfers")
      .select("id,from_user,to_user,status,expires_at")
      .eq("organization_id", context.active.id)
      .eq("status", "pending")
      .maybeSingle(),
    searchParams
  ]);

  const members = memberResult.data ?? [];
  const invitations = invitationResult.data ?? [];
  const transfer = transferResult.data;
  const canManage = ["owner", "administrator"].includes(context.active.role);
  const isOwner = context.active.role === "owner";
  const eligibleTransferTargets = members.filter(
    (member) => member.status === "active" && member.role !== "owner"
  );

  return (
    <div>
      <PageHeader
        title="Team"
        description={`Manage memberships and invitations for ${context.active.displayName}.`}
      />
      <AuthMessage error={params.error} message={params.message} />

      {canManage ? (
        <Card className="mt-5 p-5">
          <h2 className="text-h3 font-semibold">Invite a member</h2>
          <form
            action={inviteMemberAction}
            className="mt-4 grid gap-4 md:grid-cols-[1fr_14rem_auto]"
          >
            <input type="hidden" name="organizationId" value={context.active.id} />
            <div>
              <Label htmlFor="invite-email">Email address</Label>
              <Input id="invite-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select id="invite-role" name="role" defaultValue="viewer">
                {assignableRoles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="self-end">
              Send invitation
            </Button>
          </form>
        </Card>
      ) : null}

      <Card className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Organization members</caption>
          <thead className="border-b border-hairline bg-surface-sunken">
            <tr>
              <th className="text-overline px-4 py-3">Member</th>
              <th className="text-overline px-4 py-3">Role</th>
              <th className="text-overline px-4 py-3">Status</th>
              <th className="text-overline px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const ownerProtected = member.role === "owner";
              const isSelf = member.user_id === user.id;
              const active = member.status === "active";
              return (
                <tr
                  key={member.membership_id}
                  /* A suspended member must never read as an active one. */
                  className={`border-b border-hairline last:border-0 ${active ? "" : "bg-surface-sunken"}`}
                >
                  <td className="px-4 py-3">
                    <div className={`font-medium ${active ? "" : "text-muted-foreground"}`}>
                      {member.display_name}
                    </div>
                    <div
                      className="max-w-64 truncate text-[13px] text-muted-foreground"
                      title={member.email}
                    >
                      {member.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && !ownerProtected ? (
                      <form action={changeMemberRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="membershipId" value={member.membership_id} />
                        <Select
                          name="role"
                          defaultValue={member.role}
                          aria-label={`Role for ${member.display_name}`}
                        >
                          {assignableRoles.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" variant="outline" size="sm">
                          Save
                        </Button>
                      </form>
                    ) : (
                      (roleLabels[member.role] ?? member.role)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {/* Never render the raw enum. */}
                    <Badge tone={active ? "success" : "warning"}>
                      {active ? "Active" : "Suspended"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {canManage && !ownerProtected && !isSelf && member.status === "active" ? (
                        <>
                          <form action={suspendMemberAction}>
                            <input type="hidden" name="membershipId" value={member.membership_id} />
                            <Button type="submit" variant="outline" size="sm">
                              Suspend
                            </Button>
                          </form>
                          <form action={removeMemberAction}>
                            <input type="hidden" name="membershipId" value={member.membership_id} />
                            <Button type="submit" variant="ghost" size="sm">
                              Remove
                            </Button>
                          </form>
                        </>
                      ) : null}
                      {canManage && !ownerProtected && member.status === "suspended" ? (
                        <form action={reactivateMemberAction}>
                          <input type="hidden" name="membershipId" value={member.membership_id} />
                          <Button type="submit" variant="outline" size="sm">
                            Reactivate
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {canManage ? (
        <Card className="mt-5 p-5">
          <h2 className="text-h3 font-semibold">Pending invitations</h2>
          {invitations.length ? (
            <ul className="mt-4 divide-y divide-border">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{invitation.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {roleLabels[invitation.role] ?? invitation.role} · expires{" "}
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <form action={resendInvitationAction}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Resend
                    </Button>
                  </form>
                  <form action={revokeInvitationAction}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Revoke
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No pending invitations.</p>
          )}
        </Card>
      ) : null}

      {isOwner ? (
        <Card className="mt-5 p-5">
          <h2 className="text-h3 font-semibold">Ownership transfer</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Both the current and incoming owner must verify with MFA. Transfers expire after seven
            days.
          </p>
          {transfer ? (
            <form action={cancelOwnershipTransferAction} className="mt-4">
              <input type="hidden" name="transferId" value={transfer.id} />
              <Button type="submit" variant="outline">
                Cancel pending transfer
              </Button>
            </form>
          ) : eligibleTransferTargets.length ? (
            <form action={initiateOwnershipTransferAction} className="mt-4 flex flex-wrap gap-3">
              <Select name="targetUserId" aria-label="New owner" required>
                {eligibleTransferTargets.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.display_name}
                  </option>
                ))}
              </Select>
              <Button type="submit">Request transfer</Button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Invite another member before transferring ownership.
            </p>
          )}
        </Card>
      ) : null}

      {transfer?.to_user === user.id ? (
        <Card className="mt-5 p-5">
          <h2 className="text-h3 font-semibold">Accept ownership</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete MFA verification before accepting this transfer.
          </p>
          <form action={completeOwnershipTransferAction} className="mt-4">
            <input type="hidden" name="transferId" value={transfer.id} />
            <Button type="submit">Accept ownership</Button>
          </form>
        </Card>
      ) : null}

      {!isOwner ? (
        <Card className="mt-5 p-5">
          <h2 className="text-h3 font-semibold">Leave organization</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your membership history is retained and access ends immediately.
          </p>
          <form action={leaveOrganizationAction} className="mt-4">
            <Button type="submit" variant="outline">
              Leave organization
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
