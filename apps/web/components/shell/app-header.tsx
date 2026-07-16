"use client";

import { Bell, CircleHelp, Menu, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button, DropdownMenu, IconButton, Sheet } from "@closeoutflow/ui";

import { useTheme } from "../theme/theme-provider";
import { Brand } from "./brand";
import { Breadcrumbs } from "./breadcrumbs";
import { PrimaryNavigation } from "./primary-navigation";

export function AppHeader({ onOpenPalette }: { onOpenPalette: (trigger: HTMLElement) => void }) {
  const pathname = usePathname();
  const { density, setDensity, theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-header flex h-14 items-center gap-2 border-b bg-surface px-3 sm:px-4">
      <div className="lg:hidden">
        <Sheet
          key={pathname}
          title="Closeout navigation"
          trigger={
            <IconButton label="Open navigation">
              <Menu aria-hidden="true" className="h-5 w-5" />
            </IconButton>
          }
        >
          <Brand />
          <PrimaryNavigation />
        </Sheet>
      </div>
      <DropdownMenu
        trigger={
          <Button variant="ghost" size="sm" className="max-w-52 truncate">
            Sample Construction Co. <span aria-hidden="true">⌄</span>
          </Button>
        }
        items={[
          { label: "Sample Construction Co." },
          { label: "Create organization — Phase 4", disabled: true }
        ]}
      />
      <Breadcrumbs />
      <Button
        variant="outline"
        size="sm"
        className="hidden min-w-52 justify-between text-muted-foreground md:flex"
        onClick={(event) => onOpenPalette(event.currentTarget)}
      >
        <span className="flex items-center gap-2">
          <Search aria-hidden="true" className="h-4 w-4" />
          Search sample data
        </span>
        <kbd>⌘K</kbd>
      </Button>
      <IconButton
        label="Search"
        className="md:hidden"
        onClick={(event) => onOpenPalette(event.currentTarget)}
      >
        <Search aria-hidden="true" className="h-5 w-5" />
      </IconButton>
      <DropdownMenu
        trigger={
          <IconButton label="Notifications">
            <Bell aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        }
        items={[{ label: "No notifications yet", disabled: true }]}
      />
      <DropdownMenu
        trigger={
          <IconButton label="Help">
            <CircleHelp aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        }
        items={[
          { label: "Keyboard shortcuts" },
          { label: "Contact support — preview", disabled: true }
        ]}
      />
      <DropdownMenu
        trigger={
          <IconButton label="User menu">
            <UserRound aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        }
        items={[
          { label: "Jordan Lee — Preview", disabled: true },
          {
            label: `${theme === "system" ? "✓ " : ""}Use system theme`,
            onSelect: () => setTheme("system")
          },
          {
            label: `${theme === "light" ? "✓ " : ""}Use light theme`,
            onSelect: () => setTheme("light")
          },
          {
            label: `${theme === "dark" ? "✓ " : ""}Use dark theme`,
            onSelect: () => setTheme("dark")
          },
          {
            label: `Density: ${density}`,
            onSelect: () => setDensity(density === "compact" ? "comfortable" : "compact")
          },
          { label: "Sign out — Phase 4", disabled: true }
        ]}
      />
    </header>
  );
}
