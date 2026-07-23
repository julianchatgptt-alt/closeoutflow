"use client";

import { Bell, Building2, ChevronDown, CircleHelp, Menu, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button, DropdownMenu, IconButton, Sheet } from "@closeoutflow/ui";

import { useTheme } from "../theme/theme-provider";
import { signOutAction } from "../../actions/auth";
import { selectOrganizationAction } from "../../actions/organizations";
import type { OrganizationContext } from "../../lib/organization-context";
import { Brand } from "./brand";
import { Breadcrumbs } from "./breadcrumbs";
import { PrimaryNavigation } from "./primary-navigation";

export function AppHeader({
  onOpenPalette,
  userName,
  organizationContext
}: {
  onOpenPalette: (trigger: HTMLElement) => void;
  userName: string;
  organizationContext: OrganizationContext;
}) {
  const pathname = usePathname();
  const { density, setDensity, theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-header flex h-14 items-center gap-1.5 border-b border-hairline bg-background px-3 pt-[env(safe-area-inset-top)] sm:gap-2 sm:px-4">
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
          <Button
            variant="ghost"
            size="sm"
            className="min-w-0 max-w-[10.5rem] justify-start px-2 sm:max-w-52"
            aria-label={`Switch organization: ${organizationContext.active?.displayName ?? "None"}`}
            title={organizationContext.active?.displayName}
          >
            <Building2 aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {organizationContext.active?.displayName ?? "Select organization"}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            />
          </Button>
        }
        items={[
          ...organizationContext.organizations.map((organization) => ({
            label: `${organization.id === organizationContext.active?.id ? "✓ " : ""}${organization.displayName}`,
            onSelect: () => void selectOrganizationAction(organization.id)
          })),
          {
            label: "Create organization",
            onSelect: () => void (window.location.href = "/onboarding")
          }
        ]}
      />
      <Breadcrumbs />
      <Button
        variant="outline"
        size="sm"
        className="hidden min-w-52 justify-between border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-surface/70 md:flex"
        onClick={(event) => onOpenPalette(event.currentTarget)}
      >
        <span className="flex items-center gap-2">
          <Search aria-hidden="true" className="h-4 w-4" />
          Search
        </span>
        <kbd className="rounded border bg-surface px-1.5 py-0.5 text-[11px]">⌘K</kbd>
      </Button>
      <IconButton
        label="Search"
        className="md:hidden"
        onClick={(event) => onOpenPalette(event.currentTarget)}
      >
        <Search aria-hidden="true" className="h-5 w-5" />
      </IconButton>
      {/* Notification delivery is not built yet. The bell stays quiet and tells
          the truth — never a fabricated unread count or invented items. */}
      <DropdownMenu
        trigger={
          <IconButton label="Notifications">
            <Bell aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        }
        items={[
          { label: "No notifications yet", disabled: true },
          { label: "Reminders arrive with the notifications system", disabled: true }
        ]}
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
          { label: userName, disabled: true },
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
          { label: "Sign out", onSelect: () => void signOutAction() }
        ]}
      />
    </header>
  );
}
