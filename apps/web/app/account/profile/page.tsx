import { Button, Input, Label } from "@closeoutflow/ui";
import { redirect } from "next/navigation";

import { updateProfileAction } from "../../../actions/account";
import { AuthMessage } from "../../../components/auth/auth-message";
import { createRequestAuthClient, getRequestUser } from "../../../lib/server-auth";

export const metadata = { title: "Profile" };

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/account/profile");
  const { data: profile } = await client
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-h1 font-semibold">Profile</h1>
      <p className="mt-1 text-muted-foreground">Manage your Closeout identity.</p>
      <div className="my-5">
        <AuthMessage error={params.error} message={params.message} />
      </div>
      <form
        action={updateProfileAction}
        className="space-y-5 rounded-lg bg-surface p-5 shadow-card"
      >
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={profile?.display_name ?? ""}
            required
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" defaultValue={profile?.first_name ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" defaultValue={profile?.last_name ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferredName">Preferred name</Label>
            <Input
              id="preferredName"
              name="preferredName"
              defaultValue={profile?.preferred_name ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} />
          </div>
        </div>
        <Button type="submit">Save profile</Button>
      </form>
    </main>
  );
}
