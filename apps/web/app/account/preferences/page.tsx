import { redirect } from "next/navigation";

import { PreferencesForm } from "../../../components/account/preferences-form";
import { createRequestAuthClient, getRequestUser } from "../../../lib/server-auth";

export const metadata = { title: "Preferences" };

export default async function PreferencesPage() {
  const user = await getRequestUser();
  const client = await createRequestAuthClient();
  if (!user || !client) redirect("/sign-in?next=/account/preferences");
  const { data } = await client
    .from("user_preferences")
    .select("theme,density,timezone,locale")
    .eq("user_id", user.id)
    .single();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-h1 font-semibold">Preferences</h1>
      <p className="mb-5 mt-1 text-muted-foreground">
        Keep theme, density, timezone, and locale consistent.
      </p>
      <PreferencesForm
        initial={{
          theme: data?.theme === "light" || data?.theme === "dark" ? data.theme : "system",
          density: data?.density === "compact" ? "compact" : "comfortable",
          timezone: data?.timezone ?? "America/New_York",
          locale: data?.locale ?? "en-US"
        }}
      />
    </main>
  );
}
