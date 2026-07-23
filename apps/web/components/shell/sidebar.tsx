"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@closeoutflow/ui";

import { Brand } from "./brand";
import { PrimaryNavigation } from "./primary-navigation";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      aria-label="Application sidebar"
      className="app-sidebar fixed inset-y-0 left-0 z-sidebar hidden border-r border-hairline bg-background pb-[env(safe-area-inset-bottom)] lg:flex lg:flex-col"
    >
      <Brand />
      <PrimaryNavigation collapsed={collapsed} />
      <Button
        variant="ghost"
        className="m-2 h-9 w-9 shrink-0 self-end px-0 text-muted-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggle}
      >
        {collapsed ? (
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        ) : (
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        )}
      </Button>
    </aside>
  );
}
