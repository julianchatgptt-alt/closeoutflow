"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge, Tooltip } from "@closeoutflow/ui";

import { globalNavigation } from "./navigation";

export function PrimaryNavigation({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary navigation"
      id="primary-navigation"
      className="flex flex-1 flex-col gap-1 p-2"
    >
      {globalNavigation.map((item, index) => {
        const disabled = "disabled" in item;
        const active =
          !disabled && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
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
        const classes = `flex min-h-11 items-center gap-3 rounded-md border-l-2 px-3 text-sm font-medium ${active ? "border-primary bg-info-subtle text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"} ${disabled ? "cursor-not-allowed opacity-55" : ""} ${index === 4 ? "mt-auto" : ""}`;
        if (disabled)
          return (
            <Tooltip key={item.href} content={`Available in Phase ${item.phase}`}>
              <span aria-disabled="true" className={classes}>
                {content}
              </span>
            </Tooltip>
          );
        const link = (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={classes}
          >
            {content}
          </Link>
        );
        return collapsed ? (
          <Tooltip key={item.href} content={item.label}>
            {link}
          </Tooltip>
        ) : (
          link
        );
      })}
    </nav>
  );
}
