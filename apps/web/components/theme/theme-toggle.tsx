"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@closeoutflow/ui";

import { useTheme } from "./theme-provider";
import type { ThemePreference } from "./theme-script";

const options: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor }
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Theme preference">
      {options.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? "outline" : "ghost"}
          size="sm"
          aria-pressed={theme === value}
          aria-label={`${label} theme`}
          onClick={() => setTheme(value)}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
          {!compact && <span>{label}</span>}
        </Button>
      ))}
    </div>
  );
}
