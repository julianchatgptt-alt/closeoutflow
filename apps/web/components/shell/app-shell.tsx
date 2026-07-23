"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SIDEBAR_STORAGE_KEY } from "../theme/theme-script";
import { AppHeader } from "./app-header";
import { BreadcrumbProvider } from "./breadcrumb-context";
import { CommandPalette } from "./command-palette";
import { ProjectSubnav } from "./project-subnav";
import { Sidebar } from "./sidebar";
import type { OrganizationContext } from "../../lib/organization-context";

/**
 * Operational surfaces — registers, directories and list pages — get the wide
 * content width so wide tables are not squeezed. Forms, detail and settings
 * pages keep the narrower reading width.
 */
const OPERATIONAL_ROUTES = [
  /^\/dashboard$/,
  /^\/projects$/,
  /^\/companies$/,
  /^\/contacts$/,
  /^\/templates$/,
  /^\/projects\/[^/]+\/requirements$/
];

function isOperationalRoute(pathname: string) {
  return OPERATIONAL_ROUTES.some((pattern) => pattern.test(pathname));
}

export function AppShell({
  children,
  userName,
  organizationContext
}: {
  children: React.ReactNode;
  userName: string;
  organizationContext: OrganizationContext;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteTrigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setCollapsed(document.documentElement.dataset.sidebar === "collapsed"),
      0
    );
    return () => window.clearTimeout(timer);
  }, []);

  const openPalette = useCallback((trigger?: HTMLElement | null) => {
    paletteTrigger.current = trigger ?? (document.activeElement as HTMLElement | null);
    setPaletteOpen(true);
  }, []);
  const toggleSidebar = useCallback(() => {
    setCollapsed((current) => {
      const value = !current;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? "collapsed" : "expanded");
      document.documentElement.dataset.sidebar = value ? "collapsed" : "expanded";
      return value;
    });
  }, []);

  useEffect(() => {
    let pending = "";
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.matches("input, textarea, select, [contenteditable=true]");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette(target);
        return;
      }
      if (typing) return;
      if (event.key === "/") {
        event.preventDefault();
        openPalette(target);
      } else if (event.key === "[") toggleSidebar();
      else if (pending === "g" && event.key === "p") {
        router.push("/projects");
        pending = "";
      } else if (pending === "g" && event.key === "d") {
        router.push("/dashboard");
        pending = "";
      } else pending = event.key === "g" ? "g" : "";
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPalette, router, toggleSidebar]);

  return (
    <BreadcrumbProvider>
      <div className="app-shell min-h-screen bg-background">
        <a
          href="#main"
          className="fixed left-3 top-2 z-[1000] -translate-y-20 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:translate-y-0"
        >
          Skip to main content
        </a>
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
        <AppHeader
          onOpenPalette={openPalette}
          userName={userName}
          organizationContext={organizationContext}
        />
        <ProjectSubnav />
        <main
          id="main"
          tabIndex={-1}
          className={`mx-auto w-full p-[var(--page-gutter)] pb-[max(var(--page-gutter),env(safe-area-inset-bottom))] ${
            isOperationalRoute(pathname) ? "max-w-content-wide" : "max-w-content"
          }`}
        >
          {children}
        </main>
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          returnFocusRef={paletteTrigger}
        />
      </div>
    </BreadcrumbProvider>
  );
}
