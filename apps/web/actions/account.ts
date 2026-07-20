"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createRequestAuthClient, getRequestUser } from "../lib/server-auth";

const optionalText = z.preprocess(
  (entry) => (entry === "" ? null : entry),
  z.string().trim().max(100).nullable()
);

export async function updateProfileAction(formData: FormData): Promise<void> {
  const displayName = z.string().trim().min(2).max(100).safeParse(formData.get("displayName"));
  const firstName = optionalText.safeParse(formData.get("firstName"));
  const lastName = optionalText.safeParse(formData.get("lastName"));
  const preferredName = optionalText.safeParse(formData.get("preferredName"));
  const phone = optionalText.safeParse(formData.get("phone"));
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (
    !displayName.success ||
    !firstName.success ||
    !lastName.success ||
    !preferredName.success ||
    !phone.success ||
    !user ||
    !client
  ) {
    redirect("/account/profile?error=Check the profile details");
  }

  const { error } = await client
    .from("user_profiles")
    .update({
      display_name: displayName.data,
      first_name: firstName.data,
      last_name: lastName.data,
      preferred_name: preferredName.data,
      phone: phone.data
    })
    .eq("id", user.id);
  if (error) redirect("/account/profile?error=Unable to update the profile");
  await client.rpc("record_identity_event", {
    target_action: "profile.updated",
    target_metadata: {
      changed_fields: ["display_name", "first_name", "last_name", "preferred_name", "phone"]
    }
  });
  redirect("/account/profile?message=Profile updated");
}

export type PreferenceUpdate = {
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  timezone: string | null;
  locale: string;
};

export async function updatePreferencesAction(input: PreferenceUpdate) {
  const parsed = z
    .object({
      theme: z.enum(["light", "dark", "system"]),
      density: z.enum(["comfortable", "compact"]),
      timezone: z.string().trim().min(1).max(100).nullable(),
      locale: z.string().trim().min(2).max(20)
    })
    .safeParse(input);
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!parsed.success || !user || !client) return { ok: false as const };

  const { error } = await client
    .from("user_preferences")
    .update(parsed.data)
    .eq("user_id", user.id);
  return { ok: !error };
}
