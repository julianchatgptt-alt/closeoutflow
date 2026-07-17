"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge, Select } from "@closeoutflow/ui";

import { settingsNavigation } from "./navigation";

export function SettingsNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
      <aside aria-label="Settings sections">
        <div className="lg:hidden">
          <label htmlFor="settings-section" className="mb-1 block text-sm font-medium">
            Settings section
          </label>
          <Select
            id="settings-section"
            value={pathname}
            onChange={(event) => {
              window.location.href = event.target.value;
            }}
          >
            {settingsNavigation.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
                {"disabled" in item ? ` — Phase ${item.phase}` : ""}
              </option>
            ))}
          </Select>
        </div>
        <nav aria-label="Settings navigation" className="hidden gap-1 lg:grid">
          {settingsNavigation.map((item) => {
            const active = pathname === item.href;
            return "disabled" in item ? (
              <span
                key={item.href}
                aria-disabled="true"
                className="flex min-h-11 items-center rounded-md px-3 text-sm text-muted-foreground opacity-60"
              >
                {item.label}
                <Badge tone="neutral" className="ml-auto">
                  Phase {item.phase}
                </Badge>
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-lg px-3 text-[13.5px] transition-colors ${active ? "bg-[hsl(var(--sidebar-active))] font-semibold text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
