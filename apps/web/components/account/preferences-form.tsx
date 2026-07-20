"use client";

import { useState } from "react";

import { Button, Input, Label, Select } from "@closeoutflow/ui";

import { updatePreferencesAction, type PreferenceUpdate } from "../../actions/account";
import { DENSITY_STORAGE_KEY, THEME_STORAGE_KEY } from "../theme/theme-script";

export function PreferencesForm({ initial }: { initial: PreferenceUpdate }) {
  const [preferences, setPreferences] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    const result = await updatePreferencesAction(preferences);
    if (!result.ok) {
      setStatus("error");
      return;
    }
    localStorage.setItem(THEME_STORAGE_KEY, preferences.theme);
    localStorage.setItem(DENSITY_STORAGE_KEY, preferences.density);
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.density = preferences.density;
    document.documentElement.classList.toggle("dark", preferences.theme === "dark");
    setStatus("saved");
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5 rounded-lg bg-surface p-5 shadow-card">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="theme">Theme</Label>
          <Select
            id="theme"
            value={preferences.theme}
            onChange={(event) =>
              setPreferences({
                ...preferences,
                theme: event.target.value as PreferenceUpdate["theme"]
              })
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="density">Density</Label>
          <Select
            id="density"
            value={preferences.density}
            onChange={(event) =>
              setPreferences({
                ...preferences,
                density: event.target.value as PreferenceUpdate["density"]
              })
            }
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={preferences.timezone ?? ""}
            onChange={(event) =>
              setPreferences({ ...preferences, timezone: event.target.value || null })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="locale">Locale</Label>
          <Input
            id="locale"
            value={preferences.locale}
            onChange={(event) => setPreferences({ ...preferences, locale: event.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={status === "saving"}>
          Save preferences
        </Button>
        <span role="status" className="text-sm text-muted-foreground">
          {status === "saved" ? "Preferences saved" : status === "error" ? "Unable to save" : ""}
        </span>
      </div>
    </form>
  );
}
