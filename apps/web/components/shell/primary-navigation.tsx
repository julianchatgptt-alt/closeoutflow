"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge, Tooltip } from "@closeoutflow/ui";

import { navigationGroups } from "./navigation";

/**
 * The active item is a light accent — tinted background, a 3px left accent bar
 * and accent text — rather than an oversized filled block, so the rail stays
 * quiet and the operational content leads.
 */
const itemBase =
  "relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors duration-[var(--dur-fast)]";
const itemActive =
  "bg-[hsl(var(--nav-item-active-bg))] font-semibold text-[hsl(var(--nav-item-active-fg))] before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-[hsl(var(--nav-item-active-accent))] before:content-['']";
const itemIdle = "text-muted-foreground hover:bg-surface-sunken hover:text-foreground";
// Meaning is carried by the "Later" chip, not by unreadably faint text.
const itemDisabled = "cursor-not-allowed text-subtle-foreground";

export function PrimaryNavigation({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary navigation"
      id="primary-navigation"
      className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 pb-3 pt-1"
    >
      {navigationGroups.map((group) => (
        <div key={group.id} className="grid gap-0.5">
          <p className="text-overline sidebar-expanded-only px-3 pb-1.5">{group.label}</p>
          {/* The group heading is hidden in the collapsed rail, so name the list. */}
          <ul aria-label={group.label} className="grid list-none gap-0.5 p-0">
            {group.items.map((item) => {
              const disabled = item.disabled === true;
              const active =
                !disabled && (pathname === item.href || pathname.startsWith(`${item.href}/`));
              const Icon = item.icon;
              const classes = `${itemBase} ${active ? itemActive : disabled ? itemDisabled : itemIdle}`;
              const content = (
                <>
                  <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                  <span className="sidebar-expanded-only">{item.label}</span>
                  {disabled ? (
                    <Badge tone="neutral" className="sidebar-expanded-only ml-auto">
                      Later
                    </Badge>
                  ) : null}
                </>
              );

              if (disabled) {
                return (
                  <li key={item.href}>
                    <Tooltip content={`${item.label} arrives in a later phase`}>
                      <span aria-disabled="true" className={classes}>
                        {content}
                        <span className="sr-only"> — not available yet</span>
                      </span>
                    </Tooltip>
                  </li>
                );
              }

              const link = (
                <Link
                  href={item.href}
                  aria-label={item.label}
                  {...(active ? { "aria-current": "page" as const } : {})}
                  className={classes}
                >
                  {content}
                </Link>
              );

              return (
                <li key={item.href}>
                  {collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
